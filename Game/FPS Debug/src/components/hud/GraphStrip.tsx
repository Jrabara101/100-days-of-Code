import React, { useState, useRef } from 'react';
import type { PerformanceSummary } from '../../types/telemetry';
import type { Float32CircularBuffer } from '../../utils/circularBuffer';
import { SparklineCanvas } from '../canvas/SparklineCanvas';
import { Maximize2, Minimize2, Move } from 'lucide-react';

interface GraphStripProps {
  metrics: PerformanceSummary;
  ringBuffer: Float32CircularBuffer;
  isStuttering: boolean;
  onExpand: () => void;
  onSwitchPill: () => void;
}

export const GraphStrip: React.FC<GraphStripProps> = ({
  metrics,
  ringBuffer,
  isStuttering,
  onExpand,
  onSwitchPill,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.max(24, window.innerWidth - 410) : 24,
    y: 72,
  }));
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 24,
    posY: 72,
  });

  const isCritical = isStuttering || metrics.currentFps < 30;
  const isWarning = !isCritical && metrics.currentFps < 55;

  const fpsColor = isCritical ? 'text-[#EF4444]' : isWarning ? 'text-[#F59E0B]' : 'text-[#10B981]';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPosition({
      x: Math.max(12, Math.min(window.innerWidth - 380, dragStartRef.current.posX + dx)),
      y: Math.max(12, Math.min(window.innerHeight - 70, dragStartRef.current.posY + dy)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-50 select-none touch-none ${isStuttering ? 'animate-stutter-tremor' : ''}`}
    >
      <div className="flex items-center h-12 w-[380px] bg-[#0C101C]/90 backdrop-blur-xl border border-slate-800 rounded-xl px-3 shadow-2xl shadow-black/80">
        {/* Drag handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="cursor-move text-slate-500 hover:text-slate-300 mr-2 p-1"
          title="Drag HUD Strip"
        >
          <Move className="w-3.5 h-3.5" />
        </div>

        {/* FPS & 1% Low Readouts */}
        <div className="flex flex-col justify-center min-w-[72px]">
          <div className="flex items-baseline space-x-1">
            <span className={`text-[16px] font-mono-avionics font-bold ${fpsColor}`}>
              {Math.round(metrics.currentFps)}
            </span>
            <span className="text-[10px] font-mono-avionics text-slate-400">FPS</span>
          </div>
          <div className="text-[10px] font-mono-avionics text-slate-500">
            <span>1% {Math.round(metrics.onePercentLowFps)}</span>
            <span className="mx-1">·</span>
            <span>{metrics.currentFrameTimeMs.toFixed(1)}ms</span>
          </div>
        </div>

        {/* Micro Sparkline Canvas */}
        <div className="flex-1 h-9 mx-2 border border-slate-800/80 rounded bg-[#05070C] overflow-hidden">
          <SparklineCanvas
            ringBuffer={ringBuffer}
            height={36}
            sampleCount={60}
            showTargetLines={false}
            interactive={false}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
          <button
            type="button"
            onClick={onSwitchPill}
            title="Switch to Compact Pill"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onExpand}
            title="Open Full Diagnostic Deck (F2 / ~)"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
