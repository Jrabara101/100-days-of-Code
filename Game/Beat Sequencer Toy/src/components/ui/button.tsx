import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'emerald' | 'amber' | 'hardware';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'pad';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      default: 'bg-[#221F1D] text-white hover:bg-[#2C2825] border border-[#3A3430] active:scale-95 shadow-sm',
      primary: 'bg-amber-500 text-black font-bold hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-950/40',
      secondary: 'bg-[#181615] text-[#D6D3D1] hover:bg-[#24201E] border border-[#2F2A26]',
      destructive: 'bg-rose-600 text-white font-bold hover:bg-rose-500 active:scale-95 shadow-md shadow-rose-950/40',
      outline: 'border border-[#38322E] bg-transparent hover:bg-[#201D1A] text-[#E7E5E4]',
      ghost: 'hover:bg-[#221F1D] text-[#A8A29E] hover:text-white',
      emerald: 'bg-emerald-600 text-white font-bold hover:bg-emerald-500 active:scale-95 shadow-[0_4px_14px_rgba(16,185,129,0.35)] border border-emerald-400/40',
      amber: 'bg-amber-600 text-white font-bold hover:bg-amber-500 active:scale-95 shadow-[0_4px_14px_rgba(245,158,11,0.35)] border border-amber-400/40',
      hardware: 'bg-gradient-to-b from-[#2B2724] to-[#1E1B19] text-white border border-[#3E3833] shadow-pad hover:brightness-110 active:shadow-pad-pressed active:translate-y-0.5',
    };

    const sizes = {
      default: 'h-10 px-4 py-2 rounded-xl text-xs',
      sm: 'h-8 px-3 rounded-lg text-xs',
      lg: 'h-12 px-6 rounded-xl text-sm tracking-wider uppercase font-bold',
      icon: 'h-10 w-10 rounded-xl flex items-center justify-center',
      pad: 'h-11 md:h-12 rounded-lg font-mono text-[10px] font-bold',
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
