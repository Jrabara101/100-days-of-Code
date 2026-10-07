import React from 'react';
import { AchievementItem } from '../types/achievement';
import { BadgeArt } from './BadgeArt';
import { X, Gift, Check, Pin, ShieldCheck, Sparkles, Lock, Clock, Award } from 'lucide-react';
import { getTierBadgeClass, formatPoints } from '../lib/utils';
import { playUiTick } from '../audio/soundEffects';

interface AchievementDrawerProps {
  item: AchievementItem | null;
  isOpen: boolean;
  onClose: () => void;
  onTogglePin: (id: string) => void;
  onClaimReward: (id: string) => void;
  isClaiming?: boolean;
}

export const AchievementDrawer: React.FC<AchievementDrawerProps> = ({
  item,
  isOpen,
  onClose,
  onTogglePin,
  onClaimReward,
  isClaiming = false
}) => {
  if (!isOpen || !item) return null;

  const totalSteps = item.steps.length;
  const completedSteps = item.steps.filter(s => s.isCompleted || s.current >= s.target).length;
  const progressRatio = totalSteps > 0 ? (completedSteps / totalSteps) : (item.isUnlocked ? 1 : 0);
  const progressPercent = Math.round(progressRatio * 100);

  const hasClaimableReward = item.isUnlocked && item.reward && !item.reward.isClaimed;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Drawer Panel (shadcn Sheet) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0E1424] border-l border-slate-800 text-slate-100 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
          
          {/* Header Controls */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${getTierBadgeClass(item.tier)}`}>
                  {item.tier} Tier
                </span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 border border-purple-800/40 px-2 py-0.5 rounded font-bold">
                  TOP {item.globalRarityPercent}% RARITY
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playUiTick();
                    onTogglePin(item.id);
                  }}
                  className={`p-2 rounded-xl border text-xs transition-all ${
                    item.isPinned
                      ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={item.isPinned ? "Unpin from Plinth" : "Pin to Plinth"}
                >
                  <Pin size={15} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* High-Res Hero Badge Showcase */}
            <div className="my-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <BadgeArt
                  tier={item.tier}
                  category={item.category}
                  isUnlocked={item.isUnlocked}
                  isSecret={item.isSecret}
                  size="xl"
                />
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-amber-400 font-extrabold text-base">
                  +{item.points} PTS
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                  {item.category} Codex
                </span>
              </div>

              <h2 className="font-display font-extrabold text-xl text-slate-100 mb-2">
                {item.title}
              </h2>

              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Shrouded Clue Section if Secret */}
            {item.isSecret && (
              <div className="mb-6 p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs">
                <div className="flex items-center gap-1.5 text-purple-300 font-semibold mb-1">
                  <Sparkles size={14} />
                  <span>De-Cloaked Secret Cipher Clue</span>
                </div>
                <p className="text-slate-300 italic font-sans leading-relaxed">
                  "{item.secretHint || 'Hidden milestone. Progressive actions will decrypt the coordinate.'}"
                </p>
              </div>
            )}

            {/* Multi-Step Objectives Checklist */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-mono mb-2.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">
                  Milestone Objectives ({completedSteps}/{totalSteps})
                </span>
                <span className="text-purple-400 font-bold">{progressPercent}%</span>
              </div>

              <div className="space-y-2">
                {item.steps.map(step => {
                  const isDone = step.isCompleted || step.current >= step.target;
                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                              : 'border-slate-700 bg-slate-950 text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                        <span className="truncate">{step.label}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {step.current} / {step.target}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reward Payload Preview */}
            {item.reward && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#141C30] border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
                    <Gift size={13} className="text-emerald-400" /> Attached Vault Reward
                  </span>
                  {item.reward.isClaimed ? (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={10} /> CLAIMED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full">
                      LOCKED IN VAULT
                    </span>
                  )}
                </div>

                <div className="text-sm font-display font-bold text-slate-100 mb-0.5">
                  {item.reward.title}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Reward Code: {item.reward.value}
                </div>
              </div>
            )}

            {/* Cryptographic Unlock Receipt Stamp */}
            {item.isUnlocked && item.receipt && (
              <div className="mb-6 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 font-mono text-[10px]">
                <div className="flex items-center justify-between text-emerald-400 mb-1.5 font-bold">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={13} /> Server-Authoritative Receipt
                  </span>
                  <span>{item.receipt.verificationHash}</span>
                </div>
                <div className="text-slate-500 truncate mb-0.5">
                  Signature: {item.receipt.signature.substring(0, 32)}...
                </div>
                <div className="text-slate-500 flex items-center gap-1">
                  <Clock size={10} /> Unlocked: {new Date(item.receipt.unlockedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-800">
            {hasClaimableReward ? (
              <button
                onClick={() => onClaimReward(item.id)}
                disabled={isClaiming}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all active:scale-95 animate-pulse"
              >
                <Gift size={16} />
                <span>CRACK VAULT & CLAIM REWARD</span>
              </button>
            ) : item.isUnlocked ? (
              <div className="w-full py-2.5 text-center text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center justify-center gap-1.5">
                <Check size={14} /> Milestone Mastered & Recorded to Ledger
              </div>
            ) : (
              <div className="w-full py-2.5 text-center text-xs font-mono text-slate-500 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center gap-1.5">
                <Lock size={13} /> Complete all objectives above to unlock
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
