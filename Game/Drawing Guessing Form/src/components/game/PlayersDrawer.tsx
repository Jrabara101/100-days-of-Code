import React from 'react';
import { Sparkles, X, Share2, Pencil, Check, Trophy } from 'lucide-react';
import { Player } from '@/types/game';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface PlayersDrawerProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  roomId: string;
}

export const PlayersDrawer: React.FC<PlayersDrawerProps> = ({
  open,
  onClose,
  players,
  roomId,
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const copyRoomLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert(`Room link for Den #${roomId} copied to clipboard!`);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 w-80 bg-studio-cream/98 backdrop-blur-xl border-l border-[#C8B8A0] z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#C8B8A0] bg-studio-aged flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-studio-sienna" />
            <h3 className="font-serif font-bold text-sm text-studio-ink">
              Artists in the Den ({players.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-studio-charcoal hover:text-studio-ink hover:bg-studio-paper transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Players List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar">
          {sortedPlayers.map((p, index) => {
            return (
              <div
                key={p.id}
                className={cn(
                  'p-3 rounded-xl border shadow-sm flex items-center justify-between transition-all',
                  p.isDrawing
                    ? 'bg-white border-2 border-studio-sienna/50'
                    : p.hasGuessedCorrectly
                    ? 'bg-emerald-50/80 border-studio-moss/40'
                    : 'bg-white border-[#D5C7B0]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Avatar
                      initials={p.initials}
                      className={cn(
                        'w-10 h-10',
                        p.isDrawing
                          ? 'border-studio-sienna text-studio-sienna'
                          : p.hasGuessedCorrectly
                          ? 'border-studio-moss bg-emerald-100 text-studio-moss'
                          : 'border-[#C5B59E] text-studio-charcoal'
                      )}
                    />
                    {/* Status Badge */}
                    {p.isDrawing && (
                      <span className="absolute -bottom-1 -right-1 bg-studio-sienna text-white rounded-full p-0.5 shadow-sm">
                        <Pencil className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {p.hasGuessedCorrectly && (
                      <span className="absolute -bottom-1 -right-1 bg-studio-moss text-white rounded-full p-0.5 shadow-sm">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-serif font-bold text-studio-ink">
                        {p.username}
                      </span>
                      {p.isHost && (
                        <span className="text-[9px] bg-studio-sienna/15 text-studio-sienna font-extrabold px-1.5 py-0.2 rounded">
                          HOST
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-sans">
                      {p.isDrawing ? (
                        <span className="text-studio-sienna font-medium">Sketching now...</span>
                      ) : p.hasGuessedCorrectly ? (
                        <span className="text-studio-moss font-medium">Guessed it! ☕</span>
                      ) : p.isWarm ? (
                        <span className="text-amber-700 font-medium">Warm guess! 🔥</span>
                      ) : (
                        <span className="text-studio-charcoal/70">Thinking...</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={cn(
                      'font-mono text-sm font-bold',
                      p.isDrawing
                        ? 'text-studio-sienna'
                        : p.hasGuessedCorrectly
                        ? 'text-studio-moss'
                        : 'text-studio-ink'
                    )}
                  >
                    {p.score}
                  </div>
                  <span className="text-[10px] font-hand text-studio-charcoal flex items-center justify-end gap-0.5">
                    {index === 0 && <Trophy className="w-3 h-3 text-amber-500 inline" />}
                    #{index + 1} {index === 0 ? 'Leader' : 'Scribe'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 border-t border-[#C8B8A0] bg-studio-aged">
          <button
            onClick={copyRoomLink}
            className="w-full py-2 bg-studio-paper hover:bg-white border border-[#C5B59E] rounded-xl text-xs font-serif font-bold text-studio-ink transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-studio-sienna" />
            <span>Invite Guest Artists to Table</span>
          </button>
        </div>
      </aside>
    </>
  );
};
