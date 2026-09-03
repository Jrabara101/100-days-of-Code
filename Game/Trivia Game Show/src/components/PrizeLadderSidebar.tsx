import React from 'react';
import { Shield, Trophy, Check, Sparkles } from 'lucide-react';
import { PRIZE_LADDER } from '../data/triviaData';

interface PrizeLadderSidebarProps {
  currentTierIndex: number;
}

export const PrizeLadderSidebar: React.FC<PrizeLadderSidebarProps> = ({ currentTierIndex }) => {
  return (
    <aside className="w-full md:w-64 glass-panel p-4 rounded-3xl flex flex-col justify-between border-purple-500/30">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-900/60">
          <span className="font-arcade text-[9px] text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            PRIZE LADDER
          </span>
          <span className="font-crt text-sm text-slate-400">10 TIERS</span>
        </div>

        {/* Vertical Stack: Reversed so Tier 10 is at the top */}
        <div className="flex flex-col-reverse gap-1.5">
          {PRIZE_LADDER.map((step, idx) => {
            const isCurrent = idx === currentTierIndex;
            const isPassed = idx < currentTierIndex;
            const tierStr = (idx + 1).toString().padStart(2, '0');

            if (isCurrent) {
              return (
                <div
                  key={step.tier}
                  className="px-3 py-2 rounded-xl text-xs flex justify-between items-center font-mono font-bold bg-amber-500/25 text-amber-300 border border-amber-400/80 gold-glow animate-pulse"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-arcade text-[9px] text-amber-400">{tierStr}</span>
                    {step.safe && <Shield className="w-3.5 h-3.5 text-emerald-400" />}
                  </span>
                  <span className="font-arcade text-[10px] text-white">
                    ${step.bounty.toLocaleString()}
                  </span>
                </div>
              );
            }

            if (isPassed) {
              return (
                <div
                  key={step.tier}
                  className="px-3 py-1.5 rounded-xl text-xs flex justify-between items-center font-mono font-bold bg-emerald-950/25 text-emerald-400/90 border border-emerald-500/20"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-arcade text-[9px] opacity-70">{tierStr}</span>
                    <Check className="w-3 h-3 text-emerald-400" />
                  </span>
                  <span>${step.bounty.toLocaleString()}</span>
                </div>
              );
            }

            // Future Tier
            return (
              <div
                key={step.tier}
                className={`px-3 py-1.5 rounded-xl text-xs flex justify-between items-center font-mono transition-all ${
                  step.safe
                    ? 'bg-[#151938] text-cyan-300/80 border border-cyan-500/30'
                    : 'bg-[#0a0c22]/50 text-slate-500 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-arcade text-[9px] opacity-50">{tierStr}</span>
                  {step.safe && <Shield className="w-3 h-3 text-cyan-400" />}
                </span>
                <span>${step.bounty.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-purple-900/60 flex flex-col gap-1.5 text-[10px] font-crt text-slate-400">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Safe Checkpoints: Tier 4 ($1k), Tier 7 ($10k), Tier 10 ($100k)</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Speed decay scales continuously (35% - 100%)</span>
        </div>
      </div>
    </aside>
  );
};
