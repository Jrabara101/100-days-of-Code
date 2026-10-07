import { useRef, useCallback, useEffect } from 'react';
import { globalAudioEngine } from '../audio/RhythmAudioEngine';

export interface RhythmClockOptions {
  audioOffsetMs?: number; // User hardware latency offset (calibration)
  chartOffsetMs?: number; // Song-specific offset
}

export function useRhythmClock(options: RhythmClockOptions = {}) {
  const { audioOffsetMs = 0, chartOffsetMs = 0 } = options;

  // Refs holding clock telemetry to ensure zero React re-renders during high-frequency clock checks
  const isRunningRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const audioContextStartRef = useRef<number>(0);
  const perfStartRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const accumulatedPauseTimeRef = useRef<number>(0);

  // Latency offset refs so changes take effect immediately without clock reset
  const userOffsetRef = useRef<number>(audioOffsetMs);
  const chartOffsetRef = useRef<number>(chartOffsetMs);

  useEffect(() => {
    userOffsetRef.current = audioOffsetMs;
  }, [audioOffsetMs]);

  useEffect(() => {
    chartOffsetRef.current = chartOffsetMs;
  }, [chartOffsetMs]);

  const startClock = useCallback((leadInMs: number = 0) => {
    const ctx = globalAudioEngine.init();
    const audioNow = ctx ? ctx.currentTime : 0;
    const perfNow = performance.now();

    audioContextStartRef.current = audioNow - (leadInMs / 1000);
    perfStartRef.current = perfNow - leadInMs;
    accumulatedPauseTimeRef.current = 0;
    pauseTimeRef.current = 0;
    isPausedRef.current = false;
    isRunningRef.current = true;
  }, []);

  const pauseClock = useCallback(() => {
    if (!isRunningRef.current || isPausedRef.current) return;
    isPausedRef.current = true;
    pauseTimeRef.current = performance.now();
  }, []);

  const resumeClock = useCallback(() => {
    if (!isRunningRef.current || !isPausedRef.current) return;
    const now = performance.now();
    accumulatedPauseTimeRef.current += (now - pauseTimeRef.current);
    isPausedRef.current = false;
  }, []);

  const stopClock = useCallback(() => {
    isRunningRef.current = false;
    isPausedRef.current = false;
    accumulatedPauseTimeRef.current = 0;
  }, []);

  /**
   * Continuous Sub-Millisecond Clock Retrieval
   * Combines Web Audio AudioContext.currentTime with high-res performance.now()
   * and applies user latency calibrator offset.
   */
  const getCurrentSongTimeMs = useCallback((): number => {
    if (!isRunningRef.current) return 0;

    const ctx = globalAudioEngine.getAudioContext();
    let elapsedMs = 0;

    if (ctx && ctx.state === 'running' && audioContextStartRef.current > 0) {
      // AudioContext hardware clock
      const audioElapsed = ctx.currentTime - audioContextStartRef.current;
      elapsedMs = audioElapsed * 1000;
    } else {
      // Fallback high-res monotonic clock
      const now = performance.now();
      const currentPause = isPausedRef.current ? (now - pauseTimeRef.current) : 0;
      elapsedMs = now - perfStartRef.current - accumulatedPauseTimeRef.current - currentPause;
    }

    // Apply song chart offset + player hardware latency offset
    // Positive offset means notes appear sooner/player was hitting late
    const calibratedTime = elapsedMs - userOffsetRef.current + chartOffsetRef.current;
    return calibratedTime;
  }, []);

  return {
    startClock,
    pauseClock,
    resumeClock,
    stopClock,
    getCurrentSongTimeMs,
    isRunning: isRunningRef,
    isPaused: isPausedRef,
  };
}
