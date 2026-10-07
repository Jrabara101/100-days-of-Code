import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Beatmap, BeatmapNote, HitJudgement, InputTelemetry, ScoreValidationResult, RhythmGameState } from '../../types/game';
import { RhythmHighway } from './RhythmHighway';
import { HUDTelemetry } from './HUDTelemetry';
import { useRhythmClock } from '../../hooks/useRhythmClock';
import { useRhythmInput } from '../../hooks/useRhythmInput';
import { globalAudioEngine } from '../../audio/RhythmAudioEngine';
import { globalTelemetry } from '../../engine/telemetry';

interface RhythmGameControllerProps {
  beatmap: Beatmap;
  scrollSpeed: number;
  zenMode: boolean;
  audioOffsetMs: number;
  ghostEnabled: boolean;
  playerName: string;
  onFinishRun: (result: ScoreValidationResult) => void;
  onExitToMenu: () => void;
  wsSocket?: WebSocket | null;
  opponentData?: any;
}

export const RhythmGameController: React.FC<RhythmGameControllerProps> = ({
  beatmap,
  scrollSpeed,
  zenMode,
  audioOffsetMs,
  ghostEnabled,
  playerName,
  onFinishRun,
  onExitToMenu,
  wsSocket,
  opponentData,
}) => {
  // Game state
  const [status, setStatus] = useState<RhythmGameState['status']>('COUNTDOWN');
  const [countdown, setCountdown] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [health, setHealth] = useState<number>(100);
  const [feverGauge, setFeverGauge] = useState<number>(0);
  const [isFeverActive, setIsFeverActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [latestJudgement, setLatestJudgement] = useState<{ rating: HitJudgement; timestamp: number; deltaMs: number } | null>(null);

  // Local judgements record
  const judgementsRef = useRef<Record<HitJudgement, number>>({
    MARVELOUS: 0,
    PERFECT: 0,
    GREAT: 0,
    GOOD: 0,
    MISS: 0,
  });

  const feverTimerRef = useRef<number | null>(null);
  const ghostTelemetryRef = useRef<InputTelemetry[]>([]);

  // High-precision audio clock hook
  const {
    startClock,
    pauseClock,
    resumeClock,
    stopClock,
    getCurrentSongTimeMs,
  } = useRhythmClock({
    audioOffsetMs,
    chartOffsetMs: beatmap.offsetMs,
  });

  // Track ghost telemetry if enabled
  useEffect(() => {
    if (ghostEnabled) {
      // Fetch high score ghost replay or generate challenge ghost
      fetch(`/api/leaderboard/${beatmap.id}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0 && data[0].hasGhostTelemetry) {
            fetch(`/api/ghost/${data[0].id}`)
              .then(gr => gr.json())
              .then(gdata => {
                if (gdata.telemetry) ghostTelemetryRef.current = gdata.telemetry;
              });
          }
        })
        .catch(() => {});
    }
  }, [beatmap.id, ghostEnabled]);

  // Handle Note Hit Judgement from Highway
  const handleJudgement = useCallback((judgement: HitJudgement, deltaMs: number, note: BeatmapNote) => {
    judgementsRef.current[judgement]++;

    setLatestJudgement({
      rating: judgement,
      timestamp: performance.now(),
      deltaMs,
    });

    if (judgement !== 'MISS') {
      setCombo(prev => {
        const next = prev + 1;
        setMaxCombo(mc => Math.max(mc, next));
        const newMult = Math.min(4.0, 1.0 + Math.floor(next / 10) * 0.2);
        setMultiplier(newMult);
        return next;
      });

      // Health regeneration
      if (!zenMode) {
        setHealth(h => Math.min(100, h + (judgement === 'MARVELOUS' ? 4 : judgement === 'PERFECT' ? 3 : 1.5)));
      }

      // Fever gauge accumulation
      setFeverGauge(fg => {
        if (isFeverActive) return fg; // while fever is burning, gauge stays empty
        const gain = note.isFever ? 18 : judgement === 'MARVELOUS' ? 5 : judgement === 'PERFECT' ? 3.5 : 2;
        return Math.min(100, fg + gain);
      });

      // Score points
      const basePoints = judgement === 'MARVELOUS' ? 1000 : judgement === 'PERFECT' ? 800 : judgement === 'GREAT' ? 500 : 250;
      const feverMult = isFeverActive ? 2.0 : 1.0;
      setScore(s => s + Math.round(basePoints * multiplier * feverMult));

    } else {
      // Miss drops combo
      setCombo(0);
      setMultiplier(1.0);

      if (!zenMode) {
        setHealth(h => {
          const next = h - 14;
          if (next <= 0) {
            handleTrackFail();
            return 0;
          }
          return next;
        });
      }
    }

    // Broadcast live telemetry delta to online room opponent
    if (wsSocket && wsSocket.readyState === 1) {
      wsSocket.send(JSON.stringify({
        type: 'TELEMETRY_DELTA',
        score,
        combo,
        fever: isFeverActive,
        latestJudgement: judgement,
        lane: note.lane,
      }));
    }
  }, [zenMode, isFeverActive, multiplier, score, combo, wsSocket]);

  // Trigger "Fever Overdrive" Dynamic Juice
  const triggerFever = useCallback(() => {
    if (feverGauge < 100 || isFeverActive) return;

    setIsFeverActive(true);
    setFeverGauge(100);
    globalAudioEngine.playFeverTriggerSfx();
    globalAudioEngine.setFeverMode(true);

    // Fever lasts 8 seconds, draining the meter smoothly
    const startTime = performance.now();
    const duration = 8000;

    const drain = () => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setFeverGauge(remaining);

      if (remaining > 0) {
        feverTimerRef.current = requestAnimationFrame(drain);
      } else {
        setIsFeverActive(false);
        globalAudioEngine.setFeverMode(false);
      }
    };

    feverTimerRef.current = requestAnimationFrame(drain);
  }, [feverGauge, isFeverActive]);

  // Input Hook
  const { laneActiveRef, handleTouchLaneDown, handleTouchLaneUp } = useRhythmInput({
    onLaneDown: (lane, timeStamp) => {
      if (status !== 'PLAYING') return;
      const songTimeMs = getCurrentSongTimeMs();
      globalTelemetry.recordEvent(lane, 'DOWN', songTimeMs);
      window.dispatchEvent(new CustomEvent('rhythm:lane_down', { detail: { lane } }));
    },
    onLaneUp: (lane, timeStamp) => {
      if (status !== 'PLAYING') return;
      const songTimeMs = getCurrentSongTimeMs();
      globalTelemetry.recordEvent(lane, 'UP', songTimeMs);
    },
    onFeverTrigger: () => {
      triggerFever();
    },
    onPauseToggle: () => {
      togglePause();
    },
  });

  // Track fail handler
  const handleTrackFail = useCallback(() => {
    setStatus('FAILED');
    stopClock();
    globalAudioEngine.stopSynthTrack();
    globalAudioEngine.playHitSound('MISS');

    // Submit telemetry
    globalTelemetry.submitForVerification(score, beatmap).then(result => {
      onFinishRun({
        ...result,
        grade: 'FAIL',
        score,
        maxCombo,
      });
    });
  }, [score, beatmap, maxCombo, onFinishRun, stopClock]);

  // Track completed handler
  const handleTrackComplete = useCallback(() => {
    setStatus('COMPLETED');
    stopClock();
    globalAudioEngine.stopSynthTrack();

    globalTelemetry.submitForVerification(score, beatmap).then(result => {
      onFinishRun(result);
    });
  }, [score, beatmap, onFinishRun, stopClock]);

  // Pause toggle
  const togglePause = useCallback(() => {
    if (status !== 'PLAYING' && status !== 'PAUSED') return;

    if (isPaused) {
      resumeClock();
      setIsPaused(false);
      setStatus('PLAYING');
    } else {
      pauseClock();
      setIsPaused(true);
      setStatus('PAUSED');
    }
  }, [isPaused, status, pauseClock, resumeClock]);

  // Countdown & track launch sequence
  useEffect(() => {
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        globalAudioEngine.playCalibrationClick(false);
      } else {
        clearInterval(interval);
        setStatus('PLAYING');
        globalAudioEngine.startSynthTrack(beatmap.bpm, beatmap.synthTheme || 'synthwave');
        globalTelemetry.startRun(beatmap.id, playerName);
        startClock(0);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [beatmap, playerName, startClock]);

  // Song completion monitor
  useEffect(() => {
    if (status !== 'PLAYING' || isPaused) return;

    const checkInterval = setInterval(() => {
      const timeMs = getCurrentSongTimeMs();
      if (timeMs >= beatmap.durationMs) {
        clearInterval(checkInterval);
        handleTrackComplete();
      }
    }, 250);

    return () => clearInterval(checkInterval);
  }, [status, isPaused, beatmap.durationMs, getCurrentSongTimeMs, handleTrackComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopClock();
      globalAudioEngine.stopSynthTrack();
      globalAudioEngine.setFeverMode(false);
      if (feverTimerRef.current) cancelAnimationFrame(feverTimerRef.current);
    };
  }, [stopClock]);

  const songProgress = Math.min(1.0, getCurrentSongTimeMs() / (beatmap.durationMs || 1));

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden select-none">
      {/* 3-2-1 Countdown Overlay */}
      {status === 'COUNTDOWN' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="font-display text-8xl md:text-9xl font-black text-primary animate-ping">
            {countdown}
          </div>
          <div className="text-sm font-mono uppercase tracking-[0.3em] text-gray-400 mt-4">
            PREPARE RECEPTORS [ D • F • J • K ]
          </div>
        </div>
      )}

      {/* Paused Overlay */}
      {status === 'PAUSED' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 backdrop-blur-xl">
          <div className="font-display text-4xl font-black text-primary uppercase tracking-widest">
            SIMULATION PAUSED
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={togglePause}
              className="px-6 py-2.5 rounded-xl bg-primary text-black font-mono font-bold uppercase shadow-neon-cyan active:scale-95"
            >
              Resume
            </button>
            <button
              onClick={onExitToMenu}
              className="px-6 py-2.5 rounded-xl bg-surface-high text-white font-mono font-bold uppercase hover:bg-surface-highest transition-colors"
            >
              Quit to Menu
            </button>
          </div>
        </div>
      )}

      {/* Floating HUD Layer */}
      <HUDTelemetry
        score={score}
        combo={combo}
        maxCombo={maxCombo}
        multiplier={multiplier}
        health={health}
        feverGauge={feverGauge}
        isFeverActive={isFeverActive}
        latestJudgement={latestJudgement}
        onTriggerFever={triggerFever}
        onTogglePause={togglePause}
        isPaused={isPaused}
        zenMode={zenMode}
        songProgress={songProgress}
        songTitle={beatmap.title}
        opponentData={opponentData}
      />

      {/* Canvas Highway Engine */}
      <RhythmHighway
        beatmap={beatmap}
        getCurrentTimeMs={getCurrentSongTimeMs}
        scrollSpeed={scrollSpeed}
        isFeverActive={isFeverActive}
        laneActiveRef={laneActiveRef}
        onJudgement={handleJudgement}
        ghostTelemetry={ghostTelemetryRef.current}
        onLaneClick={(lane) => {
          handleTouchLaneDown(lane);
          setTimeout(() => handleTouchLaneUp(lane), 120);
        }}
      />

      {/* Mobile Touch Receptors */}
      <div className="sm:hidden absolute bottom-0 left-0 right-0 h-28 z-20 flex">
        {([0, 1, 2, 3] as const).map(lane => (
          <div
            key={lane}
            onTouchStart={(e) => {
              e.preventDefault();
              handleTouchLaneDown(lane);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTouchLaneUp(lane);
            }}
            onMouseDown={() => handleTouchLaneDown(lane)}
            onMouseUp={() => handleTouchLaneUp(lane)}
            className="flex-1 h-full border-r border-white/5 active:bg-primary/20 transition-colors"
          />
        ))}
      </div>
    </div>
  );
};
