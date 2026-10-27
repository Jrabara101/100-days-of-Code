import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { sound } from '../../../utils/audio';

export default function RatingBlock({
  question,
  value,
  onChange,
  onSubmit,
  disabled = false
}) {
  const maxStars = question.properties?.max_value || 5;
  const [hovered, setHovered] = useState(null);
  const [bouncingStar, setBouncingStar] = useState(null);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= maxStars) {
        e.preventDefault();
        selectRating(num);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maxStars, disabled]);

  const selectRating = (star) => {
    if (disabled) return;
    setBouncingStar(star);
    sound.playKeyTap();
    onChange(star);

    setTimeout(() => {
      setBouncingStar(null);
      if (onSubmit) onSubmit(star);
    }, 320);
  };

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    stars.push(i);
  }

  return (
    <div className="w-full max-w-xl">
      <div className="flex items-center gap-3">
        {stars.map((star) => {
          const isFilled = (hovered !== null ? star <= hovered : star <= (value || 0));
          const isBouncing = bouncingStar === star;

          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => selectRating(star)}
              className={`p-3 rounded-2xl border transition-all duration-150 flex flex-col items-center gap-1.5 ${
                isFilled
                  ? 'border-amber-400/50 bg-amber-400/10 text-amber-400 shadow-[0_0_15px_-3px_rgba(251,191,36,0.3)]'
                  : 'border-white/10 bg-[#121418] text-slate-500 hover:border-white/20 hover:text-slate-300'
              } ${isBouncing ? 'scale-90' : 'scale-100 hover:scale-105'}`}
            >
              <Star
                className={`w-8 h-8 transition-all ${
                  isFilled ? 'fill-amber-400 text-amber-400 stroke-[1.5]' : 'stroke-[1.5]'
                }`}
              />
              <span className="font-mono text-xs font-semibold">{star}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <span className="keycap-badge">1 - {maxStars}</span>
        <span>or click to select</span>
      </div>
    </div>
  );
}
