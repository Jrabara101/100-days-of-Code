import React from 'react';
import { OptionItem } from '../../types';
import { sounds } from '../../services/audioEffects';

interface MultipleChoiceQuestionProps {
  options: OptionItem[];
  selectedOptionId?: string;
  isSubmitted: boolean;
  correctAnswer?: string;
  onSelectOption: (optionId: string) => void;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  options,
  selectedOptionId,
  isSubmitted,
  correctAnswer,
  onSelectOption
}) => {
  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const isSelected = selectedOptionId === option.id;
        const letter = String.fromCharCode(65 + index); // A, B, C, D

        let borderClass = 'border-black/10 dark:border-white/10 hover:border-indigo-400 bg-white dark:bg-[#171B26]';
        let badgeClass = 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300';

        if (isSubmitted) {
          const isCorrect = option.id === correctAnswer;
          if (isCorrect) {
            borderClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/30';
            badgeClass = 'bg-emerald-500 text-white font-bold';
          } else if (isSelected && !isCorrect) {
            borderClass = 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-100 ring-2 ring-red-500/30';
            badgeClass = 'bg-red-500 text-white font-bold';
          }
        } else if (isSelected) {
          borderClass = 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20';
          badgeClass = 'bg-indigo-600 text-white font-bold';
        }

        return (
          <div
            key={option.id}
            onClick={() => {
              if (!isSubmitted) {
                sounds.playClick();
                onSelectOption(option.id);
              }
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 shadow-xs ${borderClass}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${badgeClass}`}>
              {letter}
            </div>
            <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {option.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

