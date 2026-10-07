import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Float32CircularBuffer } from '../../utils/circularBuffer';

interface SparklineCanvasProps {
  ringBuffer: Float32CircularBuffer;
  width?: number | string;
  height?: number;
  sampleCount?: number; // e.g. 120 or 180 samples
  showTargetLines?: boolean;
  targetHz?: number;
  mode?: 'sparkline' | 'histogram';
  interactive?: boolean;
  onHoverSample?: (sample: { index: number; frameTimeMs: number; fps: number } | null) => void;
  className?: string;
}

export const SparklineCanvas: React.FC<SparklineCanvasProps> = ({
  ringBuffer,
  height = 110,
  sampleCount = 120,
  showTargetLines = true,
  targetHz = 60,
  mode = 'sparkline',
  interactive = true,
  onHoverSample,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverData, setHoverData] = useState<{ x: number; y: number; ms: number; fps: number } | null>(null);

  // High-performance direct canvas render loop decoupled from React state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let running = true;

    const render = () => {
      if (!running) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Background subtle grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Horizontal lines at 8.3ms, 16.6ms, 33.3ms, 50ms
      const maxMs = 50; // clamp display range
      const scaleY = (ms: number) => Math.max(4, Math.min(h - 4, h - (ms / maxMs) * (h - 12)));

      // 60 FPS (16.66ms) target line
      if (showTargetLines) {
        const y60 = scaleY(16.66);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)'; // emerald
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y60);
        ctx.lineTo(w, y60);
        ctx.stroke();

        // 120 FPS (8.33ms) target line
        const y120 = scaleY(8.33);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)'; // cyan
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y120);
        ctx.lineTo(w, y120);
        ctx.stroke();

        ctx.setLineDash([]);
      }

      // Fetch samples from ring buffer
      const samples = ringBuffer.getLastN(sampleCount);
      const n = samples.length;

      if (mode === 'sparkline') {
        if (n >= 2) {
          const stepX = w / (sampleCount - 1);
          const startX = w - (n - 1) * stepX;

          // 1. Draw filled area
          ctx.beginPath();
          ctx.moveTo(startX, h);

          for (let i = 0; i < n; i++) {
            const ms = samples[i];
            const px = startX + i * stepX;
            const py = scaleY(ms);
            ctx.lineTo(px, py);
          }

          ctx.lineTo(w, h);
          ctx.closePath();

          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
          grad.addColorStop(1, 'rgba(6, 182, 212, 0.02)');
          ctx.fillStyle = grad;
          ctx.fill();

          // 2. Draw line stroke with color-coded spikes
          ctx.beginPath();
          ctx.lineWidth = 1.75;
          ctx.strokeStyle = '#06B6D4'; // cyan

          for (let i = 0; i < n; i++) {
            const ms = samples[i];
            const px = startX + i * stepX;
            const py = scaleY(ms);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // 3. Highlight hitch spikes (>33.3ms) in coral red
          for (let i = 0; i < n; i++) {
            const ms = samples[i];
            if (ms > 33.33) {
              const px = startX + i * stepX;
              const py = scaleY(ms);

              ctx.fillStyle = '#EF4444';
              ctx.beginPath();
              ctx.arc(px, py, 3, 0, Math.PI * 2);
              ctx.fill();

              // Red vertical glow beacon
              ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
              ctx.fillRect(px - 1.5, py, 3, h - py);
            }
          }
        }
      } else {
        // Histogram mode
        const bucketCount = 30;
        const buckets = new Array(bucketCount).fill(0);
        for (let i = 0; i < n; i++) {
          const ms = samples[i];
          const b = Math.min(bucketCount - 1, Math.floor((ms / maxMs) * bucketCount));
          buckets[b]++;
        }

        const maxBucket = Math.max(1, ...buckets);
        const barWidth = w / bucketCount;

        for (let b = 0; b < bucketCount; b++) {
          const barH = (buckets[b] / maxBucket) * (h - 16);
          const msVal = (b / bucketCount) * maxMs;
          const color = msVal > 33.3 ? '#EF4444' : msVal > 18 ? '#F59E0B' : '#10B981';

          ctx.fillStyle = color;
          ctx.fillRect(b * barWidth + 1, h - barH, barWidth - 2, barH);
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
    };
  }, [ringBuffer, sampleCount, showTargetLines, targetHz, mode]);

  // Mouse scrub handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const samples = ringBuffer.getLastN(sampleCount);
    const n = samples.length;
    if (n === 0) return;

    const stepX = rect.width / (sampleCount - 1);
    const sampleIdx = Math.max(0, Math.min(n - 1, Math.round(x / stepX)));
    const ms = samples[sampleIdx] || 16.66;
    const fps = ms > 0 ? Math.min(240, 1000 / ms) : 60;

    const info = { x, y, ms, fps };
    setHoverData(info);
    if (onHoverSample) {
      onHoverSample({ index: sampleIdx, frameTimeMs: ms, fps });
    }
  }, [interactive, ringBuffer, sampleCount, onHoverSample]);

  const handleMouseLeave = useCallback(() => {
    setHoverData(null);
    if (onHoverSample) onHoverSample(null);
  }, [onHoverSample]);

  return (
    <div ref={containerRef} className={`relative w-full select-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Target Legends */}
      {showTargetLines && (
        <div className="absolute top-1 right-2 flex items-center space-x-3 text-[10px] font-mono-avionics pointer-events-none opacity-80">
          <span className="flex items-center space-x-1 text-cyan-400">
            <span className="w-2 h-[2px] bg-cyan-400 inline-block"></span>
            <span>8.3ms (120Hz)</span>
          </span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-2 h-[2px] bg-emerald-400 inline-block"></span>
            <span>16.6ms (60Hz)</span>
          </span>
          <span className="flex items-center space-x-1 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
            <span>Hitch Spike (&gt;33ms)</span>
          </span>
        </div>
      )}

      {/* Interactive Scrub Reticle Line & Floating Tooltip */}
      {hoverData && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center"
          style={{ left: hoverData.x }}
        >
          <div className="w-[1px] h-full bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <div
            className="absolute px-2 py-1 rounded bg-[#0C101C]/95 border border-cyan-500/50 shadow-xl backdrop-blur-md text-[11px] font-mono-avionics text-white whitespace-nowrap transform -translate-x-1/2 -top-7"
            style={{
              borderColor: hoverData.ms > 33.3 ? '#EF4444' : hoverData.ms > 18 ? '#F59E0B' : '#06B6D4',
            }}
          >
            <span className="font-bold text-cyan-300">{hoverData.ms.toFixed(2)} ms</span>
            <span className="text-slate-400 mx-1">·</span>
            <span className={hoverData.ms > 33.3 ? 'text-red-400' : 'text-emerald-400'}>
              {hoverData.fps.toFixed(1)} FPS
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
