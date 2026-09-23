import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, FastForward, Sparkles } from 'lucide-react';
import { DrawAction } from '@/types/game';
import { drawSmoothedCurve, executeFloodFill } from '@/hooks/useCanvasEngine';

const PAPER_COLOR = '#F8F4EC';

interface TimelapseReplayProps {
  actions: DrawAction[];
  durationMs?: number; // default 3000ms
  autoPlay?: boolean;
}

export const TimelapseReplay: React.FC<TimelapseReplayProps> = ({
  actions,
  durationMs = 3000,
  autoPlay = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  const totalActions = actions.length;

  const renderProgressive = useCallback(
    (targetRatio: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Clear & fill paper
      ctx.fillStyle = PAPER_COLOR;
      ctx.fillRect(0, 0, rect.width, rect.height);

      if (totalActions === 0) return;

      const maxIndex = Math.floor(targetRatio * totalActions);

      for (let i = 0; i <= maxIndex && i < totalActions; i++) {
        const action = actions[i];
        if (action.type === 'stroke') {
          // For the currently active stroke, interpolate its points
          if (i === maxIndex && targetRatio < 1) {
            const strokeRatio = (targetRatio * totalActions) - i;
            const pointsToRender = Math.max(
              2,
              Math.floor(action.points.length * strokeRatio)
            );
            drawSmoothedCurve(
              ctx,
              action.points.slice(0, pointsToRender),
              action.color,
              action.width,
              action.tool === 'eraser',
              PAPER_COLOR
            );
          } else {
            drawSmoothedCurve(
              ctx,
              action.points,
              action.color,
              action.width,
              action.tool === 'eraser',
              PAPER_COLOR
            );
          }
        } else if (action.type === 'fill') {
          executeFloodFill(
            ctx,
            action.x,
            action.y,
            action.color,
            rect.width,
            rect.height,
            dpr
          );
        }
      }
    },
    [actions, totalActions]
  );

  const stepAnimation = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = (timestamp - startTimeRef.current) * speedMultiplier;
      const ratio = Math.min(1, elapsed / durationMs);

      setPlaybackProgress(ratio);
      renderProgressive(ratio);

      if (ratio < 1) {
        animFrameRef.current = requestAnimationFrame(stepAnimation);
      } else {
        setIsPlaying(false);
      }
    },
    [durationMs, speedMultiplier, renderProgressive]
  );

  const startPlayback = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    startTimeRef.current = null;
    setIsPlaying(true);
    animFrameRef.current = requestAnimationFrame(stepAnimation);
  }, [stepAnimation]);

  const restartReplay = () => {
    setPlaybackProgress(0);
    startPlayback();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    if (autoPlay) {
      startPlayback();
    } else {
      renderProgressive(1);
      setPlaybackProgress(1);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [autoPlay, startPlayback, renderProgressive]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Canvas container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] paper-texture rounded-2xl shadow-sketchbook border-2 border-[#BFAFA0] overflow-hidden flex items-center justify-center mb-3"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Live Vector Replay Stamp */}
        <div className="absolute top-2.5 left-3 flex items-center gap-1.5 bg-studio-paper/90 backdrop-blur-sm border border-[#D5C7B0] px-2.5 py-0.5 rounded-full text-[11px] font-serif font-bold text-studio-ink shadow-sm">
          <Sparkles className="w-3 h-3 text-studio-sienna" />
          <span>3-Second Vector Timelapse</span>
        </div>
      </div>

      {/* Progress & Playback Controls */}
      <div className="w-full flex items-center justify-between gap-3 bg-white/80 p-2.5 rounded-xl border border-[#D5C7B0] shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (isPlaying) {
                if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                setIsPlaying(false);
              } else {
                if (playbackProgress >= 1) {
                  restartReplay();
                } else {
                  startPlayback();
                }
              }
            }}
            className="p-1.5 bg-studio-paper hover:bg-white text-studio-ink border border-[#D5C7B0] rounded-lg transition active:scale-95 shadow-xs"
            title={isPlaying ? 'Pause Replay' : 'Play Replay'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={restartReplay}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-studio-sienna hover:bg-studio-siennaLight text-white rounded-lg text-xs font-bold transition active:scale-95 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="w-full bg-studio-oat h-2 rounded-full overflow-hidden">
            <div
              className="bg-studio-sienna h-full transition-all duration-75"
              style={{ width: `${playbackProgress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-studio-charcoal">
            <span>{Math.round(playbackProgress * (durationMs / 1000) * 10) / 10}s</span>
            <span>{Math.round((durationMs / 1000) * 10) / 10}s</span>
          </div>
        </div>

        {/* Speed Toggle */}
        <button
          onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-studio-paper hover:bg-white text-studio-charcoal border border-[#D5C7B0] rounded-lg text-xs font-mono font-bold transition active:scale-95"
          title="Playback Speed"
        >
          <FastForward className="w-3 h-3 text-studio-sienna" />
          <span>{speedMultiplier}x</span>
        </button>
      </div>
    </div>
  );
};
