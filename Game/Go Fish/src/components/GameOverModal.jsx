import React from 'react';
import { Trophy, RotateCcw, Frown } from 'lucide-react';

export const GameOverModal = ({ isOpen, playerBooks, aiBooks, onRestart }) => {
  if (!isOpen) return null;

  const isPlayerWinner = playerBooks.length > aiBooks.length;
  const isTie = playerBooks.length === aiBooks.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 font-pixel select-none">
      <div className={`border-4 w-full max-w-md p-6 pixel-box text-white flex flex-col items-center text-center shadow-[10px_10px_0px_0px_#000] ${
        isPlayerWinner ? 'bg-[#064e3b] border-nes-yellow' : 'bg-[#450a0a] border-nes-red'
      }`}>
        
        {/* Icon Header */}
        <div className="mb-4">
          {isPlayerWinner ? (
            <div className="w-16 h-16 bg-nes-yellow text-black border-4 border-black flex items-center justify-center animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-nes-red text-white border-4 border-black flex items-center justify-center animate-pulse">
              <Frown className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-black mb-1 uppercase tracking-wider ${
          isPlayerWinner ? 'text-nes-yellow' : isTie ? 'text-cyan-300' : 'text-rose-400'
        }`}>
          {isPlayerWinner ? 'VICTORY Achieved!' : isTie ? 'STALEMATE DRAW!' : 'DEFEATED BY AI!'}
        </h2>

        <p className="text-xs text-gray-300 mb-6">
          {isPlayerWinner 
            ? 'You outsmarted the Statistical Inference Engine!' 
            : 'The AI Memory Matrix deduced your cards.'}
        </p>

        {/* Score Board Comparison */}
        <div className="w-full grid grid-cols-2 gap-4 bg-black/60 p-4 border-2 border-white mb-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold">Your Score</span>
            <span className="text-3xl font-black text-emerald-400">{playerBooks.length}</span>
            <span className="text-[9px] text-gray-400">Books Completed</span>
          </div>

          <div className="flex flex-col items-center border-l-2 border-gray-700">
            <span className="text-[10px] text-gray-400 uppercase font-bold">AI Score</span>
            <span className="text-3xl font-black text-rose-400">{aiBooks.length}</span>
            <span className="text-[9px] text-gray-400">Books Completed</span>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="pixel-btn bg-nes-yellow text-black px-8 py-3 text-sm font-black uppercase flex items-center gap-2 hover:bg-yellow-400"
        >
          <RotateCcw className="w-4 h-4" />
          Play New Game
        </button>

      </div>
    </div>
  );
};
