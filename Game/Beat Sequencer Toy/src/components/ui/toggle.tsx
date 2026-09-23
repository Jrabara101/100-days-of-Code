import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  variant?: 'mute' | 'solo' | 'pad' | 'stutter';
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed, onPressedChange, variant = 'pad', children, ...props }, ref) => {
    let variantStyles = '';

    if (variant === 'mute') {
      variantStyles = pressed
        ? 'bg-rose-950/80 border-rose-600 text-rose-300'
        : 'bg-[#221F1D] border-[#383330] text-[#78716C] hover:text-white';
    } else if (variant === 'solo') {
      variantStyles = pressed
        ? 'bg-amber-500 border-amber-300 text-black font-extrabold shadow-sm'
        : 'bg-[#221F1D] border-[#383330] text-[#78716C] hover:text-white';
    } else if (variant === 'stutter') {
      variantStyles = pressed
        ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm'
        : 'bg-[#262220] hover:bg-[#332E2B] text-[#D6D3D1] border-[#383330]';
    }

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        onClick={() => onPressedChange(!pressed)}
        className={cn(
          'transition-all duration-150 inline-flex items-center justify-center font-mono select-none',
          variantStyles,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Toggle.displayName = 'Toggle';
