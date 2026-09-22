import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'cyan', children, className }) => {
  const variants = {
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={cn(
        'px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-md border inline-flex items-center gap-1 font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
