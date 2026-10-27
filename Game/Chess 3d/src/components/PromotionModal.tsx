import React from 'react';

interface PromotionModalProps {
  color: 'w' | 'b';
  onSelectPiece: (piece: 'q' | 'r' | 'b' | 'n') => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ color, onSelectPiece }) => {
  const options = [
    { type: 'q', name: 'Queen', icon: color === 'w' ? '♕' : '♛' },
    { type: 'n', name: 'Knight', icon: color === 'w' ? '♘' : '♞' },
    { type: 'r', name: 'Rook', icon: color === 'w' ? '♖' : '♜' },
    { type: 'b', name: 'Bishop', icon: color === 'w' ? '♗' : '♝' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-[#0b1220] border border-amber-400/80 rounded-2xl p-6 shadow-2xl shadow-black max-w-sm w-full mx-4 text-center">
        <h3 className="font-serif-luxury text-xl font-bold text-slate-100 mb-1">Pawn Promotion</h3>
        <p className="text-xs text-slate-400 mb-5">Select a noble piece to promote your pawn:</p>

        <div className="grid grid-cols-4 gap-3">
          {options.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => onSelectPiece(opt.type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#121a2d] border border-slate-700 hover:border-amber-400 hover:bg-amber-500/20 text-slate-100 hover:text-amber-300 transition-all cursor-pointer group shadow-lg"
            >
              <span className="text-4xl mb-1 group-hover:scale-110 transition-transform">{opt.icon}</span>
              <span className="text-xs font-semibold">{opt.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
