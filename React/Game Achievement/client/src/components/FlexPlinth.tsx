import React from 'react';
import { AchievementItem } from '../types/achievement';
import { BadgeArt } from './BadgeArt';
import { Pin, Star, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import { getTierBadgeClass } from '../lib/utils';

interface FlexPlinthProps {
  pinnedAchievements: AchievementItem[];
  onSelectAchievement: (id: string) => void;
  onUnpin: (id: string) => void;
}

export const FlexPlinth: React.FC<FlexPlinthProps> = ({
  pinnedAchievements,
  onSelectAchievement,
  onUnpin
}) => {
  const maxSlots = 3;
  const emptySlotsCount = Math.max(0, maxSlots - pinnedAchievements.length);

  return (
    <section className="w-full mb-8 relative">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-widest font-mono text-purple-300 font-bold flex items-center gap-2">
              FLEX PLINTH SHOWCASE
              <span className="text-[10px] text-slate-500 font-normal">({pinnedAchievements.length}/{maxSlots} Pinned)</span>
            </h2>
            <p className="text-[11px] text-slate-500">Hall of fame plinths spotlighting your rarest keystone feats</p>
          </div>
        </div>
      </div>

      {/* 3-Card Spotlight Rack */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pinnedAchievements.map((item, idx) => {
          return (
            <div
              key={item.id}
              onClick={() => onSelectAchievement(item.id)}
              className="group relative cursor-pointer rounded-2xl bg-gradient-to-b from-[#141C30]/90 to-[#0E1424] border border-slate-800 hover:border-purple-500/50 p-4 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {/* Plinth pedestal back light */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/20 via-transparent to-transparent pointer-events-none" />

              {/* Top slot pill & Unpin button */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span>SLOT #{idx + 1}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                    TOP {item.globalRarityPercent}%
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpin(item.id);
                    }}
                    className="p-1 rounded-md bg-slate-900/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 transition-all text-xs"
                    title="Unpin from Plinth"
                  >
                    <Pin size={12} className="rotate-45" />
                  </button>
                </div>
              </div>

              {/* Main Badge Crest and Title on Pedestal */}
              <div className="flex items-center gap-3.5 relative z-10">
                <BadgeArt
                  tier={item.tier}
                  category={item.category}
                  isUnlocked={item.isUnlocked}
                  isSecret={item.isSecret}
                  size="md"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${getTierBadgeClass(item.tier)}`}>
                      {item.tier}
                    </span>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      +{item.points} PTS
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {item.description}
                  </p>
                </div>

                <ChevronRight size={16} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
              </div>

              {/* Verified Holographic Receipt Watermark */}
              {item.receipt && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck size={11} /> Verified Stamp
                  </span>
                  <span>{item.receipt.verificationHash}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty Plinth Placeholders */}
        {Array.from({ length: emptySlotsCount }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="rounded-2xl border border-dashed border-slate-800/80 bg-[#0E1424]/40 p-6 flex flex-col items-center justify-center text-center group transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-600 mb-2">
              <Pin size={16} />
            </div>
            <div className="text-xs font-mono font-medium text-slate-400 mb-1">
              Plinth Slot #{pinnedAchievements.length + i + 1} Open
            </div>
            <div className="text-[11px] text-slate-600 max-w-[200px]">
              Pin any achievement card from the matrix below to spotlight it here
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
