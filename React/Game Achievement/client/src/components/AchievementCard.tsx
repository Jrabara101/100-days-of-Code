import React from 'react';
import { AchievementItem } from '../types/achievement';
import { BadgeArt } from './BadgeArt';
import { Pin, Gift, Check, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { getTierBadgeClass, cn } from '../lib/utils';
import { playUiTick } from '../audio/soundEffects';

interface AchievementCardProps {
  item: AchievementItem;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onClaimReward: (id: string) => void;
  isClaiming?: boolean;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  item,
  onSelect,
  onTogglePin,
  onClaimReward,
  isClaiming = false
}) => {
  // Calculate completion percentage across steps
  const totalSteps = item.steps.length;
  const completedSteps = item.steps.filter(s => s.isCompleted || s.current >= s.target).length;
  
  // Overall step progress percentage
  const progressRatio = totalSteps > 0 ? (completedSteps / totalSteps) : (item.isUnlocked ? 1 : 0);
  const progressPercent = Math.round(progressRatio * 100);

  const hasClaimableReward = item.isUnlocked && item.reward && !item.reward.isClaimed;

  const getTierCardBorder = () => {
    if (!item.isUnlocked) return 'border-slate-800/80 hover:border-slate-700';
    switch (item.tier) {
      case 'bronze':
        return 'border-amber-900/60 hover:border-amber-600/80 shadow-[0_0_15px_-4px_rgba(217,119,6,0.2)]';
      case 'silver':
        return 'border-slate-700/80 hover:border-slate-500 shadow-[0_0_15px_-4px_rgba(148,163,184,0.2)]';
      case 'gold':
        return 'border-amber-500/50 hover:border-amber-400 shadow-[0_0_20px_-3px_rgba(245,158,11,0.3)]';
      case 'prismatic':
        return 'border-purple-500/60 hover:border-fuchsia-400 shadow-[0_0_25px_-3px_rgba(168,85,247,0.4)] animate-pulse-glow';
      default:
        return 'border-slate-800';
    }
  };

  return (
    <div
      onClick={() => {
        playUiTick();
        onSelect(item.id);
      }}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl bg-[#141C30]/80 backdrop-blur-xl border p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 select-none",
        getTierCardBorder()
      )}
    >
      {/* Prismatic Shimmer Foil Accent for Top Tier */}
      {item.tier === 'prismatic' && item.isUnlocked && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-20 bg-gradient-to-tr from-purple-500 via-transparent to-pink-500 animate-[shimmerSweep_4s_infinite]" />
      )}

      {/* Top Header Row: Crest, Tier Pill, Rarity, and Pin */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <BadgeArt
              tier={item.tier}
              category={item.category}
              isUnlocked={item.isUnlocked}
              isSecret={item.isSecret}
              size="md"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={cn("text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold", getTierBadgeClass(item.tier))}>
                  {item.tier}
                </span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-800/40 px-1.5 py-0.5 rounded">
                  TOP {item.globalRarityPercent}%
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400 mt-0.5">
                +{item.points} <span className="text-[10px] text-amber-500/80">PTS</span>
              </span>
            </div>
          </div>

          {/* Pin Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playUiTick();
              onTogglePin(item.id);
            }}
            className={cn(
              "p-1.5 rounded-lg border transition-all duration-200 active:scale-90",
              item.isPinned
                ? "bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                : "bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
            )}
            title={item.isPinned ? "Unpin from showcase plinth" : "Pin to showcase plinth"}
          >
            <Pin size={13} className={item.isPinned ? "" : "opacity-60"} />
          </button>
        </div>

        {/* Title & Description */}
        <div className="mb-3">
          <h3 className="font-display font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
            {item.title}
            {item.isSecret && !item.isUnlocked && (
              <Lock size={12} className="text-slate-500" />
            )}
          </h3>

          {/* Shrouded Relic clue vs standard description */}
          {item.isSecret && !item.isUnlocked ? (
            <div className="mt-1 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 font-sans italic">
              <span className="text-purple-400 font-semibold not-italic flex items-center gap-1 mb-0.5 text-[10px]">
                <Sparkles size={11} /> Shrouded Relic Hint:
              </span>
              "{item.secretHint || 'Criteria concealed until prerequisite actions are fulfilled.'}"
            </div>
          ) : (
            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Section: Progress Bar / Claim Reward Button */}
      <div className="mt-3 pt-3 border-t border-slate-800/70">
        {hasClaimableReward ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClaimReward(item.id);
            }}
            disabled={isClaiming}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all active:scale-95 animate-pulse"
          >
            <Gift size={14} />
            <span>CLAIM REWARD VAULT</span>
          </button>
        ) : (
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="text-slate-400">
                {item.isUnlocked ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check size={11} /> Unlocked
                  </span>
                ) : (
                  <span>Progress ({completedSteps}/{totalSteps})</span>
                )}
              </span>
              <span className={item.isUnlocked ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                {progressPercent}%
              </span>
            </div>

            {/* Linear Progress Bar with leading edge pulse */}
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  item.isUnlocked
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                    : "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Claimed status badge if claimed */}
            {item.reward && item.reward.isClaimed && (
              <div className="mt-2 text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
                <Check size={10} /> Reward Vaulted: {item.reward.title}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
