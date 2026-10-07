import React from 'react';
import { cn } from '../../lib/utils';
import { sound } from '../../lib/audio';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'solar' | 'magma';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', onClick, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-chakra font-semibold tracking-wider transition-all select-none focus:outline-none focus:ring-2 focus:ring-ember-orange/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    const variants = {
      default:
        'bg-gradient-to-r from-ember-core to-ember-orange text-white hover:brightness-110 shadow-[0_0_15px_rgba(249,115,22,0.4)] border border-solar-gold/40',
      solar:
        'bg-gradient-to-r from-solar-gold to-ember-orange text-magma-950 font-bold hover:brightness-115 shadow-[0_0_20px_rgba(251,191,36,0.6)] border border-solar-gold',
      magma:
        'bg-magma-850 hover:bg-magma-800 text-text-primary border border-ember-orange/30 hover:border-solar-gold shadow-md',
      outline:
        'border border-ember-orange/40 bg-transparent text-solar-gold hover:bg-ember-orange/10 hover:border-solar-gold',
      secondary:
        'bg-magma-800 text-text-muted hover:text-text-primary hover:bg-magma-700 border border-magma-700',
      ghost:
        'bg-transparent hover:bg-magma-800 text-text-muted hover:text-solar-gold',
      destructive:
        'bg-gradient-to-r from-crimson-heat to-red-700 text-white hover:brightness-110 shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-crimson-heat',
    };

    const sizes = {
      sm: 'h-8 px-2.5 text-xs rounded',
      md: 'h-10 px-4 text-sm rounded-md',
      lg: 'h-12 px-6 text-base rounded-md',
      icon: 'h-9 w-9 rounded-md',
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      sound.playClick();
      if (onClick) onClick(e);
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
