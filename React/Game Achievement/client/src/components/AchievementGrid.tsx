import React, { useState, useMemo } from 'react';
import { AchievementItem, BadgeTier } from '../types/achievement';
import { AchievementCard } from './AchievementCard';
import { Search, Filter, Sparkles, CheckCircle2, Lock, Flame } from 'lucide-react';

interface AchievementGridProps {
  achievements: Record<string, AchievementItem>;
  activeCategory: string;
  onSelectAchievement: (id: string) => void;
  onTogglePin: (id: string) => void;
  onClaimReward: (id: string) => void;
  claimingId: string | null;
}

type StatusFilter = 'all' | 'unlocked' | 'in_progress' | 'locked' | 'claimable';

export const AchievementGrid: React.FC<AchievementGridProps> = ({
  achievements,
  activeCategory,
  onSelectAchievement,
  onTogglePin,
  onClaimReward,
  claimingId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<BadgeTier | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const list = useMemo(() => Object.values(achievements), [achievements]);

  const filteredList = useMemo(() => {
    return list.filter(item => {
      // Category check
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      // Tier check
      if (tierFilter !== 'all' && item.tier !== tierFilter) {
        return false;
      }

      // Status check
      if (statusFilter === 'unlocked' && !item.isUnlocked) return false;
      if (statusFilter === 'locked' && (item.isUnlocked || item.steps.some(s => s.current > 0))) return false;
      if (statusFilter === 'in_progress' && (item.isUnlocked || !item.steps.some(s => s.current > 0))) return false;
      if (statusFilter === 'claimable' && (!item.isUnlocked || !item.reward || item.reward.isClaimed)) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchCategory = item.category.toLowerCase().includes(query);
        const matchTier = item.tier.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchCategory && !matchTier) {
          return false;
        }
      }

      return true;
    });
  }, [list, activeCategory, tierFilter, statusFilter, searchTerm]);

  return (
    <div className="w-full">
      {/* Search and Filters Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 p-4 rounded-2xl bg-[#0E1424]/90 border border-slate-800">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search badges, secret clues, or criteria..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all font-sans"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tier Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'bronze', 'silver', 'gold', 'prismatic'] as Array<BadgeTier | 'all'>).map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono uppercase transition-all ${
                tierFilter === t
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-sm'
                  : 'bg-slate-950/60 text-slate-500 hover:text-slate-300 border border-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'claimable', label: '🎁 Ready' },
            { id: 'unlocked', label: '✓ Unlocked' },
            { id: 'in_progress', label: '⚡ Active' },
            { id: 'locked', label: '🔒 Locked' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id as StatusFilter)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === s.id
                  ? 'bg-purple-950/80 text-purple-200 border border-purple-500/60'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

      </div>

      {/* Grid count display */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1 font-mono">
        <span>Displaying {filteredList.length} of {list.length} Milestones</span>
        {filteredList.length > 0 && (
          <span className="text-slate-400">
            Total Points in Filter: {filteredList.reduce((acc, curr) => acc + curr.points, 0)} PTS
          </span>
        )}
      </div>

      {/* Main 3-4 Column Card Grid */}
      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredList.map(item => (
            <AchievementCard
              key={item.id}
              item={item}
              onSelect={onSelectAchievement}
              onTogglePin={onTogglePin}
              onClaimReward={onClaimReward}
              isClaiming={claimingId === item.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-[#0E1424]/40 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
            <Filter size={20} />
          </div>
          <h3 className="font-display font-bold text-slate-200 text-sm mb-1">
            No Milestones Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Try adjusting your search criteria, tier filters, or switch category tabs to view matching achievements.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setTierFilter('all');
              setStatusFilter('all');
            }}
            className="mt-4 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
