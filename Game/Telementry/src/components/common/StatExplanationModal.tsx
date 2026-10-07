import React from 'react';
import { CoreStatMetric } from '../../types/telemetry';
import { X, Calculator, ShieldCheck, Database, ExternalLink } from 'lucide-react';

interface StatExplanationModalProps {
  stat: CoreStatMetric | null;
  onClose: () => void;
  onSelectSession: (id: string) => void;
}

export const StatExplanationModal: React.FC<StatExplanationModalProps> = ({
  stat,
  onClose,
  onSelectSession
}) => {
  if (!stat) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stat-modal-title"
    >
      <div 
        className="w-full max-w-xl rounded-lg bg-[#0d1322] border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_40px_rgba(0,240,255,0.15)] relative animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-[#1a2233] text-slate-400 hover:text-white transition"
          aria-label="Close calculation explanation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400 uppercase tracking-widest">
              TELEMETRY_AUDIT // METRIC TRANSPARENCY
            </span>
            <h2 id="stat-modal-title" className="font-['Space_Grotesk'] text-lg font-bold text-slate-100">
              {stat.name} Breakdown
            </h2>
          </div>
        </div>

        {/* Current State Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded bg-[#090d16] border border-[#1f293d] mb-4 text-xs font-['JetBrains_Mono']">
          <div>
            <span className="text-slate-500 block text-[10px]">CURRENT VALUE</span>
            <span className="text-xl font-bold text-cyan-300 tabular-nums">
              {stat.formattedValue}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">PREVIOUS PERIOD</span>
            <span className="text-xl font-bold text-slate-300 tabular-nums">
              {stat.previousValue > 0 ? (stat.unit === '%' ? `${stat.previousValue}%` : stat.previousValue) : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">SAMPLES AUDITED</span>
            <span className="text-xl font-bold text-slate-300 tabular-nums">
              {stat.sessionsCount} sessions
            </span>
          </div>
        </div>

        {/* Formula Section */}
        <div className="space-y-3 text-xs">
          <div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Deterministic Mathematical Formula:
            </span>
            <div className="p-2.5 rounded bg-[#111827] border border-cyan-500/20 font-['JetBrains_Mono'] text-cyan-200 text-xs">
              <code>{stat.formula}</code>
            </div>
          </div>

          <div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              What this measures & why:
            </span>
            <p className="font-['Inter'] text-slate-300 leading-relaxed bg-[#111827]/50 p-2.5 rounded border border-[#1f293d]">
              {stat.explanation}
            </p>
          </div>

          {/* Contributing Sessions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400 uppercase tracking-wider">
                Recent Contributing Sessions:
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-slate-500">
                Tap to inspect full match timeline
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {stat.contributingSessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    onClose();
                    onSelectSession(s.id);
                  }}
                  className="flex items-center justify-between p-2 rounded bg-[#090d16] hover:bg-[#141c30] border border-[#1f293d] hover:border-cyan-400/50 transition cursor-pointer text-xs font-['JetBrains_Mono'] group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        s.result === 'VICTORY' ? 'bg-emerald-400 shadow-[0_0_6px_#10B981]' : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-slate-300 group-hover:text-cyan-300 transition">
                      {s.date} ({s.id})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-bold tabular-nums">
                      {s.value}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="mt-5 pt-3 border-t border-[#1f293d] flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-400/80">
            <ShieldCheck className="w-3.5 h-3.5" />
            Server Validated Event Computation
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#1e293b] hover:bg-[#2d3748] text-slate-200 font-medium transition"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
