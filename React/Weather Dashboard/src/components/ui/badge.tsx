import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'glow' | 'accent' | 'warning' | 'emerald';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    secondary: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
    outline: 'border-white/20 text-slate-200 bg-transparent',
    glow: 'bg-blue-500/20 text-blue-300 border-blue-400/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]',
    accent: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
