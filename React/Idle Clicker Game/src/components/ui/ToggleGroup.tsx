import React from 'react';
import { cn } from '../../lib/utils';

export interface ToggleGroupProps<T extends string | number> {
  value: T;
  onValueChange: (val: T) => void;
  options: { label: string; value: T; badge?: string }[];
  className?: string;
  size?: 'sm' | 'md';
}

export function ToggleGroup<T extends string | number>({
  value,
  onValueChange,
  options,
  className,
  size = 'sm',
}: ToggleGroupProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-lg bg-slate-900/90 border border-slate-800 shadow-inner',
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onValueChange(opt.value)}
            className={cn(
              'relative font-mono font-bold transition-all duration-150 rounded-md select-none',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
              isSelected
                ? 'bg-production-mint text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)] font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            )}
          >
            {opt.label}
            {opt.badge && (
              <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
