import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'hazard' | 'bio' | 'crimson' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-mono font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] focus:outline-none uppercase tracking-wider',
          // Variants
          variant === 'default' &&
            'bg-[#13191C] text-slate-100 border border-[#1E272B] hover:border-amber-500/50 hover:bg-[#1A2328]',
          variant === 'hazard' &&
            'bg-amber-500 text-black border border-amber-400 font-bold hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
          variant === 'bio' &&
            'bg-emerald-600 text-white border border-emerald-500 font-bold hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
          variant === 'crimson' &&
            'bg-red-600 text-white border border-red-500 font-bold hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
          variant === 'ghost' &&
            'bg-transparent text-slate-300 hover:bg-white/10 hover:text-white',
          variant === 'outline' &&
            'bg-transparent border border-slate-700 text-slate-300 hover:border-amber-500 hover:text-white',
          // Sizes
          size === 'sm' && 'h-8 px-3 text-xs rounded-sm',
          size === 'md' && 'h-10 px-4 text-sm rounded-sm',
          size === 'lg' && 'h-12 px-6 text-base rounded-sm',
          size === 'icon' && 'h-10 w-10 p-0 rounded-sm',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
