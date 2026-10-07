import * as React from 'react';
import { cn } from './button';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'fever' | 'emerald' | 'gold';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-gray-200 border-white/20',
    primary: 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_10px_rgba(0,240,255,0.3)]',
    secondary: 'bg-secondary/20 text-secondary border-secondary/40 shadow-[0_0_10px_rgba(255,0,127,0.3)]',
    outline: 'border border-white/30 text-gray-300',
    fever: 'bg-accent-fever/25 text-pink-300 border-accent-fever/50 animate-pulse',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    gold: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(255,209,102,0.3)]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono tracking-wider transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
