import React from 'react';
import { ConfidenceLevel } from '../../types';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { sounds } from '../../services/audioEffects';

interface ConfidenceSelectorProps {
  currentConfidence: ConfidenceLevel;
  isAnswerSelected: boolean;
  isSubmitted: boolean;
  onSelectConfidence: (level: ConfidenceLevel) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
}

export const ConfidenceSelector: React.FC<ConfidenceSelectorProps> = ({
  currentConfidence,
  isAnswerSelected,
  isSubmitted,
  onSelectConfidence,
  onSubmitAnswer,
  onNextQuestion,
  isLastQuestion
}) => {
  const options: { level: ConfidenceLevel; label: string; icon: string; description: string }[] = [
    {
      level: 'guessing',
      label: 'Guessing',
      icon: '🤔',
      description: 'Auto-enrolls in Spaced Review'
    },
    {
      level: 'fairly_sure',
      label: 'Fairly Sure',
      icon: '👍',
      description: 'Standard retention check'
    },
    {
      level: 'high_confidence',
      label: '100% Confident',
      icon: '🎯',
      description: 'Flags Conceptual Blindspots if wrong'
    }
  ];

  return (
    <div className="mt-6 p-4 rounded-2xl bg-surface-secondary dark:bg-[#11141C] border border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Confidence Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Metacognitive Calibration:
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
            (Press <kbd className="px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 text-slate-300">C</kbd> to cycle)
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {options.map(opt => {
            const isSelected = currentConfidence === opt.level;
            return (
              <button
                key={opt.level}
                type="button"
                disabled={isSubmitted}
                onClick={() => {
                  sounds.playClick();
                  onSelectConfidence(opt.level);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-[#171B26] border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
                }`}
                title={opt.description}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Submit / Next Button */}
      <div className="shrink-0 flex items-center justify-end">
        {!isSubmitted ? (
          <button
            type="button"
            disabled={!isAnswerSelected}
            onClick={onSubmitAnswer}
            className={`px-6 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 shadow-sm ${
              isAnswerSelected
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                : 'bg-black/10 dark:bg-white/10 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Check Answer</span>
            <kbd className="px-1.5 py-0.2 rounded bg-black/20 text-[9px] font-mono">↵</kbd>
          </button>
        ) : (
          <button
            type="button"
            onClick={onNextQuestion}
            className="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20"
          >
            <span>{isLastQuestion ? 'Complete Assessment' : 'Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

