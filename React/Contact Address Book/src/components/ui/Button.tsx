import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-container disabled:pointer-events-none disabled:opacity-50 active:scale-95 select-none';

    const variants = {
      default:
        'bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 shadow-sm',
      primary:
        'bg-primary-container text-on-primary-container hover:bg-primary font-semibold shadow-[0_0_12px_rgba(34,211,238,0.35)]',
      secondary:
        'bg-surface-container-high text-on-surface hover:bg-surface-bright border border-outline-variant/40',
      outline:
        'border border-outline-variant text-on-surface hover:bg-surface-container hover:text-white',
      ghost: 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface',
      destructive:
        'bg-error-container text-on-error-container hover:bg-red-700/80 shadow-sm',
    };

    const sizes = {
      sm: 'h-8 px-2.5 text-xs font-mono',
      md: 'h-9 px-3.5 text-xs font-mono',
      lg: 'h-11 px-5 text-sm font-sans',
      icon: 'h-8 w-8 p-0',
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
