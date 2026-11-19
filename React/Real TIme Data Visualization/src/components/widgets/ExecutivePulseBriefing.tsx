import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Sparkles, CheckCircle2, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';

export const ExecutivePulseBriefing: React.FC = () => {
  const { shiftHighlights, setIsSinceLastCheckedOpen } = useTelemetry();

  return (
    <div className="rounded-2xl bg-gradient-to-r from-sky-950/30 via-[#11141B] to-purple-950/20 border border-sky-500/20 p-5 sm:p-6 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Morning Briefing Headline */}
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1">
              <Sparkles size={11} /> 60-Second Executive Digest
            </span>
            <span className="text-xs text-slate-400 font-mono">Tuesday Briefing • 10:45 AM EDT</span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Checkout velocity running <span className="text-emerald-400">+14.2% ahead of weekly target</span> with zero critical outages.
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Morning conversion surge driven by the <strong className="text-white">v2.4 checkout optimization</strong> and targeted Autumn loyalty email. 
            European payment gateway retries recovered smoothly after automated routing shift to Zurich.
          </p>
        </div>

        {/* Right: Shifts CTA Card */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <button
            onClick={() => setIsSinceLastCheckedOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 border border-sky-400/30 transition-all flex items-center gap-2 shadow-glow-cyan"
          >
            <span>✨ 3 Shifts Since Yesterday</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
