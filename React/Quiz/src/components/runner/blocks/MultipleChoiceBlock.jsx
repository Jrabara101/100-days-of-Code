import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { sound } from '../../../utils/audio';

export default function MultipleChoiceBlock({
  question,
  value,
  onChange,
  onSubmit,
  isQuiz = false,
  showFeedback = false,
  disabled = false
}) {
  const choices = question.properties?.choices || [];
  const keyLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const [bouncingKey, setBouncingKey] = useState(null);

  // Keyboard shortcut listener (A, B, C...)
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      // Don't intercept if user is inside an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toUpperCase();
      const index = keyLetters.indexOf(key);

      if (index !== -1 && index < choices.length) {
        e.preventDefault();
        const choice = choices[index];
        selectChoice(choice);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, disabled, value]);

  const selectChoice = (choice) => {
    if (disabled) return;
    const choiceValue = choice.label;
    setBouncingKey(choiceValue);
    sound.playKeyTap();

    onChange(choiceValue);

    // Auto-advance after 300ms
    setTimeout(() => {
      setBouncingKey(null);
      if (onSubmit) onSubmit(choiceValue);
    }, 320);
  };

  const correctAnswer = question.properties?.correct_answer;

  return (
    <div className="w-full max-w-xl flex flex-col gap-3">
      {choices.map((choice, index) => {
        const keyLetter = keyLetters[index] || String(index + 1);
        const isSelected = value === choice.label;
        const isBouncing = bouncingKey === choice.label;

        // Scored Quiz Feedback Styles
        let statusBorder = 'border-white/10 hover:border-brand/60';
        let statusBg = 'bg-[#121418] hover:bg-[#181A20]';
        let statusRing = '';

        if (showFeedback && value) {
          if (choice.label === correctAnswer) {
            statusBorder = 'border-emerald-500/80';
            statusBg = 'bg-emerald-950/30';
            statusRing = 'ring-1 ring-emerald-500/50';
          } else if (isSelected && choice.label !== correctAnswer) {
            statusBorder = 'border-rose-500/80';
            statusBg = 'bg-rose-950/30';
            statusRing = 'ring-1 ring-rose-500/50';
          }
        } else if (isSelected) {
          statusBorder = 'border-brand';
          statusBg = 'bg-brand/10';
          statusRing = 'ring-1 ring-brand/50';
        }

        return (
          <div
            key={choice.id || index}
            onClick={() => selectChoice(choice)}
            className={`group relative flex items-center justify-between p-4 rounded-xl border ${statusBorder} ${statusBg} ${statusRing} ${isBouncing ? 'scale-[0.98]' : 'scale-100'} transition-all duration-150 cursor-pointer select-none`}
          >
            <div className="flex items-center gap-3.5">
              {/* Keyboard keycap pill */}
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-md font-mono text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-brand text-white border border-brand'
                    : 'bg-white/5 text-slate-300 border border-white/10 group-hover:border-brand/40 group-hover:text-brand-light'
                }`}
              >
                {keyLetter}
              </span>

              {/* Label */}
              <span className={`text-base font-medium transition-colors ${isSelected ? 'text-white font-semibold' : 'text-slate-200'}`}>
                {choice.label}
              </span>
            </div>

            {/* Radio / Check indicator */}
            <div className="flex items-center pl-3">
              {showFeedback && value ? (
                choice.label === correctAnswer ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                ) : isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/20" />
                )
              ) : (
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'border-brand bg-brand text-white' : 'border-white/20 group-hover:border-white/40'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Quiz Explanation callout if feedback enabled */}
      {showFeedback && value && question.properties?.explanation && (
        <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-slate-300 animate-fade-slide-up">
          <span className="font-semibold text-white block mb-1">Explanation:</span>
          {question.properties.explanation}
        </div>
      )}
    </div>
  );
}
