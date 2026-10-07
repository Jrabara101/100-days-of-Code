import React, { useState, useEffect } from 'react';
import { PassportData } from '../types/achievement';
import { X, Copy, Check, ShieldCheck, Trophy, Sparkles, Share2, Award, Zap } from 'lucide-react';
import { formatPoints } from '../lib/utils';
import { playUiTick } from '../audio/soundEffects';

interface TrophyPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrophyPassportModal: React.FC<TrophyPassportModalProps> = ({ isOpen, onClose }) => {
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [copiedType, setCopiedType] = useState<'discord' | 'link' | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/passport')
        .then(res => res.json())
        .then(data => setPassport(data))
        .catch(err => console.error('Failed to fetch passport:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getDiscordEmbedText = () => {
    if (!passport) return '';
    return `🏆 **NEO-ARCADE VAULT // TROPHY PASSPORT** 🏆
👤 **Player:** ${passport.handle} (${passport.rankTitle})
⭐ **Gamerscore:** ${formatPoints(passport.totalPoints)} PTS
🎯 **Completion:** ${passport.completionPercentage}% (${passport.unlockedCount}/${passport.totalAchievements} Unlocked)
💎 **Top Milestone Rarity:** Top ${passport.topRarityPercent}%
🛡️ **Verified Receipts:** ${passport.verifiedReceiptsCount} On-Ledger Signatures
🔑 **Hash Stamp:** \`${passport.passportHash}\``;
  };

  const handleCopy = (type: 'discord' | 'link') => {
    playUiTick();
    if (type === 'discord') {
      navigator.clipboard.writeText(getDiscordEmbedText());
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-[#0E1424] border border-purple-500/50 rounded-3xl p-6 sm:p-8 z-10 shadow-[0_0_60px_rgba(168,85,247,0.35)] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Prismatic ambient background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2">
            <Award className="text-purple-400" size={18} />
            <h2 className="font-display font-extrabold text-base text-slate-100">
              OFFICIAL TROPHY PASSPORT
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {passport ? (
          <div className="mt-6 relative z-10">
            {/* The High-Contrast Visual Passport Card Container */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#141C30] via-[#0E1424] to-[#07090E] border-2 border-purple-500/60 p-6 shadow-2xl overflow-hidden">
              
              {/* Foil holographic accent strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 via-amber-400 to-emerald-400 animate-[shimmerSweep_3s_infinite]" />

              {/* Card Header: Player ID & Crest */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-purple-400 uppercase font-bold flex items-center gap-1.5">
                    <Zap size={11} /> VAULT CITIZEN ID
                  </div>
                  <h3 className="font-display font-black text-xl text-slate-100 tracking-tight">
                    {passport.handle}
                  </h3>
                  <div className="text-xs text-amber-400 font-mono font-medium">
                    {passport.rankTitle}
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/50 flex flex-col items-end">
                  <span className="text-[9px] font-mono uppercase text-purple-300">Rarity Tier</span>
                  <span className="text-xs font-mono font-extrabold text-purple-200">
                    TOP {passport.topRarityPercent}%
                  </span>
                </div>
              </div>

              {/* Stats Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-6">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500">Trophy Score</div>
                  <div className="font-mono font-extrabold text-base text-amber-300">
                    {formatPoints(passport.totalPoints)} <span className="text-[10px] text-amber-500 font-normal">PTS</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500">Completion</div>
                  <div className="font-mono font-extrabold text-base text-purple-300">
                    {passport.completionPercentage}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500">Milestones</div>
                  <div className="font-mono font-extrabold text-base text-emerald-300">
                    {passport.unlockedCount} / {passport.totalAchievements}
                  </div>
                </div>
              </div>

              {/* Security Seal & Cryptographic Hash */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck size={13} />
                  <span>Verified Monotonic Ledger</span>
                </div>
                <div className="font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                  {passport.passportHash}
                </div>
              </div>
            </div>

            {/* Export & Share Controls */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => handleCopy('discord')}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all active:scale-95"
              >
                {copiedType === 'discord' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedType === 'discord' ? 'COPIED EMBED!' : 'COPY DISCORD EMBED'}</span>
              </button>

              <button
                onClick={() => handleCopy('link')}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {copiedType === 'link' ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copiedType === 'link' ? 'LINK COPIED!' : 'SHARE VAULT LINK'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            Generating cryptographic passport digest...
          </div>
        )}

      </div>
    </div>
  );
};
