import React, { useState, useEffect } from 'react';
import { AchievementItem } from '../types/achievement';
import { Sparkles, X, Gift, Check, ShieldCheck, Trophy } from 'lucide-react';
import { BadgeArt } from './BadgeArt';
import { triggerUnlockConfetti } from '../audio/soundEffects';

interface LootVaultModalProps {
  achievement: AchievementItem | null;
  onClose: () => void;
}

export const LootVaultModal: React.FC<LootVaultModalProps> = ({ achievement, onClose }) => {
  const [stage, setStage] = useState<'cracking' | 'opened'>('cracking');

  useEffect(() => {
    if (achievement) {
      setStage('cracking');
      const timer = setTimeout(() => {
        setStage('opened');
        triggerUnlockConfetti(achievement.tier);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [achievement]);

  if (!achievement || !achievement.reward) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
      />

      {/* Vault Modal Body */}
      <div className="relative w-full max-w-lg bg-[#0E1424] border border-amber-500/40 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] z-10 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Radiant God-Rays Ambient Light */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <X size={16} />
        </button>

        {stage === 'cracking' ? (
          <div className="py-12 flex flex-col items-center">
            {/* Shaking Vault Core Animation */}
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-700 p-1 animate-chest-cracking shadow-[0_0_30px_rgba(245,158,11,0.6)] flex items-center justify-center">
              <div className="w-full h-full bg-[#07090E] rounded-[22px] flex items-center justify-center">
                <Gift size={48} className="text-amber-400 animate-pulse" />
              </div>
            </div>
            <h3 className="font-display font-extrabold text-xl text-amber-300 mt-6 tracking-wide uppercase animate-pulse">
              DE-ENCRYPTING REWARD VAULT...
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">Verifying receipt signature on chain</p>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center animate-in fade-in duration-500">
            {/* Celebratory Icon & Badge */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
              <BadgeArt
                tier={achievement.tier}
                category={achievement.category}
                isUnlocked={true}
                size="lg"
              />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold mb-3 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Sparkles size={13} />
              <span>LOOT VAULT DISPENSED</span>
            </div>

            <h2 className="font-display font-black text-2xl text-slate-100 mb-1">
              {achievement.reward.title}
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-mono">
              Reward Type: <span className="text-purple-400 uppercase">{achievement.reward.type.replace('_', ' ')}</span>
            </p>

            {/* Reward Display Box */}
            <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left mb-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 font-mono">Attached Milestone:</span>
                <span className="text-amber-400 font-mono font-bold">+{achievement.points} PTS</span>
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {achievement.title}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {achievement.description}
              </div>

              {achievement.receipt && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} /> Signed Receipt
                  </span>
                  <span>{achievement.receipt.verificationHash}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95 uppercase font-mono tracking-wider"
              >
                EQUIP TO PROFILE & VAULT
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
