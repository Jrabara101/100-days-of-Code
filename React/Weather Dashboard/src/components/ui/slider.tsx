import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  className,
  disabled = false,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('relative flex w-full touch-none select-none items-center py-2', className)}>
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-800/90 border border-white/10">
        <div
          className="absolute h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.6)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <div
        className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 rounded-full border-2 border-cyan-300 bg-slate-950 shadow-[0_0_14px_rgba(56,189,248,0.9)] transition-transform duration-75 hover:scale-125"
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
};
