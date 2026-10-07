import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'neon' | 'primary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-mono text-xs font-semibold uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
          {
            'bg-primary-container text-on-primary-container hover:bg-primary-container/80 shadow-[0_0_15px_rgba(6,182,212,0.35)]':
              variant === 'default' || variant === 'primary',
            'bg-surface-container-high border border-outline-variant hover:border-primary/60 text-on-surface hover:text-primary':
              variant === 'outline',
            'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 shadow-[0_0_12px_rgba(0,165,114,0.35)]':
              variant === 'secondary',
            'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface':
              variant === 'ghost',
            'bg-error-container text-on-error-container hover:bg-error-container/80 border border-error/50 shadow-[0_0_15px_rgba(147,0,10,0.4)]':
              variant === 'destructive',
            'bg-primary-container/20 border-2 border-primary text-primary hover:bg-primary/20 shadow-[0_0_20px_rgba(76,215,246,0.45)]':
              variant === 'neon',
          },
          {
            'h-9 px-4 py-2 rounded': size === 'default',
            'h-7 px-2.5 rounded text-[11px]': size === 'sm',
            'h-11 px-6 rounded text-sm': size === 'lg',
            'h-9 w-9 rounded p-0': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
