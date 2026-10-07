import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { IncidentFrameRecord } from '../../utils/circularBuffer';

interface FlamegraphCanvasProps {
  frames: IncidentFrameRecord[];
  longTasks?: { durationMs: number; startTime: number; name?: string }[];
  height?: number;
  onSelectFrame?: (frame: IncidentFrameRecord | null) => void;
  className?: string;
}

export const FlamegraphCanvas: React.FC<FlamegraphCanvasProps> = ({
  frames,
  longTasks = [],
  height = 140,
  onSelectFrame,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackCursor, setPlaybackCursor] = useState<number>(0);

  // Playback timer for incident replay
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    const interval = setInterval(() => {
      setPlaybackCursor((prev) => {
        const next = prev + 1;
        if (next >= frames.length) {
          setIsPlaying(false);
          return 0;
        }
        if (onSelectFrame) onSelectFrame(frames[next]);
        return next;
      });
    }, 35);
    return () => clearInterval(interval);
  }, [isPlaying, frames, onSelectFrame]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (frames.length === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '12px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText('No incident frame trace recorded yet', w / 2, h / 2);
      ctx.restore();
      return;
    }

    const n = frames.length;
    const barW = Math.max(1, w / n);
    const maxMs = 70; // visual ceiling

    // Draw baseline
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - 20);
    ctx.lineTo(w, h - 20);
    ctx.stroke();

    // 16.6ms and 33.3ms threshold lines
    const y16 = h - 20 - (16.66 / maxMs) * (h - 35);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, y16);
    ctx.lineTo(w, y16);
    ctx.stroke();

    const y33 = h - 20 - (33.33 / maxMs) * (h - 35);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, y33);
    ctx.lineTo(w, y33);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw frame bars
    for (let i = 0; i < n; i++) {
      const f = frames[i];
      const barH = Math.min(h - 25, Math.max(3, (f.deltaMs / maxMs) * (h - 35)));
      const x = i * barW;
      const y = h - 20 - barH;

      let color = '#10B981'; // optimal
      if (f.deltaMs > 33.33 || f.isLongTask) color = '#EF4444'; // critical
      else if (f.deltaMs > 18.0) color = '#F59E0B'; // warning

      // Highlight selected or hovered bar
      if (i === selectedIndex || i === hoverIndex || (isPlaying && i === playbackCursor)) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 1, y - 2, Math.max(2, barW + 2), barH + 4);
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, Math.max(1, barW - 0.5), barH);
    }

    // Draw Long Task markers on top
    for (const lt of longTasks) {
      // Find approximate frame position
      const firstTime = frames[0].timestamp;
      const lastTime = frames[frames.length - 1].timestamp;
      const duration = Math.max(1, lastTime - firstTime);
      const ratio = Math.max(0, Math.min(1, (lt.startTime - firstTime) / duration));
      const markerX = ratio * w;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.beginPath();
      ctx.moveTo(markerX - 4, 4);
      ctx.lineTo(markerX + 4, 4);
      ctx.lineTo(markerX, 11);
      ctx.closePath();
      ctx.fill();

      // Flag text
      ctx.font = '9px "JetBrains Mono"';
      ctx.fillStyle = '#FCA5A5';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(lt.durationMs)}ms`, markerX, 22);
    }

    // Draw Playback cursor
    if (isPlaying || selectedIndex !== null) {
      const activeIdx = isPlaying ? playbackCursor : selectedIndex!;
      const cursorX = activeIdx * barW;
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, h);
      ctx.stroke();
    }

    ctx.restore();
  }, [frames, longTasks, selectedIndex, hoverIndex, isPlaying, playbackCursor]);

  const handlePointer = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.max(0, Math.min(frames.length - 1, Math.floor((x / rect.width) * frames.length)));

    setHoverIndex(idx);
    if (e.buttons === 1) { // Left click / drag
      setSelectedIndex(idx);
      if (onSelectFrame) onSelectFrame(frames[idx]);
    }
  }, [frames, onSelectFrame]);

  const activeRecord = (selectedIndex !== null ? frames[selectedIndex] : null) ||
                       (hoverIndex !== null ? frames[hoverIndex] : null) ||
                       (isPlaying ? frames[playbackCursor] : null);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Controls Bar */}
      <div className="flex items-center justify-between text-xs font-mono-avionics text-slate-400 pb-1 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 hover:bg-cyan-900/80 transition-colors flex items-center space-x-1"
          >
            <span>{isPlaying ? '⏸ PAUSE' : '▶ REPLAY'}</span>
          </button>
          <span className="text-[11px] text-slate-500">
            {frames.length} Frame Records (~{((frames.length * 16.6) / 1000).toFixed(1)}s Trace)
          </span>
        </div>

        {activeRecord && (
          <div className="flex items-center space-x-3 text-[11px] text-slate-300">
            <span>Frame: <strong className="text-white">{activeRecord.deltaMs.toFixed(2)}ms</strong></span>
            <span>FPS: <strong className={activeRecord.deltaMs > 33 ? 'text-red-400' : 'text-emerald-400'}>{activeRecord.instantFps.toFixed(1)}</strong></span>
            {activeRecord.heapUsedMb && (
              <span>Heap: <strong className="text-cyan-400">{activeRecord.heapUsedMb} MB</strong></span>
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="relative rounded bg-[#090D15] border border-slate-800/80 p-1">
        <canvas
          ref={canvasRef}
          className="w-full block cursor-ew-resize"
          style={{ height }}
          onMouseMove={handlePointer}
          onMouseDown={handlePointer}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </div>
    </div>
  );
};
