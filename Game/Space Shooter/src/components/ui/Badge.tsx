import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'neon' | 'warning' | 'purple';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors',
        {
          'bg-primary/20 text-primary border border-primary/40': variant === 'default',
          'bg-secondary/20 text-secondary border border-secondary/40': variant === 'secondary',
          'border border-outline-variant text-on-surface-variant': variant === 'outline',
          'bg-error-container/40 text-error border border-error/50': variant === 'destructive',
          'bg-primary-container text-on-primary-container shadow-[0_0_10px_rgba(76,215,246,0.4)]': variant === 'neon',
          'bg-amber-500/20 text-amber-300 border border-amber-500/40': variant === 'warning',
          'bg-tertiary-container/30 text-tertiary-fixed border border-tertiary shadow-[0_0_10px_rgba(199,141,255,0.4)]': variant === 'purple',
        },
        className
      )}
      {...props}
    />
  );
}
