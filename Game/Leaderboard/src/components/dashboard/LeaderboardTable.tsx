import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  SearchX, 
  Cpu, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { LeaderboardItem } from '@/types/leaderboard';
import { LeaderboardRow } from './LeaderboardRow';
import { Button } from '@/components/ui/button';

interface LeaderboardTableProps {
  players: LeaderboardItem[];
  sortBy: string;
  sortAsc: boolean;
  onSort: (column: 'rank' | 'username' | 'winRate' | 'score') => void;
  favorites: Set<string>;
  onToggleFavorite: (userId: string, e: React.MouseEvent) => void;
  onSelectPlayer: (player: LeaderboardItem) => void;
  onResetFilters: () => void;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  players,
  sortBy,
  sortAsc,
  onSort,
  favorites,
  onToggleFavorite,
  onSelectPlayer,
  onResetFilters,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // 64px row height (h-16)
    overscan: 10,
  });

  const renderSortIndicator = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortAsc ? (
      <ArrowUp className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
    );
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/80 bg-slate-950/70 shadow-2xl backdrop-blur-md">
      
      {/* Sticky Table Header */}
      <div className="sticky top-0 z-20 flex h-12 w-full items-center justify-between border-b border-border/80 bg-slate-900/95 px-4 text-xs font-black uppercase tracking-wider text-muted-foreground backdrop-blur-md select-none">
        
        {/* Rank & Delta */}
        <div 
          onClick={() => onSort('rank')}
          className="group flex w-24 sm:w-28 cursor-pointer items-center gap-1.5 hover:text-white transition-colors"
        >
          <span>Rank</span>
          {renderSortIndicator('rank')}
        </div>

        {/* Player Profile */}
        <div 
          onClick={() => onSort('username')}
          className="group flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 hover:text-white transition-colors pr-2"
        >
          <span>Player Profile</span>
          {renderSortIndicator('username')}
        </div>

        {/* Tier */}
        <div className="hidden sm:flex w-28 items-center justify-center text-center">
          <span>Tier</span>
        </div>

        {/* Win Rate */}
        <div 
          onClick={() => onSort('winRate')}
          className="group hidden md:flex w-44 cursor-pointer items-center justify-start gap-1.5 hover:text-white transition-colors px-2"
        >
          <span>Win Rate</span>
          {renderSortIndicator('winRate')}
        </div>

        {/* Score */}
        <div 
          onClick={() => onSort('score')}
          className="group flex w-28 cursor-pointer items-center justify-end gap-1.5 text-right hover:text-white transition-colors pr-2"
        >
          <span>Rating / LP</span>
          {renderSortIndicator('score')}
        </div>

        {/* Favorite Icon Header */}
        <div className="w-9 text-center text-slate-500">
          ★
        </div>
      </div>

      {/* Virtualized Rows Scroll Container */}
      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-4">
            <SearchX className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-bold text-white mb-1">No ranked players found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            We couldn't find any players matching your active search and filter criteria.
          </p>
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div
          ref={parentRef}
          className="h-[620px] w-full overflow-y-auto overflow-x-hidden"
          style={{ contain: 'strict' }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const player = players[virtualRow.index];
              if (!player) return null;

              return (
                <div
                  key={player.userId}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <LeaderboardRow
                    player={player}
                    isFavorite={favorites.has(player.userId)}
                    onToggleFavorite={onToggleFavorite}
                    onSelectPlayer={onSelectPlayer}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Footer Status Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/80 bg-slate-900/90 px-4 py-3 text-xs text-muted-foreground gap-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-400" />
          <span>
            Displaying <strong className="text-white font-mono">{players.length.toLocaleString()}</strong> players (Virtual scroll locked at 60 FPS)
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Anti-Cheat Verified
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono">
            Low Latency Server Engine
          </span>
        </div>
      </div>

    </div>
  );
};
