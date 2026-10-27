import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { GameTitle } from '../types/game';
import { HoverVideoCard } from './HoverVideoCard';
import { Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useStore } from '../lib/store';

export interface CatalogBentoGridProps {
  games: (GameTitle & { similarityScore?: number })[];
  totalMatches: number;
  isLoading?: boolean;
}

export function CatalogBentoGrid({ games, totalMatches, isLoading = false }: CatalogBentoGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);

  const sortBy = useStore((s) => s.sortBy);
  const setSortBy = useStore((s) => s.setSortBy);

  // Responsive columns calculation
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1);
      else if (width < 1024) setColumns(2);
      else if (width < 1440) setColumns(3);
      else setColumns(4);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Split games array into rows of `columns` items
  const rows = useMemo(() => {
    const r: (GameTitle & { similarityScore?: number })[][] = [];
    for (let i = 0; i < games.length; i += columns) {
      r.push(games.slice(i, i + columns));
    }
    return r;
  }, [games, columns]);

  // TanStack Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 390, // Approximate row height with 16:9 card + trays
    overscan: 2,
  });

  return (
    <div className="w-full space-y-4">
      {/* Catalog Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#101622] border border-white/5">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-white text-base">
            DISCOVERY CATALOG
          </span>
          <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#06B6D4]/15 px-2.5 py-0.5 rounded-full border border-[#06B6D4]/30">
            {totalMatches} Titles Matching DNA
          </span>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#94A3B8] flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#06B6D4]" />
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#192234] text-xs font-mono text-white border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#06B6D4]"
          >
            <option value="alchemy">DNA Similarity (Cosine Score)</option>
            <option value="popular">Most Popular (Concurrent Players)</option>
            <option value="topRated">Top Rated Review Score</option>
            <option value="discount">Biggest Discount (%)</option>
            <option value="priceAsc">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Virtualized Container */}
      <div
        ref={parentRef}
        className="w-full overflow-y-auto max-h-[1400px] pr-1"
        style={{ contain: 'strict' }}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] rounded-xl bg-[#101622] animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] font-mono space-y-3">
            <SlidersHorizontal className="w-10 h-10 mx-auto text-[#06B6D4] opacity-50" />
            <p className="text-base text-white font-display">No game titles match the current DNA filters.</p>
            <p className="text-xs">Try relaxing tag weights or clearing strictly excluded tags.</p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowGames = rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="py-3"
                >
                  <div
                    className={cn(
                      'grid gap-6',
                      columns === 1 && 'grid-cols-1',
                      columns === 2 && 'grid-cols-2',
                      columns === 3 && 'grid-cols-3',
                      columns === 4 && 'grid-cols-4'
                    )}
                  >
                    {rowGames.map((game, idx) => (
                      <HoverVideoCard
                        key={game.id}
                        game={game}
                        priority={virtualRow.index < 2 && idx < 4}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
