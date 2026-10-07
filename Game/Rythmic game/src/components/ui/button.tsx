import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'fever' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium font-mono uppercase tracking-wider transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-95 focus:outline-none';

    const variants = {
      default: 'bg-surface-mid hover:bg-surface-high text-white border border-white/10 shadow-sm',
      primary: 'bg-primary hover:bg-primary-dim text-black font-bold shadow-neon-cyan border-none',
      secondary: 'bg-secondary hover:bg-secondary-dim text-white font-bold shadow-neon-pink border-none',
      fever: 'bg-gradient-to-r from-accent-fever to-amber-500 hover:brightness-110 text-white font-black shadow-fever animate-fever-pulse',
      outline: 'bg-transparent border border-primary/40 text-primary hover:bg-primary/10 hover:border-primary',
      ghost: 'bg-transparent text-gray-300 hover:text-white hover:bg-white/10',
      glass: 'bg-surface-high/60 backdrop-blur-md border border-white/15 text-white hover:bg-surface-high/90 shadow-md',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded',
      md: 'h-10 px-4 text-sm rounded-md',
      lg: 'h-12 px-6 text-base rounded-lg',
      icon: 'h-10 w-10 p-0 rounded-md',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
