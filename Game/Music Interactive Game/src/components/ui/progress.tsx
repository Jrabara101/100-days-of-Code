import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  indicatorClassName?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className, indicatorClassName }) => {
  const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));

  return (
    <div
      className={cn(
        'w-full h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/80 relative',
        className
      )}
    >
      <div
        className={cn(
          'h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 transition-all duration-100 shadow-[0_0_12px_rgba(6,182,212,0.8)]',
          indicatorClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
