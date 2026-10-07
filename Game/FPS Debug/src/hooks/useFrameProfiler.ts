import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  DiagnosticSnapshot,
  HardwareProfile,
  PerformanceSummary,
} from '../types/telemetry';
import { Float32CircularBuffer, IncidentFlightRecorder } from '../utils/circularBuffer';
import { getHardwareProfile, getMemoryStats } from '../utils/hardware';
import { chaosEngine } from '../services/chaosEngine';

export interface UseFrameProfilerReturn {
  metrics: PerformanceSummary;
  hardware: HardwareProfile | null;
  ringBuffer: Float32CircularBuffer;
  flightRecorder: IncidentFlightRecorder;
  isStuttering: boolean;
  stutterCount: number;
  snapshots: DiagnosticSnapshot[];
  takeSnapshot: (reason?: string) => DiagnosticSnapshot;
  deleteSnapshot: (id: string) => void;
  resetCounters: () => void;
}

export function useFrameProfiler(): UseFrameProfilerReturn {
  // Pre-allocated typed circular buffer: 1800 samples = 15s at 120 FPS, 30s at 60 FPS
  const ringBufferRef = useRef<Float32CircularBuffer>(new Float32CircularBuffer(1800));
  const flightRecorderRef = useRef<IncidentFlightRecorder>(new IncidentFlightRecorder(1800));

  // Hardware profile
  const [hardware, setHardware] = useState<HardwareProfile | null>(null);

  // Stutter indicator state (active for ~150ms upon a severe frame hitch)
  const [isStuttering, setIsStuttering] = useState<boolean>(false);
  const [stutterCount, setStutterCount] = useState<number>(0);
  const stutterTimeoutRef = useRef<any>(null);

  // Diagnostic snapshots recorded by user or automated triggers
  const [snapshots, setSnapshots] = useState<DiagnosticSnapshot[]>([]);

  // Performance Summary state synced to React at a controlled cadence (~5-8Hz) to prevent render thrashing
  const [metrics, setMetrics] = useState<PerformanceSummary>({
    currentFps: 60,
    averageFps: 60,
    onePercentLowFps: 60,
    pointOnePercentLowFps: 60,
    currentFrameTimeMs: 16.66,
    maxFrameTimeMs: 16.66,
    minFrameTimeMs: 16.66,
    totalFrames: 0,
    droppedFrames: 0,
    longTaskCount: 0,
    memoryUsedMb: undefined,
    memoryLimitMb: undefined,
    stabilityScore: 100,
  });

  // Profiler internal tracking refs
  const totalFramesRef = useRef<number>(0);
  const droppedFramesRef = useRef<number>(0);
  const longTaskCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number>(0);
  const lastStateSyncRef = useRef<number>(0);

  // Load hardware profile on mount
  useEffect(() => {
    let mounted = true;
    getHardwareProfile().then((profile) => {
      if (mounted) {
        setHardware(profile);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // PerformanceObserver for Long Tasks (>50ms freezes) and Layout Shifts
  useEffect(() => {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

    let longTaskObserver: PerformanceObserver | null = null;
    try {
      if (PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
        longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTaskCountRef.current++;
            flightRecorderRef.current.recordLongTask(entry.duration, entry.startTime, entry.name);

            // Long tasks are severe hitches: trigger tremor
            setIsStuttering(true);
            setStutterCount(c => c + 1);
            if (stutterTimeoutRef.current) clearTimeout(stutterTimeoutRef.current);
            stutterTimeoutRef.current = setTimeout(() => setIsStuttering(false), 200);
          }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      }
    } catch (e) {
      console.warn('LongTask observer initialization skipped:', e);
    }

    // Intercept uncaught errors for flight recorder
    const handleError = (event: ErrorEvent) => {
      flightRecorderRef.current.recordError(event.message, event.error?.stack);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      flightRecorderRef.current.recordError(`Unhandled Promise: ${String(event.reason)}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      if (longTaskObserver) longTaskObserver.disconnect();
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Dedicated High-Precision requestAnimationFrame Measurement Loop
  useEffect(() => {
    let running = true;
    lastTimeRef.current = performance.now();

    const tick = (now: DOMHighResTimeStamp) => {
      if (!running) return;

      // 1. Chaos Engine frame cap & throttling check
      const shouldRender = chaosEngine.shouldRenderFrame(now);
      if (!shouldRender) {
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      // 2. Sub-millisecond delta calculation strictly via window.performance.now()
      const deltaMs = Math.max(0.1, now - lastTimeRef.current);
      lastTimeRef.current = now;

      // 3. Inject simulated CPU delays if chaos settings are active
      chaosEngine.applyFrameThrottling();

      // 4. Update ring buffer (Zero allocation Float32Array write)
      ringBufferRef.current.push(deltaMs);
      totalFramesRef.current++;

      // Instant FPS clamped to reasonable bounds
      const instantFps = Math.min(360, Math.max(1, 1000 / deltaMs));

      // 5. Stutter / Hitch Detection (>33.3ms is <30 FPS)
      const targetThreshold = hardware?.screenRefreshRate && hardware.screenRefreshRate >= 120 ? 16.66 : 33.33;
      const isHitch = deltaMs > targetThreshold;

      if (isHitch) {
        droppedFramesRef.current++;
        setIsStuttering(true);
        setStutterCount(c => c + 1);
        if (stutterTimeoutRef.current) clearTimeout(stutterTimeoutRef.current);
        stutterTimeoutRef.current = setTimeout(() => setIsStuttering(false), 160);
      }

      // 6. Record to 15s incident flight recorder
      flightRecorderRef.current.recordFrame({
        timestamp: now,
        deltaMs,
        instantFps,
        isLongTask: isHitch,
        heapUsedMb: getMemoryStats().usedMb,
      });

      // 7. Decoupled React state sync at ~6Hz (every ~160ms) to maintain <0.05ms profiling overhead
      if (now - lastStateSyncRef.current >= 160) {
        lastStateSyncRef.current = now;

        const buffer = ringBufferRef.current;
        const avgFrameTime = buffer.average(60) || 16.66;
        const avgFps = Math.min(360, Math.max(1, 1000 / avgFrameTime));
        const { min, max } = buffer.minMax(60);
        const { onePercentLowFps, pointOnePercentLowFps } = buffer.calculatePercentiles(180);

        // Stability score: ratio of target frame time vs average, penalized by dropped frames and hitches
        const targetRate = hardware?.screenRefreshRate || 60;
        const targetMs = 1000 / targetRate;
        const ratio = Math.min(1, targetMs / Math.max(targetMs, avgFrameTime));
        const penalty = Math.min(40, (droppedFramesRef.current / Math.max(1, totalFramesRef.current)) * 400 + longTaskCountRef.current * 4);
        const stabilityScore = Math.max(5, Math.min(100, Math.round((ratio * 100 - penalty) * 10) / 10));

        const mem = getMemoryStats();

        setMetrics({
          currentFps: Math.round(instantFps * 10) / 10,
          averageFps: Math.round(avgFps * 10) / 10,
          onePercentLowFps: Math.round(onePercentLowFps * 10) / 10,
          pointOnePercentLowFps: Math.round(pointOnePercentLowFps * 10) / 10,
          currentFrameTimeMs: Math.round(deltaMs * 100) / 100,
          maxFrameTimeMs: Math.round(max * 100) / 100,
          minFrameTimeMs: Math.round(min * 100) / 100,
          totalFrames: totalFramesRef.current,
          droppedFrames: droppedFramesRef.current,
          longTaskCount: longTaskCountRef.current,
          memoryUsedMb: mem.usedMb,
          memoryLimitMb: mem.limitMb,
          stabilityScore,
        });
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafIdRef.current);
      if (stutterTimeoutRef.current) clearTimeout(stutterTimeoutRef.current);
    };
  }, [hardware]);

  // Method to take a black-box diagnostic snapshot
  const takeSnapshot = useCallback((reason: string = 'Manual Diagnostic Capture'): DiagnosticSnapshot => {
    const hw = hardware || {
      gpuRenderer: 'Detecting GPU...',
      cores: 4,
      screenRefreshRate: 60,
      dpr: window.devicePixelRatio || 1,
      userAgent: navigator.userAgent,
      webglVersion: 'WebGL 2.0',
      maxTextureSize: 4096,
    };

    const recentFrames = ringBufferRef.current.getLastN(180);
    const snapshot: DiagnosticSnapshot = {
      id: `snap-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      hardware: hw,
      metrics: { ...metrics },
      recentFrameHistory: recentFrames,
      longTaskLogs: flightRecorderRef.current.getLongTasks(),
      errorLogs: flightRecorderRef.current.getErrors(),
      incidentReason: reason,
    };

    setSnapshots((prev) => [snapshot, ...prev].slice(0, 20));
    return snapshot;
  }, [hardware, metrics]);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const resetCounters = useCallback(() => {
    totalFramesRef.current = 0;
    droppedFramesRef.current = 0;
    longTaskCountRef.current = 0;
    setStutterCount(0);
    ringBufferRef.current.clear();
    flightRecorderRef.current.clear();
  }, []);

  return {
    metrics,
    hardware,
    ringBuffer: ringBufferRef.current,
    flightRecorder: flightRecorderRef.current,
    isStuttering,
    stutterCount,
    snapshots,
    takeSnapshot,
    deleteSnapshot,
    resetCounters,
  };
}
