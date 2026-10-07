import React from 'react';
import { AchievementCategory, AchievementTrackerState } from '../types/achievement';
import { Trophy, Share2, Flame, Compass, Cpu, Sparkles, LayoutGrid, Radio } from 'lucide-react';
import { formatPoints } from '../lib/utils';

interface TopNavHUDProps {
  state: AchievementTrackerState;
  isConnected: boolean;
  onSelectCategory: (cat: AchievementCategory | 'all') => void;
  onOpenPassport: () => void;
}

export const TopNavHUD: React.FC<TopNavHUDProps> = ({
  state,
  isConnected,
  onSelectCategory,
  onOpenPassport
}) => {
  const totalItems = Object.keys(state.achievements).length;
  const unlocked = state.unlockedCount;
  const completionPercent = totalItems > 0 ? Math.round((unlocked / totalItems) * 100) : 0;

  const categories: Array<{ id: AchievementCategory | 'all'; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'All Codex', icon: <LayoutGrid size={15} /> },
    { id: 'combat', label: 'Combat', icon: <Flame size={15} /> },
    { id: 'exploration', label: 'Discovery', icon: <Compass size={15} /> },
    { id: 'mastery', label: 'Mastery', icon: <Cpu size={15} /> },
    { id: 'secrets', label: 'Secrets', icon: <Sparkles size={15} /> }
  ];

  const getCategoryCount = (catId: AchievementCategory | 'all') => {
    if (catId === 'all') return totalItems;
    return Object.values(state.achievements).filter(a => a.category === catId).length;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090E]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left: Brand & Gamerscore Capsule */}
          <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 p-0.5 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <div className="w-full h-full bg-[#07090E] rounded-[10px] flex items-center justify-center">
                  <Trophy size={18} className="text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wider text-sm text-slate-100 uppercase font-display">
                    NEO-ARCADE <span className="text-purple-400">VAULT</span>
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono">
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-slate-400">{isConnected ? 'LIVE WS' : 'OFFLINE'}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">Authoritative Progression Ledger</div>
              </div>
            </div>

            {/* Score Capsule */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#0E1424] border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Trophy size={16} className="text-amber-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-amber-500/80 font-mono font-semibold">Trophy Score</span>
                <span className="font-mono font-bold text-sm tracking-tight text-amber-300">
                  {formatPoints(state.totalPoints)} <span className="text-[10px] text-amber-500">PTS</span>
                </span>
              </div>
            </div>
          </div>

          {/* Center: Overall Completion Progress */}
          <div className="flex-1 max-w-md w-full px-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Radio size={12} className="text-purple-400 animate-spin" />
                Vault Completion
              </span>
              <span className="font-mono text-slate-200 font-bold">
                <span className="text-purple-400">{unlocked}</span> / {totalItems} <span className="text-slate-500">({completionPercent}%)</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 rounded-full transition-all duration-700 ease-out relative shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                style={{ width: `${completionPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmerSweep_2s_infinite]" />
              </div>
            </div>
          </div>

          {/* Right: Trophy Passport Share Action */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={onOpenPassport}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition-all active:scale-95 shadow-sm text-xs font-semibold"
              title="View & Export Cryptographic Trophy Passport"
            >
              <Share2 size={14} className="text-purple-400" />
              <span>Trophy Passport</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs Bar */}
        <div className="flex items-center gap-2 mt-3.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => {
            const isActive = state.activeCategory === cat.id;
            const count = getCategoryCount(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? 'bg-purple-950/60 text-purple-200 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                    : 'bg-slate-900/50 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span className={isActive ? 'text-purple-400' : 'text-slate-500'}>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-purple-800/60 text-purple-200' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
