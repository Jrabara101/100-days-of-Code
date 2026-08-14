import React from 'react';
import { X, HelpCircle } from 'lucide-react';

export const AskModal = ({ isOpen, availableRanks, selectedRank, onSelectRank, onSubmit, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-pixel select-none">
      <div className="bg-[#111827] border-4 border-nes-yellow w-full max-w-md p-5 pixel-box text-white flex flex-col shadow-[8px_8px_0px_0px_#000]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b-4 border-nes-yellow pb-3 mb-4">
          <div className="flex items-center gap-2 text-nes-yellow">
            <HelpCircle className="w-5 h-5 animate-pulse" />
            <h2 className="text-sm font-black uppercase tracking-wider">ASK AI OPPONENT FOR A RANK</h2>
          </div>
          <button onClick={onClose} className="pixel-btn bg-red-600 px-2 py-1 text-xs text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-300 mb-4 leading-relaxed">
          Select a rank from your current hand. Go Fish rules dictate you can only inquire about ranks you currently possess.
        </p>

        {/* Rank Selection Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {availableRanks.map((rank) => {
            const isSel = selectedRank === rank;
            return (
              <button
                key={rank}
                onClick={() => onSelectRank(rank)}
                className={`h-14 pixel-btn font-black text-lg flex flex-col items-center justify-center border-2 ${
                  isSel
                    ? 'bg-nes-yellow text-black border-white translate-x-0.5 translate-y-0.5 shadow-none'
                    : 'bg-emerald-900 text-white border-emerald-400 hover:bg-emerald-800'
                }`}
              >
                <span>{rank}</span>
                <span className="text-[9px] font-normal opacity-75">RANK</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t-2 border-gray-800">
          <button
            onClick={onClose}
            className="pixel-btn bg-gray-700 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            disabled={!selectedRank}
            onClick={onSubmit}
            className="pixel-btn bg-nes-yellow text-black px-6 py-2 text-xs font-black uppercase disabled:opacity-40 hover:bg-yellow-400"
          >
            Ask for [{selectedRank || 'SELECT'}]
          </button>
        </div>

      </div>
    </div>
  );
};
