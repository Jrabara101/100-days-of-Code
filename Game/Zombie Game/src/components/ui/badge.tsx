import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hazard' | 'bio' | 'crimson' | 'cyan' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-mono font-semibold transition-colors uppercase tracking-wider',
        variant === 'default' && 'bg-slate-800 text-slate-200 border border-slate-700',
        variant === 'hazard' && 'bg-amber-500/20 text-amber-400 border border-amber-500/50',
        variant === 'bio' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50',
        variant === 'crimson' && 'bg-red-500/20 text-red-400 border border-red-500/50',
        variant === 'cyan' && 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50',
        variant === 'outline' && 'text-slate-300 border border-slate-600',
        className
      )}
      {...props}
    />
  );
}
