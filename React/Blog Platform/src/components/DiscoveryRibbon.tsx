import React from 'react';
import { TimeBudgetFilter } from '../types';
import { CATEGORIES } from '../data/mockData';
import { Clock, Filter, Sparkles, Video, BookOpen, Coffee, Wrench } from 'lucide-react';
import { useReader } from '../context/ReaderContext';

interface DiscoveryRibbonProps {
  selectedCategory: string; // 'all' or categoryId
  onSelectCategory: (catId: string) => void;
  selectedTimeFilter: TimeBudgetFilter;
  onSelectTimeFilter: (filter: TimeBudgetFilter) => void;
  totalFilteredCount: number;
}

export const DiscoveryRibbon: React.FC<DiscoveryRibbonProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedTimeFilter,
  onSelectTimeFilter,
  totalFilteredCount,
}) => {
  const { settings } = useReader();

  const timeFilterOptions: { id: TimeBudgetFilter; label: string; icon: any }[] = [
    { id: 'all', label: 'All Durations', icon: Filter },
    { id: 'commute', label: '☕ 3-Min Commute', icon: Coffee },
    { id: 'deep', label: '📖 10-Min Deep Dive', icon: BookOpen },
    { id: 'video', label: '🎬 Video Essay', icon: Video },
    { id: 'playbook', label: '🛠️ Actionable Playbook', icon: Wrench },
  ];

  return (
    <div
      className={`sticky top-[86px] sm:top-[92px] z-20 border-b transition-colors duration-300 ${
        settings.palette === 'midnight'
          ? 'bg-[#0F1115]/85 border-white/10 text-white'
          : settings.palette === 'sepia'
          ? 'bg-[#F4ECD8]/85 border-[#3B3228]/15 text-[#3B3228]'
          : 'bg-[#FAF8F5]/85 border-black/10 text-[#18181B]'
      } glass-header`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left Zone: Category Pillars with Live Pulse */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-2 px-2">
            {/* All Essays Pill */}
            <button
              onClick={() => onSelectCategory('all')}
              className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-75 hover:opacity-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-subtle-pulse"></span>
              All Essays
            </button>

            {/* Category Pillars */}
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? `${cat.accentBadgeClass} font-semibold ring-1 shadow-sm`
                      : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-80 hover:opacity-100 border border-transparent'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.accentColor }}
                  ></span>
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-60 font-mono-tabular font-normal">
                    {cat.id === 'video' ? '▶' : '•'} {cat.pulseLabel.split('•')[1]?.trim() || ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Zone: Time & Cognitive Depth Filter */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 self-start lg:self-auto">
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono-tabular opacity-60 uppercase mr-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Time-to-Spare:</span>
            </div>

            <div
              className={`flex items-center gap-1 p-1 rounded-lg border ${
                settings.palette === 'midnight'
                  ? 'bg-black/30 border-white/10'
                  : settings.palette === 'sepia'
                  ? 'bg-[#E8DEC6]/60 border-[#3B3228]/15'
                  : 'bg-black/5 border-black/10'
              }`}
            >
              {timeFilterOptions.map((opt) => {
                const isActive = selectedTimeFilter === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onSelectTimeFilter(opt.id)}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? settings.palette === 'midnight'
                          ? 'bg-white/20 text-white font-bold shadow-xs'
                          : 'bg-white text-black font-bold shadow-xs'
                        : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3 h-3 opacity-80" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] font-mono-tabular opacity-50 ml-1 hidden md:inline">
              ({totalFilteredCount} matching)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
