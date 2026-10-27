import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { sound } from '../../../utils/audio';

export default function PictureChoiceBlock({
  question,
  value,
  onChange,
  onSubmit,
  disabled = false
}) {
  const choices = question.properties?.choices || [];
  const keyLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const [bouncingKey, setBouncingKey] = useState(null);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const key = e.key.toUpperCase();
      const index = keyLetters.indexOf(key);

      if (index !== -1 && index < choices.length) {
        e.preventDefault();
        selectChoice(choices[index]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, disabled]);

  const selectChoice = (choice) => {
    if (disabled) return;
    setBouncingKey(choice.label);
    sound.playKeyTap();
    onChange(choice.label);

    setTimeout(() => {
      setBouncingKey(null);
      if (onSubmit) onSubmit(choice.label);
    }, 320);
  };

  return (
    <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
      {choices.map((choice, index) => {
        const keyLetter = keyLetters[index] || String(index + 1);
        const isSelected = value === choice.label;
        const isBouncing = bouncingKey === choice.label;

        return (
          <div
            key={choice.id || index}
            onClick={() => selectChoice(choice)}
            className={`group relative flex flex-col rounded-xl overflow-hidden border cursor-pointer select-none transition-all duration-200 ${
              isSelected
                ? 'border-brand bg-brand/10 ring-2 ring-brand/50 shadow-glow-brand scale-[0.99]'
                : 'border-white/10 bg-[#121418] hover:border-brand/50 hover:bg-[#181A20]'
            } ${isBouncing ? 'scale-95' : ''}`}
          >
            {/* Image Preview */}
            <div className="w-full h-36 bg-black/40 overflow-hidden relative">
              {choice.image_url ? (
                <img
                  src={choice.image_url}
                  alt={choice.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                  No preview image
                </div>
              )}
              {/* Overlay key badge */}
              <div className="absolute top-2.5 left-2.5">
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded font-mono text-xs font-bold backdrop-blur-md shadow-md ${
                    isSelected ? 'bg-brand text-white' : 'bg-black/60 text-white border border-white/20'
                  }`}
                >
                  {keyLetter}
                </span>
              </div>
            </div>

            {/* Label and checkmark */}
            <div className="p-3.5 flex items-center justify-between">
              <span className={`text-sm font-medium ${isSelected ? 'text-white font-semibold' : 'text-slate-200'}`}>
                {choice.label}
              </span>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'border-brand bg-brand text-white' : 'border-white/20'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
