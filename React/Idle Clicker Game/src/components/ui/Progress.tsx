import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  indicatorColor?: 'mint' | 'gold' | 'purple' | 'crimson' | 'cyan';
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  indicatorColor = 'mint',
  className,
  ...props
}) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    mint: 'bg-production-mint shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    gold: 'bg-currency-gold shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    purple: 'bg-singularity-purple shadow-[0_0_12px_rgba(168,85,247,0.5)]',
    crimson: 'bg-frenzy-crimson shadow-[0_0_12px_rgba(239,68,68,0.6)]',
    cyan: 'bg-energy-cyan shadow-[0_0_12px_rgba(6,182,212,0.5)]',
  };

  return (
    <div
      className={cn('relative w-full h-1.5 overflow-hidden rounded-full bg-slate-900/90 border border-slate-800/80', className)}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-300 ease-out rounded-full', colors[indicatorColor])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};
