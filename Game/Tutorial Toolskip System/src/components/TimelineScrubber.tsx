import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ReplayEventMarker } from '../types/replay';
import { formatTime, formatTick, getCategoryColor } from '../lib/utils';
import { ChevronLeft, ChevronRight, Bookmark, Scissors } from 'lucide-react';

interface TimelineScrubberProps {
  currentTick: number;
  totalTicks: number;
  markers: ReplayEventMarker[];
  activeMarkerId?: string | null;
  loopRange: [number, number] | null;
  isLooping: boolean;
  onSeek: (tick: number) => void;
  onSetLoopRange: (range: [number, number] | null) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentTick,
  totalTicks,
  markers,
  activeMarkerId,
  loopRange,
  isLooping,
  onSeek,
  onSetLoopRange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);
  const [hoverTick, setHoverTick] = useState<number | null>(null);
  const [hoverMarker, setHoverMarker] = useState<ReplayEventMarker | null>(null);
  const [snappedMarker, setSnappedMarker] = useState<ReplayEventMarker | null>(null);

  const safeTotalTicks = Math.max(1, totalTicks);
  const progressPercent = Math.min(100, Math.max(0, (currentTick / safeTotalTicks) * 100));

  // Compute tick from mouse event with magnetic snapping to markers
  const getTickFromMouseEvent = useCallback(
    (e: MouseEvent | React.MouseEvent): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const clientX = 'clientX' in e ? e.clientX : (e as unknown as TouchEvent).touches[0].clientX;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      let rawTick = Math.round(ratio * safeTotalTicks);

      // Magnetic snap within 15 ticks of any highlight marker
      const snapTarget = markers.find(m => Math.abs(m.tick - rawTick) <= 15);
      if (snapTarget) {
        setSnappedMarker(snapTarget);
        return snapTarget.tick;
      } else {
        setSnappedMarker(null);
        return rawTick;
      }
    },
    [safeTotalTicks, markers]
  );

  // Dragging logic for scrubber playhead and In/Out handles
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead) {
        const tick = getTickFromMouseEvent(e);
        onSeek(tick);
      } else if (draggingHandle === 'start') {
        const tick = getTickFromMouseEvent(e);
        const end = loopRange ? loopRange[1] : safeTotalTicks;
        onSetLoopRange([Math.min(tick, end - 30), end]);
      } else if (draggingHandle === 'end') {
        const tick = getTickFromMouseEvent(e);
        const start = loopRange ? loopRange[0] : 0;
        onSetLoopRange([start, Math.max(tick, start + 30)]);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
      setDraggingHandle(null);
      setSnappedMarker(null);
    };

    if (isDraggingPlayhead || draggingHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, draggingHandle, getTickFromMouseEvent, onSeek, loopRange, safeTotalTicks, onSetLoopRange]);

  const handleTrackClick = (e: React.MouseEvent) => {
    const tick = getTickFromMouseEvent(e);
    onSeek(tick);
  };

  const handleMouseMoveTrack = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const tick = Math.round(ratio * safeTotalTicks);
    setHoverTick(tick);

    const hit = markers.find(m => Math.abs(m.tick - tick) <= 16);
    setHoverMarker(hit || null);
  };

  const handleMouseLeaveTrack = () => {
    setHoverTick(null);
    setHoverMarker(null);
  };

  const loopStartPercent = loopRange ? (loopRange[0] / safeTotalTicks) * 100 : 0;
  const loopEndPercent = loopRange ? (loopRange[1] / safeTotalTicks) * 100 : 100;

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* Top Scrubber Telemetry Header */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-bold tracking-wider">{formatTick(currentTick)}</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-300 font-medium">
            {formatTime(Math.round((currentTick / 60) * 1000))}
          </span>
          <span className="text-slate-500">of</span>
          <span className="text-slate-400 font-medium">
            {formatTime(Math.round((safeTotalTicks / 60) * 1000))}
          </span>
        </div>

        {/* Snap Cue & Loop Range notification */}
        <div className="flex items-center gap-2">
          {snappedMarker && (
            <div className="flex items-center gap-1 text-[11px] font-sans px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 animate-pulse">
              <Bookmark className="w-3 h-3 text-cyan-400" />
              <span>SNAP: {snappedMarker.label}</span>
            </div>
          )}

          {loopRange && (
            <div className="flex items-center gap-1 text-[11px] font-sans px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/40 text-sky-300">
              <Scissors className="w-3 h-3" />
              <span>
                TRIM: [{formatTick(loopRange[0])} → {formatTick(loopRange[1])}]
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetLoopRange(null);
                }}
                className="ml-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Timeline Well */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        onMouseMove={handleMouseMoveTrack}
        onMouseLeave={handleMouseLeaveTrack}
        className="relative w-full h-12 bg-slate-950/90 border border-slate-800/80 rounded-lg cursor-pointer overflow-hidden shadow-inner group hover:border-slate-700 transition-colors"
      >
        {/* Background Keyframe & Telemetry Density Grid */}
        <div className="absolute inset-0 flex items-center justify-between opacity-15 pointer-events-none px-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="h-full w-px bg-slate-600"
              style={{
                height: `${25 + (Math.sin(i * 1.5) * 15 + 15)}%`,
              }}
            />
          ))}
        </div>

        {/* Diagonal Hazard Stripes for Loop / Trim Selection */}
        {loopRange && (
          <div
            className="absolute top-0 bottom-0 bg-sky-500/15 border-x border-sky-400/60 pointer-events-none"
            style={{
              left: `${loopStartPercent}%`,
              width: `${Math.max(0, loopEndPercent - loopStartPercent)}%`,
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(56, 189, 248, 0.08) 0, rgba(56, 189, 248, 0.08) 10px, transparent 10px, transparent 20px)',
            }}
          />
        )}

        {/* Progress Filled Bar */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-cyan-600/30 to-sky-500/40 border-r border-cyan-400/80 pointer-events-none transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Highlight Milestone Pins along Timeline Ribbon */}
        {markers.map(m => {
          const markerPercent = (m.tick / safeTotalTicks) * 100;
          const styleInfo = getCategoryColor(m.category);
          const isNear = Math.abs(m.tick - currentTick) <= 12;

          return (
            <div
              key={m.id}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(m.tick);
              }}
              title={`${m.label} (${formatTick(m.tick)})`}
              className="absolute top-0 bottom-0 flex flex-col items-center justify-center cursor-pointer group/pin z-20"
              style={{ left: `${markerPercent}%`, transform: 'translateX(-50%)' }}
            >
              {/* Vertical Laser Glow Beam */}
              <div
                className="w-0.5 h-full opacity-60 group-hover/pin:opacity-100 transition-opacity"
                style={{ backgroundColor: styleInfo.color }}
              />

              {/* Pin Head Diamond */}
              <div
                className={`w-3.5 h-3.5 rounded-sm rotate-45 border transition-all duration-150 ${
                  isNear ? 'scale-125 shadow-lg shadow-cyan-500/50' : 'group-hover/pin:scale-110'
                }`}
                style={{
                  backgroundColor: styleInfo.color,
                  borderColor: isNear ? '#ffffff' : styleInfo.color,
                }}
              />

              {/* Fast Radial Pulse for Milestone Hit */}
              {isNear && (
                <div
                  className="absolute w-6 h-6 rounded-full animate-ping opacity-75 pointer-events-none"
                  style={{ backgroundColor: styleInfo.color }}
                />
              )}
            </div>
          );
        })}

        {/* In/Out Trim Bracket Handles */}
        {loopRange && (
          <>
            {/* Start Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggingHandle('start');
              }}
              className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-sky-400 cursor-ew-resize z-30 flex items-center justify-center rounded-l shadow-md hover:scale-110 transition-transform"
              style={{ left: `${loopStartPercent}%` }}
            >
              <div className="w-0.5 h-4 bg-slate-950" />
            </div>

            {/* End Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggingHandle('end');
              }}
              className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-sky-400 cursor-ew-resize z-30 flex items-center justify-center rounded-r shadow-md hover:scale-110 transition-transform"
              style={{ left: `${loopEndPercent}%` }}
            >
              <div className="w-0.5 h-4 bg-slate-950" />
            </div>
          </>
        )}

        {/* Laser Scanning Playhead Beam */}
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingPlayhead(true);
          }}
          className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-grab active:cursor-grabbing z-40 transition-transform duration-75 flex flex-col items-center shadow-[0_0_12px_rgba(56,189,248,0.9)]"
          style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}
        >
          {/* Top Playhead Triangle Indicator */}
          <div className="w-3.5 h-3.5 bg-cyan-300 rotate-45 -mt-1.5 border border-white shadow-md" />
          <div className="flex-1 w-full bg-cyan-400" />
        </div>

        {/* Hover Scrub Preview Pin & Tooltip */}
        {hoverTick !== null && !isDraggingPlayhead && (
          <div
            className="absolute top-0 bottom-0 w-px bg-white/40 pointer-events-none z-30"
            style={{ left: `${(hoverTick / safeTotalTicks) * 100}%` }}
          >
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300 rounded shadow-lg whitespace-nowrap">
              {formatTime(Math.round((hoverTick / 60) * 1000))} ({formatTick(hoverTick)})
              {hoverMarker && (
                <span className="ml-1.5 font-sans font-bold text-amber-400">
                  ★ {hoverMarker.label}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
