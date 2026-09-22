import React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  label: string;
  valueDisplay: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  accent?: 'cyan' | 'rose' | 'emerald' | 'amber';
  description?: string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  valueDisplay,
  min,
  max,
  step = 0.1,
  value,
  onChange,
  accent = 'cyan',
  description,
  className,
}) => {
  const accentClasses = {
    cyan: 'accent-cyan-400 text-cyan-400',
    rose: 'accent-rose-500 text-rose-400',
    emerald: 'accent-emerald-400 text-emerald-400',
    amber: 'accent-amber-400 text-amber-400',
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className={cn('font-bold tracking-wider', accentClasses[accent].split(' ')[1])}>
          {valueDisplay}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn('w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer', accentClasses[accent].split(' ')[0])}
      />
      {description && <p className="text-[11px] text-slate-400 font-sans">{description}</p>}
    </div>
  );
};
