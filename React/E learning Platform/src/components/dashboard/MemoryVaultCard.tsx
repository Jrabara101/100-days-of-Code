import React from 'react';
import { ModuleRetentionStats } from '../../types';
import { Brain, ArrowRight, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { sounds } from '../../services/audioEffects';

interface MemoryVaultCardProps {
  modules: ModuleRetentionStats[];
  dueCardsCount: number;
  onLaunchReview: () => void;
}

export const MemoryVaultCard: React.FC<MemoryVaultCardProps> = ({
  modules,
  dueCardsCount,
  onLaunchReview
}) => {
  // Filter for completed or active modules
  const activeModules = modules.filter(m => m.lessonsCompleted > 0);

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#171B26] p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-500" />
              Spaced-Repetition "Memory Vault"
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ebbinghaus decay curve tracking across modules
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30">
            FSRS / SM-2 Engine
          </span>
        </div>

        {/* Module Memory Decay List */}
        <div className="space-y-2.5 my-3">
          {activeModules.slice(0, 3).map(mod => {
            const isFresh = mod.retentionHealthPercent >= 85;
            const isFading = mod.retentionHealthPercent < 85 && mod.retentionHealthPercent >= 65;
            
            return (
              <div
                key={mod.moduleId}
                className="p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between transition-colors hover:border-black/10 dark:hover:border-white/10"
              >
                <div className="flex-1 mr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
                      {mod.moduleTitle.split(':')[0]}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {mod.moduleTitle.split(':')[1]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isFresh ? 'bg-emerald-500' : isFading ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${mod.retentionHealthPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold tabular-nums text-slate-600 dark:text-slate-300">
                      {mod.retentionHealthPercent}%
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0 text-right">
                  {isFresh ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Fresh
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse-subtle">
                      <AlertTriangle className="w-3 h-3" /> {mod.fadingCardsCount || 3} Fading
                    </span>
                  )}
                  <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                    {mod.daysSinceReview}d ago
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => {
          sounds.playClick();
          onLaunchReview();
        }}
        className="w-full mt-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <Brain className="w-4 h-4" />
        <span>Launch 3-Minute Spaced Review ({dueCardsCount} Cards)</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

