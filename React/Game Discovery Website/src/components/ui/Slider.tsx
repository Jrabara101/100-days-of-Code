import React from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  label?: string;
  displayValue?: string | number;
  className?: string;
  accentColor?: string;
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  displayValue,
  className,
  accentColor = 'from-[#06B6D4] to-[#3B82F6]',
}: SliderProps) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {(label || displayValue !== undefined) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-[#94A3B8] font-medium">{label}</span>}
          {displayValue !== undefined && (
            <span className="font-mono font-bold text-[#38BDF8]">{displayValue}</span>
          )}
        </div>
      )}

      <div className="relative flex items-center h-5 cursor-pointer">
        {/* Track Background */}
        <div className="w-full h-2 rounded-full bg-[#1E293B] overflow-hidden relative border border-white/5">
          {/* Active Gradient Fill */}
          <div
            className={cn('h-full bg-gradient-to-r transition-all duration-75', accentColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Input element */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {/* Custom Visual Thumb */}
        <div
          className="absolute w-4 h-4 rounded-full bg-white shadow-md border-2 border-[#06B6D4] pointer-events-none transform -translate-x-1/2 transition-all duration-75"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
