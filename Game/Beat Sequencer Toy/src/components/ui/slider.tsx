import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  accent?: 'amber' | 'emerald' | 'cyan' | 'rose';
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, min, max, step = 1, onChange, accent = 'amber', ...props }, ref) => {
    const accentClass = {
      amber: 'accent-amber-500',
      emerald: 'accent-emerald-500',
      cyan: 'accent-cyan-500',
      rose: 'accent-rose-500',
    }[accent];

    return (
      <input
        type="range"
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          'w-full h-2 bg-[#0C0A09] rounded-lg appearance-none cursor-pointer border border-[#2B2724] focus:outline-none',
          accentClass,
          className
        )}
        {...props}
      />
    );
  }
);
Slider.displayName = 'Slider';
