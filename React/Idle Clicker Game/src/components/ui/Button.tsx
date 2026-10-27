import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'mint' | 'gold' | 'purple' | 'crimson' | 'cyan' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-canvas disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      default: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-sm',
      mint: 'bg-production-mint/20 hover:bg-production-mint/30 text-emerald-300 border border-production-mint/40 shadow-glow-mint hover:border-production-mint/70',
      gold: 'bg-currency-gold/20 hover:bg-currency-gold/30 text-amber-300 border border-currency-gold/40 shadow-glow-gold hover:border-currency-gold/70',
      purple: 'bg-singularity-purple/20 hover:bg-singularity-purple/30 text-purple-300 border border-singularity-purple/40 shadow-glow-purple hover:border-singularity-purple/70',
      crimson: 'bg-frenzy-crimson/20 hover:bg-frenzy-crimson/30 text-red-300 border border-frenzy-crimson/40 shadow-glow-frenzy hover:border-frenzy-crimson/70',
      cyan: 'bg-energy-cyan/20 hover:bg-energy-cyan/30 text-cyan-300 border border-energy-cyan/40 shadow-glow-cyan hover:border-energy-cyan/70',
      outline: 'bg-transparent border border-slate-700 hover:bg-slate-800/60 text-slate-200',
      ghost: 'bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white',
      glass: 'glass-card hover:bg-surface-hover text-slate-200 border-border-subtle shadow-lg',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-3.5 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
