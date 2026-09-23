import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary' | 'outline' | 'error';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-surface-container-high text-on-surface-variant border-transparent',
    primary: 'bg-primary-container/20 text-primary border-primary-container/40',
    secondary: 'bg-secondary-container/30 text-secondary border-secondary-container/50',
    tertiary: 'bg-tertiary-container/20 text-tertiary border-tertiary-container/40',
    outline: 'border-outline-variant/60 text-on-surface-variant',
    error: 'bg-error-container/30 text-error border-error/40',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono font-medium transition-colors select-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
