import React from 'react';
import { GitFork, ArrowRight } from 'lucide-react';
import { BranchChoice } from '../types';
import { sound } from '../utils/soundEngine';

interface BranchChoiceOverlayProps {
  choices: BranchChoice[];
  isDark?: boolean;
  onSelectChoice: (targetPanelId: string) => void;
}

export const BranchChoiceOverlay: React.FC<BranchChoiceOverlayProps> = ({
  choices,
  isDark = false,
  onSelectChoice,
}) => {
  if (!choices || choices.length === 0) return null;

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 max-w-[90%] w-auto animate-bounce-gentle">
      <div
        className={`px-3 py-1 rounded-full text-[11px] font-fredoka font-bold flex items-center gap-1.5 shadow-md ${
          isDark
            ? 'bg-amber-500 text-stone-950'
            : 'bg-berry-red text-white shadow-clay-sm'
        }`}
      >
        <GitFork className="w-3 h-3" />
        <span>CHOOSE YOUR STORY PATH:</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => {
              sound.playChime();
              onSelectChoice(choice.targetPanelId);
            }}
            className={`px-4 py-2 rounded-2xl font-fredoka text-xs sm:text-sm font-bold flex items-center gap-2 shadow-clay-btn transition-all clay-puffy border ${
              isDark
                ? 'bg-[#1e2330] hover:bg-[#272f42] text-amber-400 border-amber-500/40 shadow-brutal-hard'
                : 'bg-white hover:bg-rose-50 text-stone-800 border-rose-200'
            }`}
          >
            <span className="text-xl">{choice.labelEmoji}</span>
            <span>{choice.label}</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
};
