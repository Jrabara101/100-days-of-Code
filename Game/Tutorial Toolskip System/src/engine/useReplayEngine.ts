import { useState, useRef, useEffect, useCallback } from 'react';
import {
  EntityState,
  KeyframeSnapshot,
  PlaybackStatus,
  PlayerInputPacket,
  ReplayEventMarker,
  ReplayMetadata,
  ReplayPayload,
  ReplaySessionState,
} from '../types/replay';
import { ReplayRingBuffer } from './RingBuffer';
import { interpolateEntities } from './Interpolator';
import { SAMPLE_REPLAYS } from '../game/SampleReplays';

export function useReplayEngine(initialPayload?: ReplayPayload) {
  const [session, setSession] = useState<ReplaySessionState>({
    status: 'PAUSED',
    currentTick: 0,
    totalTicks: initialPayload ? initialPayload.metadata.totalTicks : 1500,
    playbackSpeed: 1.0,
    isLooping: true,
    loopRange: null,
    activeMarkerId: null,
    isGhostEnabled: true,
    ghostReplayData: SAMPLE_REPLAYS['ghost-rival'].metadata,
  });

  const [activeMetadata, setActiveMetadata] = useState<ReplayMetadata>(
    initialPayload ? initialPayload.metadata : SAMPLE_REPLAYS['clutch-solo'].metadata
  );

  const [activeMarker, setActiveMarker] = useState<ReplayEventMarker | null>(null);
  const [currentInput, setCurrentInput] = useState<PlayerInputPacket | null>(null);
  const [interpolatedEntities, setInterpolatedEntities] = useState<EntityState[]>([]);
  const [ghostEntities, setGhostEntities] = useState<EntityState[]>([]);
  const [memoryBytes, setMemoryBytes] = useState<number>(1024 * 350);

  // Buffer and high-precision timing refs
  const ringBufferRef = useRef<ReplayRingBuffer>(new ReplayRingBuffer());
  const primaryPayloadRef = useRef<ReplayPayload>(initialPayload || SAMPLE_REPLAYS['clutch-solo']);
  const ghostPayloadRef = useRef<ReplayPayload | null>(SAMPLE_REPLAYS['ghost-rival']);

  // Precise accumulator decoupled from React
  const currentTickRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const speedRef = useRef<number>(1.0);
  const isLoopingRef = useRef<boolean>(true);
  const loopRangeRef = useRef<[number, number] | null>(null);
  const isGhostEnabledRef = useRef<boolean>(true);
  const statusRef = useRef<PlaybackStatus>('PAUSED');

  // Sync refs when state changes
  useEffect(() => {
    speedRef.current = session.playbackSpeed;
    isLoopingRef.current = session.isLooping;
    loopRangeRef.current = session.loopRange;
    isGhostEnabledRef.current = session.isGhostEnabled;
    statusRef.current = session.status;
    isPlayingRef.current = session.status === 'PLAYING' || session.status === 'SLOW_MO';
  }, [session.playbackSpeed, session.isLooping, session.loopRange, session.isGhostEnabled, session.status]);

  // Load active replay payload into engine
  const loadReplay = useCallback((payload: ReplayPayload) => {
    primaryPayloadRef.current = payload;
    setActiveMetadata(payload.metadata);
    currentTickRef.current = 0;
    accumulatorRef.current = 0;

    // Reset ring buffer and seed with loaded keyframes & inputs
    ringBufferRef.current.reset();
    for (const inp of payload.inputs) {
      ringBufferRef.current.pushInput(inp);
    }
    for (const kf of payload.keyframes) {
      ringBufferRef.current.pushKeyframe(kf);
    }
    for (const m of payload.metadata.markers) {
      ringBufferRef.current.addMarker(m);
    }

    setMemoryBytes(ringBufferRef.current.estimateMemoryBytes());

    setSession(prev => ({
      ...prev,
      status: 'PAUSED',
      currentTick: 0,
      totalTicks: payload.metadata.totalTicks,
      loopRange: null,
      activeMarkerId: null,
    }));
  }, []);

  // Load secondary ghost replay
  const loadGhostReplay = useCallback((payload: ReplayPayload | null) => {
    ghostPayloadRef.current = payload;
    setSession(prev => ({
      ...prev,
      ghostReplayData: payload ? payload.metadata : null,
    }));
  }, []);

  // Update entity frames & find active bookmark
  const updateTickRender = useCallback((tick: number) => {
    const payload = primaryPayloadRef.current;
    if (!payload || payload.keyframes.length === 0) return;

    // Find bounding keyframes in primary replay
    const keyframes = payload.keyframes;
    let prevKf = keyframes[0];
    let nextKf = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].tick <= tick) prevKf = keyframes[i];
      if (keyframes[i].tick >= tick) {
        nextKf = keyframes[i];
        break;
      }
    }

    const currentEntities = interpolateEntities(prevKf, nextKf, tick);
    setInterpolatedEntities(currentEntities);

    // Primary current input for HUD
    if (payload.inputs && payload.inputs.length > 0) {
      const idx = Math.min(tick, payload.inputs.length - 1);
      setCurrentInput(payload.inputs[idx] || null);
    }

    // Ghost interpolation if enabled
    if (isGhostEnabledRef.current && ghostPayloadRef.current && ghostPayloadRef.current.keyframes.length > 0) {
      const gKfs = ghostPayloadRef.current.keyframes;
      let gPrev = gKfs[0];
      let gNext = gKfs[gKfs.length - 1];
      for (let i = 0; i < gKfs.length; i++) {
        if (gKfs[i].tick <= tick) gPrev = gKfs[i];
        if (gKfs[i].tick >= tick) {
          gNext = gKfs[i];
          break;
        }
      }
      setGhostEntities(interpolateEntities(gPrev, gNext, tick));
    } else {
      setGhostEntities([]);
    }

    // Check Climax Marker proximity (within 12 ticks)
    const markers = payload.metadata.markers;
    const matchMarker = markers.find(m => Math.abs(m.tick - tick) <= 12);
    if (matchMarker) {
      setActiveMarker(matchMarker);
    } else {
      setActiveMarker(null);
    }
  }, []);

  // Direct Seek to Tick
  const seekToTick = useCallback((targetTick: number) => {
    const totalTicks = primaryPayloadRef.current.metadata.totalTicks;
    const clamped = Math.max(0, Math.min(totalTicks, Math.round(targetTick)));
    currentTickRef.current = clamped;
    accumulatorRef.current = 0;

    setSession(prev => ({
      ...prev,
      currentTick: clamped,
      status: prev.status === 'RECORDING' ? 'RECORDING' : 'PAUSED',
    }));

    updateTickRender(clamped);
  }, [updateTickRender]);

  // Step Frame (-1 or +1)
  const stepFrame = useCallback((deltaTicks: number) => {
    const totalTicks = primaryPayloadRef.current.metadata.totalTicks;
    const nextTick = Math.max(0, Math.min(totalTicks, currentTickRef.current + deltaTicks));
    currentTickRef.current = nextTick;
    accumulatorRef.current = 0;

    setSession(prev => ({
      ...prev,
      currentTick: nextTick,
      status: 'PAUSED',
    }));

    updateTickRender(nextTick);
  }, [updateTickRender]);

  // Jump by seconds (+5s or -5s)
  const jumpTime = useCallback((deltaSeconds: number) => {
    stepFrame(Math.round(deltaSeconds * 60));
  }, [stepFrame]);

  // Play / Pause toggles
  const play = useCallback(() => {
    const isSlow = speedRef.current < 1.0;
    setSession(prev => ({
      ...prev,
      status: isSlow ? 'SLOW_MO' : 'PLAYING',
    }));
    lastTimeRef.current = performance.now();
  }, []);

  const pause = useCallback(() => {
    setSession(prev => ({
      ...prev,
      status: 'PAUSED',
    }));
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  // Speed changes
  const setSpeed = useCallback((newSpeed: number) => {
    speedRef.current = newSpeed;
    setSession(prev => ({
      ...prev,
      playbackSpeed: newSpeed,
      status: isPlayingRef.current ? (newSpeed < 1.0 ? 'SLOW_MO' : 'PLAYING') : prev.status,
    }));
  }, []);

  // Loop Range toggles
  const toggleLoop = useCallback(() => {
    setSession(prev => ({ ...prev, isLooping: !prev.isLooping }));
  }, []);

  const setLoopRange = useCallback((range: [number, number] | null) => {
    setSession(prev => ({ ...prev, loopRange: range }));
  }, []);

  // Ghost Toggle
  const toggleGhost = useCallback(() => {
    setSession(prev => ({ ...prev, isGhostEnabled: !prev.isGhostEnabled }));
  }, []);

  // Recording State Handlers
  const startRecording = useCallback((title: string = 'Live Match Flight Record') => {
    ringBufferRef.current.reset();
    currentTickRef.current = 0;
    accumulatorRef.current = 0;

    const newMeta: ReplayMetadata = {
      replayId: `rec-${Date.now().toString(36)}`,
      gameTitle: title,
      authorName: 'Local Player',
      recordedAt: new Date().toISOString(),
      totalTicks: 0,
      durationMs: 0,
      tickRate: 60,
      checksum: '',
      markers: [],
    };

    setActiveMetadata(newMeta);
    setSession(prev => ({
      ...prev,
      status: 'RECORDING',
      currentTick: 0,
      totalTicks: 0,
    }));
  }, []);

  const stopRecording = useCallback(() => {
    const pkg = ringBufferRef.current.exportDataPackage(activeMetadata, `sha256-rec-${Date.now().toString(36)}`);
    primaryPayloadRef.current = pkg;
    setActiveMetadata(pkg.metadata);

    setSession(prev => ({
      ...prev,
      status: 'PAUSED',
      totalTicks: pkg.metadata.totalTicks,
      currentTick: 0,
    }));

    seekToTick(0);
  }, [activeMetadata, seekToTick]);

  // Feed live game ticks during recording
  const feedLiveTick = useCallback((input: PlayerInputPacket, snapshot?: KeyframeSnapshot) => {
    ringBufferRef.current.pushInput(input);
    if (snapshot) {
      ringBufferRef.current.pushKeyframe(snapshot);
    }
    currentTickRef.current = input.tick;
    setMemoryBytes(ringBufferRef.current.estimateMemoryBytes());

    setSession(prev => ({
      ...prev,
      currentTick: input.tick,
      totalTicks: input.tick,
    }));
  }, []);

  const addMarker = useCallback((marker: Omit<ReplayEventMarker, 'id'>) => {
    const fullMarker: ReplayEventMarker = {
      ...marker,
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    ringBufferRef.current.addMarker(fullMarker);
    setActiveMetadata(prev => ({
      ...prev,
      markers: [...prev.markers, fullMarker],
    }));
  }, []);

  // High-Precision 60Hz Fixed-Timestep Timing Loop decoupled from React
  useEffect(() => {
    const tickStep = 1000 / 60; // 16.666ms per tick

    const loop = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      const dt = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      if (isPlayingRef.current) {
        // Accumulate time multiplied by playbackSpeed
        accumulatorRef.current += dt * speedRef.current;

        let advanced = false;
        while (accumulatorRef.current >= tickStep) {
          accumulatorRef.current -= tickStep;
          currentTickRef.current += 1;
          advanced = true;

          // Check loop boundary
          const total = primaryPayloadRef.current.metadata.totalTicks;
          const range = loopRangeRef.current;

          if (range) {
            if (currentTickRef.current > range[1]) {
              if (isLoopingRef.current) {
                currentTickRef.current = range[0];
              } else {
                currentTickRef.current = range[1];
                pause();
                break;
              }
            }
          } else if (currentTickRef.current >= total) {
            if (isLoopingRef.current) {
              currentTickRef.current = 0;
            } else {
              currentTickRef.current = total;
              pause();
              break;
            }
          }
        }

        if (advanced) {
          const tick = currentTickRef.current;
          setSession(prev => ({ ...prev, currentTick: tick }));
          updateTickRender(tick);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [updateTickRender, pause]);

  // Initial render of tick 0
  useEffect(() => {
    updateTickRender(0);
  }, [updateTickRender]);

  return {
    session,
    metadata: activeMetadata,
    currentInput,
    interpolatedEntities,
    ghostEntities,
    activeMarker,
    memoryBytes,
    ringBuffer: ringBufferRef.current,
    primaryPayload: primaryPayloadRef.current,
    ghostPayload: ghostPayloadRef.current,
    // Actions
    play,
    pause,
    togglePlay,
    seekToTick,
    stepFrame,
    jumpTime,
    setSpeed,
    toggleLoop,
    setLoopRange,
    toggleGhost,
    loadReplay,
    loadGhostReplay,
    startRecording,
    stopRecording,
    feedLiveTick,
    addMarker,
  };
}
