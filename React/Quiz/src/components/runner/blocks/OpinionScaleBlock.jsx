import React, { useEffect, useState } from 'react';
import { sound } from '../../../utils/audio';

export default function OpinionScaleBlock({
  question,
  value,
  onChange,
  onSubmit,
  disabled = false
}) {
  const minVal = question.properties?.min_value ?? 0;
  const maxVal = question.properties?.max_value ?? 10;
  const minLabel = question.properties?.min_label || 'Not likely';
  const maxLabel = question.properties?.max_label || 'Extremely likely';

  const numbers = [];
  for (let i = minVal; i <= maxVal; i++) {
    numbers.push(i);
  }

  const [bouncingNum, setBouncingNum] = useState(null);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const num = parseInt(e.key, 10);
      if (!isNaN(num)) {
        // Special case: if key is 0 and scale is 1-10, '0' can map to 10
        if (num === 0 && minVal === 1 && maxVal >= 10) {
          e.preventDefault();
          selectNumber(10);
        } else if (num >= minVal && num <= maxVal) {
          e.preventDefault();
          selectNumber(num);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [minVal, maxVal, disabled]);

  const selectNumber = (num) => {
    if (disabled) return;
    setBouncingNum(num);
    sound.playKeyTap();
    onChange(num);

    setTimeout(() => {
      setBouncingNum(null);
      if (onSubmit) onSubmit(num);
    }, 320);
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Numbers row */}
      <div className="flex items-center gap-1.5 sm:gap-2 justify-between">
        {numbers.map((num) => {
          const isSelected = value === num;
          const isBouncing = bouncingNum === num;

          return (
            <button
              key={num}
              type="button"
              disabled={disabled}
              onClick={() => selectNumber(num)}
              className={`flex-1 py-3 sm:py-4 px-1 rounded-xl border font-mono text-base sm:text-lg font-bold flex flex-col items-center justify-center transition-all duration-150 select-none ${
                isSelected
                  ? 'border-brand bg-brand text-white shadow-glow-brand ring-2 ring-brand/40 scale-105'
                  : 'border-white/10 bg-[#121418] text-slate-200 hover:border-brand/50 hover:bg-[#181A20] hover:text-white'
              } ${isBouncing ? 'scale-95' : ''}`}
            >
              <span>{num}</span>
            </button>
          );
        })}
      </div>

      {/* Min / Max Labels */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-medium px-1">
        <span>{minVal} — {minLabel}</span>
        <span>{maxVal} — {maxLabel}</span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span className="keycap-badge">0-9</span>
        <span>press number key to select</span>
      </div>
    </div>
  );
}
