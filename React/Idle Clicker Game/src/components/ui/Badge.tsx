import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'mint' | 'gold' | 'purple' | 'crimson' | 'cyan' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-slate-800 text-slate-200 border-slate-700',
    mint: 'bg-production-mint/15 text-emerald-300 border-production-mint/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]',
    gold: 'bg-currency-gold/15 text-amber-300 border-currency-gold/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
    purple: 'bg-singularity-purple/15 text-purple-300 border-singularity-purple/40 shadow-[0_0_8px_rgba(168,85,247,0.25)]',
    crimson: 'bg-frenzy-crimson/15 text-red-300 border-frenzy-crimson/40 shadow-[0_0_8px_rgba(239,68,68,0.25)]',
    cyan: 'bg-energy-cyan/15 text-cyan-300 border-energy-cyan/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]',
    outline: 'bg-transparent text-slate-400 border-slate-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
