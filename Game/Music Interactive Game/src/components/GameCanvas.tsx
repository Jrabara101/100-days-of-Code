import React, { useEffect, useRef } from 'react';
import { GameEngine } from '@/game/GameEngine';
import { useGameStore } from '@/store/useGameStore';
import { useAudioAnalyzer } from '@/audio/useAudioAnalyzer';

interface GameCanvasProps {
  miniCanvasRef: React.RefObject<HTMLCanvasElement>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ miniCanvasRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const {
    gameStatus,
    settings,
    updateStats,
    setTrackMeta,
    updateAudioMetrics,
    triggerCallout,
    hideCallout,
    setSummaryOpen,
    setGameStatus,
  } = useGameStore();

  const { togglePlay } = useAudioAnalyzer();

  // Store accessors passed to engine
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const gameStatusRef = useRef(gameStatus);
  gameStatusRef.current = gameStatus;

  // Throttled HUD updater to decouple 60fps canvas from React re-renders
  const lastHudSync = useRef(0);
  const calloutTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(
      canvasRef.current,
      miniCanvasRef.current,
      () => settingsRef.current,
      () => gameStatusRef.current === 'PLAYING'
    );
    engineRef.current = engine;

    // Handle score hit
    engine.onScoreUpdate = (points, isHazard, jumpedOver) => {
      const currentStats = useGameStore.getState().stats;
      const currentSettings = settingsRef.current;

      if (isHazard && !jumpedOver && !currentSettings.zenMode) {
        // Hazard collision
        updateStats({
          combo: 0,
          multiplier: 1,
          shield: Math.max(0, currentStats.shield - 20),
          totalNotes: currentStats.totalNotes + 1,
        });

        // Check shield failure
        if (currentStats.shield - 20 <= 0) {
          setGameStatus('GAME_OVER');
          setSummaryOpen(true);
        }
      } else if (jumpedOver) {
        // Clean jump over hazard
        const newCombo = currentStats.combo + 1;
        const newMaxCombo = Math.max(currentStats.maxCombo, newCombo);
        const newScore = currentStats.score + points * currentStats.multiplier;
        updateStats({
          combo: newCombo,
          maxCombo: newMaxCombo,
          score: newScore,
          accuracyHits: currentStats.accuracyHits + 1,
          totalNotes: currentStats.totalNotes + 1,
        });
      } else {
        // Rhythm diamond / ring pickup
        const newCombo = currentStats.combo + 1;
        const newMaxCombo = Math.max(currentStats.maxCombo, newCombo);

        let newMult = 1;
        if (newCombo >= 40) newMult = 8;
        else if (newCombo >= 20) newMult = 4;
        else if (newCombo >= 10) newMult = 2;

        const newScore = currentStats.score + points * newMult;
        updateStats({
          combo: newCombo,
          maxCombo: newMaxCombo,
          multiplier: newMult,
          score: newScore,
          accuracyHits: currentStats.accuracyHits + 1,
          totalNotes: currentStats.totalNotes + 1,
        });
      }
    };

    // Note missed (reached bottom without hit)
    engine.onMissUpdate = () => {
      const currentStats = useGameStore.getState().stats;
      updateStats({
        combo: 0,
        multiplier: 1,
        totalNotes: currentStats.totalNotes + 1,
      });
    };

    // Throttled time and audio metrics sync (~20 times/sec)
    engine.onTimeTick = (dt) => {
      const now = performance.now();
      if (now - lastHudSync.current > 50) {
        lastHudSync.current = now;
        const track = useGameStore.getState().trackMeta;
        const newTime = track.currentTime + dt;
        setTrackMeta({ currentTime: newTime });

        if (track.duration > 0 && newTime >= track.duration) {
          setGameStatus('GAME_OVER');
          setSummaryOpen(true);
        }
      }
    };

    engine.onAudioMetricsUpdate = (metrics) => {
      const now = performance.now();
      if (now - lastHudSync.current > 50) {
        updateAudioMetrics(metrics);
      }
    };

    // Callout feedback
    engine.onCallout = (message, type, color) => {
      const combo = useGameStore.getState().stats.combo;
      triggerCallout(message, combo, type, color);

      if (calloutTimer.current) clearTimeout(calloutTimer.current);
      calloutTimer.current = window.setTimeout(() => {
        hideCallout();
      }, 400);
    };

    // Handle Window Resize
    const handleResize = () => {
      engine.resizeCanvas();
    };
    window.addEventListener('resize', handleResize);

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        engine.shiftLane(-1);
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        engine.shiftLane(1);
      } else if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        engine.jump();
      } else if (e.code === 'Escape') {
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Touch / Pointer controls
    const canvasEl = canvasRef.current;
    const handlePointerDown = (e: PointerEvent) => {
      const clickX = e.clientX;
      const third = window.innerWidth / 3;
      if (clickX < third) {
        engine.setLane(0);
      } else if (clickX > third * 2) {
        engine.setLane(2);
      } else {
        engine.setLane(1);
      }
    };
    canvasEl.addEventListener('pointerdown', handlePointerDown);

    // Start engine loop
    engine.start();

    return () => {
      engine.stop();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      canvasEl.removeEventListener('pointerdown', handlePointerDown);
      if (calloutTimer.current) clearTimeout(calloutTimer.current);
    };
  }, []);

  // Update miniCanvas reference if it mounts after
  useEffect(() => {
    if (engineRef.current && miniCanvasRef.current) {
      engineRef.current.setMiniCanvas(miniCanvasRef.current);
    }
  }, [miniCanvasRef]);

  return (
    <div className="absolute inset-0 z-0 bg-void overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
};
