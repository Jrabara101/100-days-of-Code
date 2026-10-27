import React from 'react';
import { X, BookOpen, Compass, ChevronRight, Check } from 'lucide-react';

interface RulesAndPieceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesAndPieceGuideModal: React.FC<RulesAndPieceGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const pieces = [
    {
      name: 'Pawn',
      symbol: '♙',
      value: '1 Point',
      movement: 'Forward 1 square (or 2 squares on first move). Captures 1 square diagonally.',
      special: 'Supports En Passant and Promotes to Queen, Rook, Bishop, or Knight upon reaching the 8th rank.',
      tactics: 'The foot soldiers of the board. Connect pawns into chains to control space.',
    },
    {
      name: 'Knight',
      symbol: '♘',
      value: '3 Points',
      movement: 'Moves in an "L" pattern: 2 squares in one direction, then 1 square perpendicular.',
      special: 'The only piece that can jump over other pieces.',
      tactics: 'Thrives in closed, crowded positions and central outposts where it controls up to 8 squares.',
    },
    {
      name: 'Bishop',
      symbol: '♗',
      value: '3 Points',
      movement: 'Any number of squares diagonally along squares of its own starting color.',
      special: 'A player begins with one light-squared bishop and one dark-squared bishop.',
      tactics: 'Dominates open diagonals and creates long-range tactical pins.',
    },
    {
      name: 'Rook',
      symbol: '♖',
      value: '5 Points',
      movement: 'Any number of squares horizontally or vertically along ranks and files.',
      special: 'Can perform Castling with the King if neither piece has moved yet.',
      tactics: 'Dominates open and semi-open files; devastating on the 7th rank in endgames.',
    },
    {
      name: 'Queen',
      symbol: '♕',
      value: '9 Points',
      movement: 'Any number of squares along ranks, files, or diagonals.',
      special: 'Combines the movement powers of the Rook and Bishop.',
      tactics: 'The most powerful attacking piece on the board. Avoid exposing her prematurely.',
    },
    {
      name: 'King',
      symbol: '♔',
      value: 'Invaluable (Game)',
      movement: 'Exactly 1 square in any direction.',
      special: 'Can Castle (O-O or O-O-O) with an unmoved Rook. Cannot move into Check.',
      tactics: 'Must be protected early; becomes an active attacking powerhouse in the endgame.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none">
      <div className="bg-[#0b1220] border border-amber-400/80 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl shadow-black overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0f1728]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-slate-100">
                How to Move Pieces in 3D
              </h2>
              <p className="text-xs text-slate-400 font-mono-code">
                Interactive Controls & FIDE Rules Guide
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick 3D Interaction Steps */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-400/30">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-1.5">
              <Compass className="w-4 h-4" /> Making Moves in this 3D Board
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-[#080d17] border border-slate-800">
                <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-amber-400/20 text-center leading-4 text-[10px]">1</span>
                  Click Piece
                </div>
                <p className="text-[11px] text-slate-400">
                  Click any piece of your color. It will illuminate with a glowing selection ring.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#080d17] border border-slate-800">
                <div className="font-bold text-sky-400 mb-1 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-sky-400/20 text-center leading-4 text-[10px]">2</span>
                  Inspect Legal Dots
                </div>
                <p className="text-[11px] text-slate-400">
                  Glowing blue circles indicate legal empty squares; red rings indicate captures!
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#080d17] border border-slate-800">
                <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-400/20 text-center leading-4 text-[10px]">3</span>
                  Click Target Square
                </div>
                <p className="text-[11px] text-slate-400">
                  Click any highlighted square to glide your piece smoothly into position!
                </p>
              </div>
            </div>
          </div>

          {/* All 6 Chess Pieces Breakdown */}
          <div>
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-400 mb-3">
              Chess Pieces & Movements
            </h3>

            <div className="space-y-3">
              {pieces.map((p) => (
                <div
                  key={p.name}
                  className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800/90 hover:border-slate-700 transition-colors flex items-start gap-3.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-3xl text-amber-300 shrink-0 shadow-md">
                    {p.symbol}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        {p.name}
                        <span className="text-[10px] font-mono-code text-amber-400/90 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                          {p.value}
                        </span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mb-1">
                      <strong className="text-slate-400 font-medium">Movement: </strong>
                      {p.movement}
                    </p>

                    <p className="text-[11px] text-slate-400 mb-1">
                      <strong className="text-slate-400 font-medium">Special: </strong>
                      {p.special}
                    </p>

                    <p className="text-[11px] text-amber-300/80 italic">
                      💡 {p.tactics}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0f1728] text-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide transition-colors cursor-pointer shadow-md"
          >
            Got it, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
