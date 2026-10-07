import React from 'react';
import { X, Sparkles, Sun, Moon, CheckCircle2, TrendingUp, Compass } from 'lucide-react';

interface InsightWhyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewActivity: () => void;
}

export const InsightWhyModal: React.FC<InsightWhyModalProps> = ({
  isOpen,
  onClose,
  onViewActivity
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="why-modal-title"
    >
      <div 
        className="w-full max-w-2xl rounded-lg bg-[#0d1322] border border-cyan-500/40 p-6 shadow-[0_0_50px_rgba(0,240,255,0.15)] relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-[#1a2233] text-slate-400 hover:text-white transition"
          aria-label="Close why insight explanation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400 uppercase tracking-widest">
              SUPPORTING_DATA // COMBAT COGNITION EVIDENCE
            </span>
            <h2 id="why-modal-title" className="font-['Space_Grotesk'] text-lg font-bold text-slate-100">
              Why: "Accuracy is up 8.4% this week — mostly from evening sessions"
            </h2>
          </div>
        </div>

        {/* Breakdown Narrative */}
        <p className="font-['Inter'] text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
          We analyzed your last 28 sessions over the past 14 days, grouping engagements by local hour brackets. 
          When you deploy between <strong>19:00 and 23:00</strong>, your crosshair micro-adjustments register with significantly less recoil drift than afternoon queues.
        </p>

        {/* Side-by-side Time of Day Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Evening Performance */}
          <div className="p-4 rounded-lg bg-[#090d16] border border-cyan-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-cyan-300 font-['Space_Grotesk'] font-bold text-sm">
                <Moon className="w-4 h-4 text-cyan-400" />
                Evening Matches (19:00 - 23:00)
              </span>
              <span className="text-[10px] font-['JetBrains_Mono'] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                OPTIMAL REFLEX
              </span>
            </div>
            <div className="space-y-2 text-xs font-['JetBrains_Mono']">
              <div className="flex justify-between text-slate-300">
                <span>Avg Accuracy:</span>
                <strong className="text-cyan-300 text-sm">45.2% (+8.4%)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Win Rate:</span>
                <strong className="text-emerald-400 text-sm">68.0% (17W - 8L)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Primary Rifle:</span>
                <span className="text-slate-200">Phantom-X</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Avg Damage:</span>
                <span className="text-slate-200">2,580 DMG</span>
              </div>
            </div>
          </div>

          {/* Afternoon Performance */}
          <div className="p-4 rounded-lg bg-[#090d16] border border-[#1f293d]">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-slate-400 font-['Space_Grotesk'] font-bold text-sm">
                <Sun className="w-4 h-4 text-amber-400" />
                Afternoon Matches (13:00 - 17:00)
              </span>
              <span className="text-[10px] font-['JetBrains_Mono'] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                BASELINE
              </span>
            </div>
            <div className="space-y-2 text-xs font-['JetBrains_Mono']">
              <div className="flex justify-between text-slate-400">
                <span>Avg Accuracy:</span>
                <span className="text-slate-300 text-sm">36.8%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Win Rate:</span>
                <span className="text-rose-400 text-sm">46.2% (6W - 7L)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Primary Rifle:</span>
                <span className="text-slate-300">Arc-Viper</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Avg Damage:</span>
                <span className="text-slate-300">1,940 DMG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="p-3.5 rounded bg-[#111827] border border-[#1f293d] mb-5 text-xs font-['Inter'] space-y-2">
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Recoil pattern correlation:</strong> Your first-bullet accuracy with the Phantom-X in evening sessions sits at <strong>58.2%</strong> vs 44.1% in earlier queues.
            </span>
          </div>
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Warmup factor:</strong> On days where you spent at least 10 minutes in the firing range or deathmatch, evening win rate surged to <strong>75%</strong>.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1f293d] text-xs font-['JetBrains_Mono']">
          <button
            onClick={() => {
              onClose();
              onViewActivity();
            }}
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            → Filter Activity Log to Evening Sessions
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#090d16] font-bold transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
