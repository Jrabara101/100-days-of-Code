import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'biome';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 select-none';

    const variants = {
      default: 'bg-surface-high text-on-surface hover:bg-surface-highest text-slate-200 border border-slate-700/60 shadow-sm',
      primary:
        'bg-primary hover:bg-primary-hover text-slate-950 font-bold shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]',
      secondary: 'bg-surface-container hover:bg-surface-high text-slate-300 border border-slate-800',
      outline: 'border border-slate-700 bg-transparent hover:bg-surface-high text-slate-200',
      ghost: 'hover:bg-surface-high/60 text-slate-300 hover:text-white',
      destructive: 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30',
      biome: 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30',
    };

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-11 px-6 text-base font-semibold',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
