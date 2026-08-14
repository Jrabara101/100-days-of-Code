import React, { useEffect, useRef } from 'react';
import { X, BarChart3, TrendingUp, Skull, Utensils, Shield, Clock } from 'lucide-react';

export default function StatisticsModal({
  sim,
  isOpen,
  onClose,
  stats,
  historySnapshots
}) {
  const chartCanvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !chartCanvasRef.current || historySnapshots.length < 2) return;

    const canvas = chartCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    for (let y = 20; y < height; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Find max population in history
    const maxPop = Math.max(30, ...historySnapshots.map(s => s.population + s.brood));
    const pad = 20;
    const chartW = width - pad * 2;
    const chartH = height - pad * 2;

    const drawLine = (dataKey, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      historySnapshots.forEach((snap, idx) => {
        const x = pad + (idx / (historySnapshots.length - 1)) * chartW;
        const val = snap[dataKey] || 0;
        const y = height - pad - (val / maxPop) * chartH;

        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    // Draw Population Line (Emerald)
    drawLine('population', '#10b981');
    // Draw Brood Line (Purple)
    drawLine('brood', '#a855f7');
    // Draw Sugar Line (Sky)
    drawLine('sugar', '#38bdf8');
  }, [isOpen, historySnapshots]);

  if (!isOpen) return null;

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel p-6 rounded-3xl shadow-2xl border border-slate-700 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100 font-mono uppercase tracking-wide">
                Colony Telemetry & Analytics
              </h2>
              <p className="text-xs text-slate-400">
                Demographic trends, mortality rates, and foraging throughput.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lifetime Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center font-mono">
            <TrendingUp className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[10px] text-slate-400 uppercase">Total Hatched</span>
            <span className="text-base font-extrabold text-slate-100 mt-0.5">{stats.totalHatched}</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center font-mono">
            <Skull className="w-4 h-4 text-rose-400 mb-1" />
            <span className="text-[10px] text-slate-400 uppercase">Casualties</span>
            <span className="text-base font-extrabold text-slate-100 mt-0.5">{stats.totalDeaths}</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center font-mono">
            <Utensils className="w-4 h-4 text-sky-400 mb-1" />
            <span className="text-[10px] text-slate-400 uppercase">Food Foraged</span>
            <span className="text-base font-extrabold text-slate-100 mt-0.5">{Math.floor(stats.foodGathered)}</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center font-mono">
            <Shield className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-slate-400 uppercase">Pests Slain</span>
            <span className="text-base font-extrabold text-slate-100 mt-0.5">{stats.enemiesDefeated}</span>
          </div>
        </div>

        {/* Population & Resource Dynamic Timeline */}
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
              Dynamic Telemetry Graph
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Adult Ants
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400" /> Brood
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Sugar Stores
              </span>
            </div>
          </div>

          <div className="relative w-full h-44 bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800">
            <canvas
              ref={chartCanvasRef}
              width={560}
              height={176}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
