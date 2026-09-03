import React from 'react';
import { Shield, Check, Play, Trophy } from 'lucide-react';
import { PRIZE_LADDER } from '../data/triviaData';

interface TierProgressRibbonProps {
  currentTierIndex: number;
}

export const TierProgressRibbon: React.FC<TierProgressRibbonProps> = ({ currentTierIndex }) => {
  return (
    <div className="w-full max-w-7xl mx-auto bg-[#0a0c20]/90 border border-purple-900/50 rounded-xl p-2.5 overflow-x-auto shadow-lg">
      <div className="flex items-center gap-2 min-w-max mx-auto justify-between">
        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="font-arcade text-[9px] text-cyan-300 uppercase tracking-widest">
            STAGE TIERS:
          </span>
        </div>

        <div className="flex items-center gap-2">
          {PRIZE_LADDER.map((step, idx) => {
            const isCurrent = idx === currentTierIndex;
            const isPassed = idx < currentTierIndex;
            const tierNumStr = (idx + 1).toString().padStart(2, '0');

            if (isCurrent) {
              return (
                <div
                  key={step.tier}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg bg-pink-500/25 border-2 border-pink-500 text-white font-crt text-base shadow-[0_0_15px_rgba(236,72,153,0.7)] animate-pulse"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-arcade text-[9px] text-pink-400 font-bold">{tierNumStr}</span>
                  <span className="font-bold text-amber-400 text-lg tracking-wider">
                    ${step.bounty.toLocaleString()}
                  </span>
                  {step.safe && (
                    <span className="font-arcade text-[8px] bg-emerald-500 text-black px-1 rounded font-bold">
                      SAFE
                    </span>
                  )}
                </div>
              );
            }

            if (isPassed) {
              return (
                <div
                  key={step.tier}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#101332] border border-slate-700/50 text-slate-300 font-crt text-sm"
                >
                  <span className="text-cyan-400 text-xs font-mono">{tierNumStr}</span>
                  <span>${step.bounty.toLocaleString()}</span>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              );
            }

            // Future Tier
            return (
              <div
                key={step.tier}
                className={`flex items-center gap-1.5 px-2 py-1 rounded font-crt text-sm ${
                  step.safe
                    ? 'bg-emerald-950/20 border border-emerald-500/40 text-emerald-400/80'
                    : 'bg-[#0b0d26]/60 border border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-xs opacity-60 font-mono">{tierNumStr}</span>
                <span>${step.bounty.toLocaleString()}</span>
                {step.safe && <Shield className="w-3 h-3 text-emerald-400" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
