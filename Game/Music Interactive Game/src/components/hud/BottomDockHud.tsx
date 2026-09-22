import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomDockHudProps {
  miniCanvasRef: React.RefObject<HTMLCanvasElement>;
}

export const BottomDockHud: React.FC<BottomDockHudProps> = ({ miniCanvasRef }) => {
  const { stats } = useGameStore();

  const accuracy =
    stats.totalNotes > 0
      ? ((stats.accuracyHits / stats.totalNotes) * 100).toFixed(1)
      : '99.2';

  const gradeColors: Record<string, string> = {
    'S+': 'text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]',
    S: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    A: 'text-cyan-400',
    B: 'text-blue-400',
    C: 'text-rose-400',
  };

  return (
    <footer className="relative z-20 w-full px-6 pb-5 flex items-end justify-between pointer-events-none">
      {/* Left: Multiplier Orb & Sync Accuracy */}
      <div className="flex items-center gap-4 pointer-events-auto">
        {/* Multiplier Orb */}
        <div
          className={cn(
            'relative flex items-center justify-center w-16 h-16 rounded-2xl bg-surface/90 border-2 backdrop-blur-xl transition-all duration-300 transform',
            stats.multiplier > 1
              ? 'border-cyan-400 shadow-neon-cyan scale-105'
              : 'border-cyan-500/30'
          )}
        >
          <div className="absolute inset-1 rounded-xl bg-cyan-500/10 animate-pulse" />
          <div className="relative z-10 text-center">
            <div className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider">
              COMBO
            </div>
            <div className="text-xl font-extrabold text-white font-mono leading-none">
              x{stats.multiplier}
            </div>
          </div>
        </div>

        {/* Sync Accuracy Telemetry */}
        <div className="bg-surface/90 border border-cyan-500/20 backdrop-blur-xl px-4 py-2.5 rounded-xl flex flex-col shadow-glass">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            SYNC ACCURACY
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-lg font-bold text-cyan-300">{accuracy}%</span>
            <span className={cn('text-xs font-mono font-black', gradeColors[stats.grade] || 'text-cyan-400')}>
              GRADE {stats.grade}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Real-time Mini Audio Spectrum Canvas */}
      <div className="hidden lg:flex flex-col items-center bg-surface/90 border border-cyan-500/20 backdrop-blur-xl px-5 py-2.5 rounded-2xl shadow-glass pointer-events-auto">
        <div className="flex items-center justify-between w-64 mb-1.5 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            20Hz SUB
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            1kHz MID
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            8kHz HIGH
          </span>
        </div>
        <canvas
          ref={miniCanvasRef}
          width={260}
          height={32}
          className="w-64 h-8 rounded-lg bg-slate-950/80 border border-slate-800"
        />
      </div>

      {/* Right: Score Counter & Shield Gauge */}
      <div className="flex items-center gap-4 pointer-events-auto">
        <div className="bg-surface/90 border border-cyan-500/20 backdrop-blur-xl px-5 py-2.5 rounded-xl flex flex-col items-end min-w-[160px] shadow-glass">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            SCORE ENGINE
          </span>
          <AnimatedCounter
            value={stats.score}
            className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400"
          />
        </div>

        {/* Shield / Synth Buffer */}
        <div className="bg-surface/90 border border-cyan-500/20 backdrop-blur-xl px-3.5 py-2.5 rounded-xl flex flex-col items-center shadow-glass">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>SYNTH BUFFER</span>
          </div>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-200"
              style={{ width: `${stats.shield}%` }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
