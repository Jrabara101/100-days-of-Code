import React from 'react';
import { PlayingCard } from './PlayingCard';

export const AnimationOverlay = ({ activeAnimation }) => {
  if (!activeAnimation) return null;

  const { type, rank, count, askingPlayer, cards } = activeAnimation;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
      {type === 'HANDOVER' && (
        <div className="flex flex-col items-center gap-3 bg-black/90 p-4 pixel-box border-nes-yellow animate-pulse text-white">
          <span className="text-xs font-black text-nes-yellow uppercase tracking-widest">
            {askingPlayer === 0 ? '⚡ CARDS RECEIVED!' : '⚡ HANDING OVER CARDS!'}
          </span>
          <div className="flex gap-2">
            {cards && cards.length > 0 ? (
              cards.map((c) => (
                <div key={c.id} className="animate-fish-draw">
                  <PlayingCard card={c} size="lg" />
                </div>
              ))
            ) : (
              <div className="text-sm font-bold text-yellow-300">[{count}] x Rank [{rank}]</div>
            )}
          </div>
        </div>
      )}

      {type === 'GO_FISH' && (
        <div className="flex flex-col items-center gap-3 bg-[#064e3b] p-6 pixel-box border-cyan-400 text-white animate-fish-draw">
          <div className="text-2xl font-black text-cyan-300 tracking-wider">🌊 GO FISH! 🌊</div>
          <div className="text-xs font-bold text-gray-200">
            {askingPlayer === 0 ? 'You asked for' : 'AI asked for'} [{rank}]. Drawing from Stock...
          </div>
          <div className="w-16 h-24 bg-gb-dark border-4 border-white flex items-center justify-center text-xl font-bold animate-bounce">
            🎴
          </div>
        </div>
      )}
    </div>
  );
};
