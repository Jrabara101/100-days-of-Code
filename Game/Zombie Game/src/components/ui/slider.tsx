import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  displayValue?: string | number;
}

export function Slider({ label, displayValue, className, ...props }: SliderProps) {
  return (
    <div className="space-y-1.5 w-full">
      {(label || displayValue) && (
        <div className="flex justify-between items-center text-xs font-mono text-slate-300">
          {label && <span className="uppercase tracking-wider">{label}</span>}
          {displayValue !== undefined && <span className="text-amber-400 font-bold">{displayValue}</span>}
        </div>
      )}
      <input
        type="range"
        className={cn(
          'w-full h-2 bg-slate-800 rounded-sm appearance-none cursor-pointer accent-amber-500 border border-slate-700',
          className
        )}
        {...props}
      />
    </div>
  );
}
