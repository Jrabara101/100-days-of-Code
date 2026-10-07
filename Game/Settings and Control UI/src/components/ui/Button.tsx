import React from 'react';
import { clsx } from 'clsx';
import { soundEngine } from '@/services/audioService';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'ghost' | 'avionics';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  soundFeedback?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', soundFeedback = true, children, onClick, onMouseEnter, ...props }, ref) => {
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (soundFeedback && !props.disabled) {
        soundEngine.playHoverTick();
      }
      onMouseEnter?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (soundFeedback && !props.disabled) {
        soundEngine.playSelectClick();
      }
      onClick?.(e);
    };

    const variantStyles = {
      default: 'bg-[#1C2232] hover:bg-[#283145] text-[#F8FAFC] border border-[#1E2538] hover:border-slate-600',
      primary: 'bg-[#38BDF8] hover:bg-[#0284C7] text-slate-950 font-semibold shadow-glow-cyan border border-[#7DD3FC]',
      secondary: 'bg-[#131722] hover:bg-[#1A202C] text-slate-300 border border-[#1E2538]',
      danger: 'bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 shadow-glow-crimson',
      ghost: 'bg-transparent hover:bg-[#1C2232] text-slate-400 hover:text-slate-100 border border-transparent',
      avionics: 'bg-[#0E1118] hover:bg-[#161B26] text-[#38BDF8] border border-[#38BDF8]/40 hover:border-[#38BDF8] shadow-sm',
    };

    const sizeStyles = {
      sm: 'px-2.5 py-1 text-xs rounded-sm gap-1.5',
      md: 'px-3.5 py-1.5 text-sm rounded gap-2',
      lg: 'px-5 py-2.5 text-base rounded-md gap-2.5',
      icon: 'p-2 rounded-sm',
    };

    return (
      <button
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] active:translate-y-[1px]',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
