import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Sparkles, X, ArrowUpRight, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export const SinceLastCheckedDrawer: React.FC = () => {
  const { isSinceLastCheckedOpen, setIsSinceLastCheckedOpen, shiftHighlights, setPrimaryMetricId } = useTelemetry();

  if (!isSinceLastCheckedOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-[#11141B] border-l border-white/10 p-6 flex flex-col justify-between shadow-glass text-white">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold flex items-center gap-1.5">
                <Sparkles size={12} /> Delta Briefing
              </span>
              <h3 className="text-base font-bold text-white">
                Since You Last Checked
              </h3>
            </div>
            <button
              onClick={() => setIsSinceLastCheckedOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X size={18} />
            </button>
          </div>

          {/* Calm Takeaway Banner */}
          <div className="my-4 p-4 rounded-xl bg-gradient-to-br from-sky-950/40 to-transparent border border-sky-500/20 text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">3 major shifts since 5:00 PM yesterday:</strong> Checkout speed improved 22%, APAC signups hit a weekly high, and 1 minor Frankfürt gateway timeout spike was resolved.
          </div>

          {/* Highlights List */}
          <div className="space-y-3">
            {shiftHighlights.map((shift) => (
              <div
                key={shift.id}
                onClick={() => {
                  setPrimaryMetricId(shift.metricId);
                  setIsSinceLastCheckedOpen(false);
                }}
                className="p-3.5 rounded-xl bg-[#171B24] border border-white/5 hover:border-sky-400/40 hover:bg-[#1a202c] transition-all cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-sky-300 flex items-center gap-2">
                    {shift.direction === 'up' ? (
                      <TrendingUp size={13} className="text-emerald-400" />
                    ) : (
                      <CheckCircle2 size={13} className="text-sky-400" />
                    )}
                    {shift.title}
                  </span>
                  <ArrowUpRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-xs text-slate-400 leading-normal">{shift.description}</p>
                <div className="text-[10px] font-mono text-slate-500">{shift.timestamp}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Last session: Yesterday 5:00 PM</span>
          <button
            onClick={() => setIsSinceLastCheckedOpen(false)}
            className="px-4 py-2 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
