import React, { useState, useRef, useEffect } from 'react';
import type { PerformanceSummary } from '../../types/telemetry';
import { Maximize2, Activity } from 'lucide-react';

interface CompactPillProps {
  metrics: PerformanceSummary;
  isStuttering: boolean;
  onExpand: () => void;
  onToggleMode?: () => void;
}

export const CompactPill: React.FC<CompactPillProps> = ({
  metrics,
  isStuttering,
  onExpand,
}) => {
  // Draggable position state (anchored nicely below the top command bar)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.max(24, window.innerWidth - 245) : 24,
    y: 72,
  }));
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 24,
    posY: 72,
  });

  // Dynamic status colors based on avionics tokens
  const isCritical = isStuttering || metrics.currentFps < 30 || metrics.stabilityScore < 70;
  const isWarning = !isCritical && (metrics.currentFps < 55 || metrics.onePercentLowFps < 45);

  const fpsColorClass = isCritical
    ? 'text-[#EF4444]'
    : isWarning
    ? 'text-[#F59E0B]'
    : 'text-[#10B981]';

  const dotColorClass = isCritical
    ? 'bg-[#EF4444] shadow-[0_0_8px_#EF4444]'
    : isWarning
    ? 'bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]'
    : 'bg-[#10B981] shadow-[0_0_8px_#10B981]';

  // Drag handlers with window boundary clamping & edge snapping
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

    const newX = Math.max(12, Math.min(window.innerWidth - 220, dragStartRef.current.posX + dx));
    const newY = Math.max(12, Math.min(window.innerHeight - 50, dragStartRef.current.posY + dy));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    // Edge snapping physics: snap toward nearest vertical border if within 80px
    const snapDistance = 70;
    let finalX = position.x;
    if (position.x < snapDistance) {
      finalX = 16;
    } else if (window.innerWidth - position.x - 220 < snapDistance) {
      finalX = window.innerWidth - 236;
    }

    setPosition((prev) => ({ ...prev, x: finalX }));
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-50 select-none touch-none cursor-move transition-transform duration-75 ${
        isStuttering ? 'animate-stutter-tremor' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className={`group relative flex items-center h-9 px-3 rounded-full backdrop-blur-xl border shadow-2xl transition-all ${
          isCritical
            ? 'bg-[#0C101C]/90 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
            : isWarning
            ? 'bg-[#0C101C]/90 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
            : 'bg-[#0C101C]/85 border-slate-800/90 hover:border-slate-700 shadow-black/80'
        }`}
      >
        {/* Pulsing indicator dot */}
        <div className="flex items-center space-x-2 mr-2">
          <span
            className={`w-2 h-2 rounded-full inline-block transition-colors ${dotColorClass} ${
              metrics.longTaskCount > 0 || isStuttering ? 'animate-ping' : ''
            }`}
          />
        </div>

        {/* Monospace FPS Integer */}
        <div className="flex items-baseline space-x-0.5">
          <span className={`text-[15px] font-mono-avionics font-bold tracking-tight ${fpsColorClass}`}>
            {Math.round(metrics.currentFps)}
          </span>
          <span className="text-[10px] font-mono-avionics text-slate-400 font-semibold">FPS</span>
        </div>

        {/* Thin vertical separator */}
        <div className="h-3 w-[1px] bg-slate-800 mx-2" />

        {/* Frame Time */}
        <div className="text-[12px] font-mono-avionics text-slate-300">
          <span>{metrics.currentFrameTimeMs.toFixed(1)}</span>
          <span className="text-[10px] text-slate-500 ml-0.5">ms</span>
        </div>

        {/* 1% Low readout */}
        <div className="hidden sm:flex items-center ml-2 pl-2 border-l border-slate-800/80 text-[10px] font-mono-avionics text-slate-400">
          <span className="text-slate-500 mr-1">1%:</span>
          <span className={metrics.onePercentLowFps < 30 ? 'text-red-400' : 'text-slate-300 font-medium'}>
            {Math.round(metrics.onePercentLowFps)}
          </span>
        </div>

        {/* Expand Deck Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          title="Open Full Diagnostic Deck (F2 / ~)"
          className="ml-2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <Maximize2 className="w-3 h-3" />
        </button>

        {/* Hotkey reminder tooltip on hover */}
        <div className="absolute left-1/2 -bottom-6 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[9px] font-mono-avionics text-slate-400 whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded border border-slate-800">
          Drag to Move · Press F2 or ~ for Deck
        </div>
      </div>
    </div>
  );
};
