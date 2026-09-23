import React from 'react';
import { Pin, Pencil, Check } from 'lucide-react';
import { Player } from '@/types/game';
import { WashiTape } from '@/components/react-bits/WashiTape';
import { cn } from '@/lib/utils';

interface ScoreboardStickyProps {
  players: Player[];
  onOpenDrawer: () => void;
}

export const ScoreboardSticky: React.FC<ScoreboardStickyProps> = ({ players, onOpenDrawer }) => {
  return (
    <div className="bg-studio-sticky border border-studio-stickyBorder rounded-2xl p-3 shadow-sticky relative overflow-hidden transform -rotate-0.5 transition-transform hover:rotate-0 select-none">
      {/* Tape piece on top */}
      <WashiTape className="absolute -top-1 left-1/2 -translate-x-1/2 w-20 h-4 rotate-1 opacity-80" />

      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#E7D688] pt-1">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={onOpenDrawer}>
          <Pin className="w-4 h-4 text-studio-sienna" />
          <h3 className="font-serif font-bold text-xs text-[#524419]">Artists in the Den</h3>
        </div>
        <span className="font-hand text-sm font-bold text-[#836C18]">
          {players.length} scribes
        </span>
      </div>

      {/* Scoreboard List items */}
      <div className="space-y-1 text-xs font-serif">
        {players.map((p) => {
          return (
            <div
              key={p.id}
              className={cn(
                'flex items-center justify-between py-1 px-2 rounded-lg transition-colors',
                p.isDrawing
                  ? 'bg-amber-100/70 border border-[#E9D99A]'
                  : p.hasGuessedCorrectly
                  ? 'bg-emerald-100/60 border border-emerald-300/50'
                  : 'text-[#63552C] hover:bg-amber-50/50'
              )}
            >
              <div className="flex items-center gap-1.5 truncate">
                {/* Indicator dot or icon */}
                {p.isDrawing ? (
                  <span className="w-2 h-2 rounded-full bg-studio-sienna shrink-0" />
                ) : p.hasGuessedCorrectly ? (
                  <span className="w-2 h-2 rounded-full bg-studio-moss shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                )}

                <span
                  className={cn(
                    'truncate font-bold',
                    p.hasGuessedCorrectly ? 'text-emerald-950' : 'text-studio-ink'
                  )}
                >
                  {p.username}
                </span>

                {/* Status sublabel */}
                {p.isDrawing ? (
                  <span className="font-hand text-studio-sienna font-bold text-xs flex items-center gap-0.5">
                    <Pencil className="w-2.5 h-2.5 inline" /> Drawing
                  </span>
                ) : p.hasGuessedCorrectly ? (
                  <span className="font-hand text-studio-moss font-bold text-xs flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5 inline" /> Solved! ☕
                  </span>
                ) : p.isWarm ? (
                  <span className="text-[10px] text-amber-700 italic font-sans font-bold">
                    (Warm guess! 🔥)
                  </span>
                ) : null}
              </div>

              {/* Score */}
              <span
                className={cn(
                  'font-mono font-bold text-xs shrink-0 ml-2',
                  p.hasGuessedCorrectly ? 'text-emerald-900' : 'text-studio-wood'
                )}
              >
                {p.score} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
