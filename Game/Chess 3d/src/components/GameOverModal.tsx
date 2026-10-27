import React from 'react';
import { Trophy, RotateCcw, Home, Swords } from 'lucide-react';

interface GameOverModalProps {
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
  whiteName: string;
  blackName: string;
  onRematch: () => void;
  onExitToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  reason,
  whiteName,
  blackName,
  onRematch,
  onExitToMenu,
}) => {
  const winnerTitle =
    winner === 'w'
      ? `${whiteName} (White) Triumphs!`
      : winner === 'b'
      ? `${blackName} (Black) Triumphs!`
      : 'Stalemate / Draw!';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none">
      <div className="bg-[#0b1220] border border-amber-400/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30 text-slate-950">
          <Trophy className="w-9 h-9" />
        </div>

        <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-slate-100 mb-1">
          {winnerTitle}
        </h2>
        <p className="text-xs font-mono-code text-amber-300 uppercase tracking-wider mb-6">
          {reason}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-2xl bg-[#121929] border border-slate-800 text-xs">
          <div className="p-2 rounded-xl bg-[#090d17]">
            <div className="text-slate-400 text-[10px] uppercase font-mono-code">White</div>
            <div className="font-bold text-slate-100 truncate">{whiteName}</div>
          </div>
          <div className="p-2 rounded-xl bg-[#090d17]">
            <div className="text-slate-400 text-[10px] uppercase font-mono-code">Black</div>
            <div className="font-bold text-slate-100 truncate">{blackName}</div>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onRematch}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Rematch</span>
          </button>

          <button
            type="button"
            onClick={onExitToMenu}
            className="w-full py-3 rounded-xl bg-[#131b2e] hover:bg-[#1a253f] border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
