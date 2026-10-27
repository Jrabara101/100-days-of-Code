import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Gamepad2, ArrowRight, X } from 'lucide-react';
import { GameTitle } from '../types/game';
import { useStore } from '../lib/store';
import { formatPrice, cn } from '../lib/utils';

export interface CommandPaletteProps {
  games: GameTitle[];
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ games, isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const setSelectedGame = useStore((s) => s.setSelectedGame);
  const setQuickLookGame = useStore((s) => s.setQuickLookGame);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim()
    ? games.filter((g) => {
        const q = query.toLowerCase();
        return (
          g.title.toLowerCase().includes(q) ||
          g.developer.toLowerCase().includes(q) ||
          g.tags.some((t) => t.name.toLowerCase().includes(q))
        );
      })
    : games.slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl glass-popover rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 z-10 text-white flex flex-col">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-[#101622]">
          <Search className="w-5 h-5 text-[#06B6D4]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, tags, developers, or genres..."
            className="w-full bg-transparent text-base text-white font-sans placeholder-[#94A3B8] focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-[#94A3B8] bg-[#192234] border border-white/10 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-96 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
            {query.trim() ? `Search Results (${filtered.length})` : 'Featured & Suggested Titles'}
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#94A3B8]">
              No titles found matching "{query}".
            </div>
          ) : (
            filtered.map((game) => (
              <div
                key={game.id}
                onClick={() => {
                  onClose();
                  setSelectedGame(game);
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#192234] cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={game.media.capsuleUrl}
                    alt={game.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-sm text-white group-hover:text-[#38BDF8] transition-colors truncate">
                      {game.title}
                    </h4>
                    <p className="text-xs text-[#94A3B8] truncate">
                      {game.developer} • {game.tags.slice(0, 2).map((t) => t.name).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-white">
                    {formatPrice(game.priceCents * (1 - game.discountPercent / 100))}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-[#080B11] border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
          <span>[Enter] Navigate to Store Page</span>
          <span>[↑ / ↓] Select</span>
        </div>
      </div>
    </div>
  );
}
