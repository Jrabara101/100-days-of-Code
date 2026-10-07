import React from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  valueDisplay?: string | number;
}

export function Slider({ className, label, valueDisplay, ...props }: SliderProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {(label || valueDisplay !== undefined) && (
        <div className="flex justify-between text-xs font-mono font-medium text-on-surface">
          {label && <span>{label}</span>}
          {valueDisplay !== undefined && <span className="text-primary font-bold">{valueDisplay}</span>}
        </div>
      )}
      <input
        type="range"
        className={cn(
          'w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-1 focus:ring-primary',
          className
        )}
        {...props}
      />
    </div>
  );
}
