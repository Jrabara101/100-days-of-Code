import { useEffect, useRef, useState, useCallback } from 'react';
import {
  EndlessRunnerGameState,
  GameSettings,
  GhostData,
  LaneIndex,
  RunSubmissionPayload,
  TrackChunk,
} from '../types/game';
import { RunnerPhysicsEngine, FIXED_DT } from './physics';
import { Canvas3DRenderer } from './renderer';
import { CHUNK_LENGTH, ProceduralTrackDirector } from './procedural';
import { soundManager } from './audio';

export interface UseRunnerEngineProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  seed: string;
  ghostData: GhostData | null;
  settings: GameSettings;
  onGameOver: (payload: RunSubmissionPayload) => void;
}

export function useRunnerEngine({
  canvasRef,
  seed,
  ghostData,
  settings,
  onGameOver,
}: UseRunnerEngineProps) {
  // Throttled HUD state exposed to React UI
  const [hudState, setHudState] = useState<EndlessRunnerGameState>({
    status: 'IDLE',
    seed,
    distanceMeters: 0,
    currentSpeed: 24,
    score: 0,
    coinsCollected: 0,
    nearMissCount: 0,
    overdriveGauge: 0,
    isOverdriveActive: false,
    activePowerUps: [],
    ghostDistanceMeters: 0,
  });

  // Engine refs to decouple game loop from React renders
  const physicsEngineRef = useRef<RunnerPhysicsEngine | null>(null);
  const rendererRef = useRef<Canvas3DRenderer | null>(null);
  const trackDirectorRef = useRef<ProceduralTrackDirector | null>(null);
  const activeChunksRef = useRef<TrackChunk[]>([]);
  const chunkIndexCounterRef = useRef<number>(0);

  const isRunningRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const hudThrottleTimerRef = useRef<number>(0);

  // Settings ref to access latest in animation frame without re-subscribing
  const settingsRef = useRef<GameSettings>(settings);
  useEffect(() => {
    settingsRef.current = settings;
    soundManager.setVolumes(settings.masterVolume, settings.sfxVolume);
  }, [settings]);

  // Touch gesture tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Initialize or restart engine
  const startRun = useCallback(() => {
    if (!canvasRef.current) return;

    soundManager.setVolumes(settingsRef.current.masterVolume, settingsRef.current.sfxVolume);

    const physics = new RunnerPhysicsEngine(seed);
    const director = new ProceduralTrackDirector(seed);
    const renderer = new Canvas3DRenderer(canvasRef.current);

    physicsEngineRef.current = physics;
    trackDirectorRef.current = director;
    rendererRef.current = renderer;

    // Seed initial 4 pooled chunks (0 to 640 meters)
    chunkIndexCounterRef.current = 0;
    const initialChunks: TrackChunk[] = [];
    for (let i = 0; i < 4; i++) {
      initialChunks.push(director.generateChunk(i));
      chunkIndexCounterRef.current++;
    }
    activeChunksRef.current = initialChunks;

    isRunningRef.current = true;
    isPausedRef.current = false;
    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;

    physics.state.status = 'RUNNING';
    setHudState({ ...physics.state });
  }, [canvasRef, seed]);

  const pauseRun = useCallback(() => {
    isPausedRef.current = true;
    if (physicsEngineRef.current) {
      physicsEngineRef.current.state.status = 'PAUSED';
      setHudState({ ...physicsEngineRef.current.state });
    }
  }, []);

  const resumeRun = useCallback(() => {
    isPausedRef.current = false;
    lastTimeRef.current = performance.now();
    if (physicsEngineRef.current) {
      physicsEngineRef.current.state.status = 'RUNNING';
      setHudState({ ...physicsEngineRef.current.state });
    }
  }, []);

  // Player Kinematic Actions with Haptics and Audio
  const moveLeft = useCallback(() => {
    if (!physicsEngineRef.current || isPausedRef.current) return;
    if (physicsEngineRef.current.moveLeft()) {
      soundManager.playLaneSwitch();
      if ('vibrate' in navigator) navigator.vibrate(10);
    }
  }, []);

  const moveRight = useCallback(() => {
    if (!physicsEngineRef.current || isPausedRef.current) return;
    if (physicsEngineRef.current.moveRight()) {
      soundManager.playLaneSwitch();
      if ('vibrate' in navigator) navigator.vibrate(10);
    }
  }, []);

  const jump = useCallback(() => {
    if (!physicsEngineRef.current || isPausedRef.current) return;
    if (physicsEngineRef.current.triggerJump()) {
      soundManager.playJump();
      if ('vibrate' in navigator) navigator.vibrate(15);
    }
  }, []);

  const slide = useCallback(() => {
    if (!physicsEngineRef.current || isPausedRef.current) return;
    if (physicsEngineRef.current.triggerSlide()) {
      soundManager.playSlide();
      if ('vibrate' in navigator) navigator.vibrate(12);
    }
  }, []);

  const activateOverdrive = useCallback(() => {
    if (!physicsEngineRef.current || isPausedRef.current) return;
    if (physicsEngineRef.current.triggerOverdrive()) {
      soundManager.playOverdriveActivate();
      if (rendererRef.current) rendererRef.current.triggerScreenShake(0.8);
      if ('vibrate' in navigator) navigator.vibrate([30, 20, 40]);
    }
  }, []);

  // Main decoupled game loop
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(gameLoop);

      if (!isRunningRef.current || isPausedRef.current) {
        lastTimeRef.current = currentTime;
        return;
      }

      const physics = physicsEngineRef.current;
      const renderer = rendererRef.current;
      const director = trackDirectorRef.current;
      if (!physics || !renderer || !director) return;

      // Delta time calculation with maximum clamp to prevent spiral of death
      const rawDt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      const dt = Math.min(rawDt, 0.1);

      accumulatorRef.current += dt;

      // Fixed 60Hz physics steps
      while (accumulatorRef.current >= FIXED_DT) {
        const tickResult = physics.update(FIXED_DT, activeChunksRef.current);

        // Near-Miss Spark & Overdrive Feedback
        if (tickResult.nearMissOccurred) {
          soundManager.playNearMiss();
          renderer.triggerScreenShake(0.35);
          if (tickResult.nearMissPos) {
            renderer.addSparks(tickResult.nearMissPos.x, tickResult.nearMissPos.y, tickResult.nearMissPos.z);
          }
          if ('vibrate' in navigator) navigator.vibrate(20);
        }

        // Coin & Powerup Audio
        if (tickResult.coinsPicked > 0) {
          soundManager.playCoin();
        }
        if (tickResult.powerupPicked) {
          soundManager.playPowerup();
        }

        // Fatal Collision / Game Over check
        if (tickResult.crashed) {
          soundManager.playCrash();
          renderer.triggerScreenShake(1.2);
          isRunningRef.current = false;

          const submission: RunSubmissionPayload = {
            seed: physics.state.seed,
            playerHandle: 'Player',
            distance: Math.round(physics.state.distanceMeters),
            score: physics.state.score,
            durationMs: Math.round(currentTime),
            inputTelemetry: physics.inputTelemetry,
            nearMissCount: physics.state.nearMissCount,
            coinsCollected: physics.state.coinsCollected,
            causeOfDeath: tickResult.causeOfDeath || 'Obstacle collision',
          };

          setHudState({ ...physics.state });
          onGameOver(submission);
          break;
        }

        // Chunk Recycling Subsystem
        const playerZ = physics.state.distanceMeters;
        const currentChunks = activeChunksRef.current;

        // If player has traversed past the first chunk, recycle it and spawn a new one ahead
        if (currentChunks.length > 0 && playerZ > currentChunks[0].zStart + CHUNK_LENGTH + 30) {
          currentChunks.shift(); // Recycle old chunk to eliminate GC pressure
          const newChunk = director.generateChunk(chunkIndexCounterRef.current);
          chunkIndexCounterRef.current++;
          currentChunks.push(newChunk);
        }

        accumulatorRef.current -= FIXED_DT;
      }

      // Check Gamepad inputs
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      if (gamepads && gamepads[0]) {
        const gp = gamepads[0];
        if (gp.axes[0] < -0.5 || gp.buttons[14]?.pressed) moveLeft();
        if (gp.axes[0] > 0.5 || gp.buttons[15]?.pressed) moveRight();
        if (gp.buttons[0]?.pressed || gp.buttons[12]?.pressed) jump();
        if (gp.buttons[1]?.pressed || gp.buttons[13]?.pressed) slide();
        if (gp.buttons[2]?.pressed || gp.buttons[3]?.pressed) activateOverdrive();
      }

      // Render directly to HTML5 Canvas
      renderer.render(
        physics.player,
        physics.state,
        activeChunksRef.current,
        ghostData,
        settingsRef.current
      );

      // Throttled HUD update (~12Hz) for smooth React rendering without overhead
      hudThrottleTimerRef.current += dt;
      if (hudThrottleTimerRef.current >= 0.08) {
        hudThrottleTimerRef.current = 0;
        setHudState({ ...physics.state });
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [ghostData, onGameOver, moveLeft, moveRight, jump, slide, activateOverdrive]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();
      const code = e.code.toLowerCase();

      // Check Keybindings
      const bindings = settingsRef.current.keybindings;

      if (bindings.moveLeft.includes(key) || bindings.moveLeft.includes(code)) {
        moveLeft();
      } else if (bindings.moveRight.includes(key) || bindings.moveRight.includes(code)) {
        moveRight();
      } else if (bindings.jump.includes(key) || bindings.jump.includes(code)) {
        jump();
      } else if (bindings.slide.includes(key) || bindings.slide.includes(code)) {
        slide();
      } else if (bindings.overdrive.includes(key) || bindings.overdrive.includes(code)) {
        activateOverdrive();
      } else if (key === 'escape' || key === 'p') {
        if (isRunningRef.current) {
          if (isPausedRef.current) resumeRun();
          else pauseRun();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, jump, slide, activateOverdrive, pauseRun, resumeRun]);

  // Touch Swipe Handlers for universal mobile parity
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = performance.now() - touchStartRef.current.time;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Minimum swipe threshold
    if (Math.max(absDx, absDy) > 28 && dt < 450) {
      if (absDx > absDy) {
        if (dx > 0) moveRight();
        else moveLeft();
      } else {
        if (dy > 0) slide();
        else jump();
      }
    }
    touchStartRef.current = null;
  };

  return {
    hudState,
    startRun,
    pauseRun,
    resumeRun,
    moveLeft,
    moveRight,
    jump,
    slide,
    activateOverdrive,
    handleTouchStart,
    handleTouchEnd,
  };
}
