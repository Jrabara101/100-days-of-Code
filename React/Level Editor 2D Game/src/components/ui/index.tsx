import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'outline' | 'emerald' | 'cyan' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus:outline-none disabled:opacity-40 disabled:pointer-events-none rounded-lg active:scale-95';

    const variants = {
      default: 'bg-[#192030] hover:bg-[#222B3D] text-[#F8FAFC] border border-[#222B3D]',
      primary:
        'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-glowCyan',
      ghost: 'bg-transparent hover:bg-[#192030] text-[#94A3B8] hover:text-[#F8FAFC]',
      outline: 'bg-transparent border border-[#222B3D] hover:bg-[#192030] text-[#F8FAFC]',
      emerald:
        'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-glowEmerald',
      cyan: 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/25',
      danger:
        'bg-rose-500/15 border border-rose-500/40 text-rose-400 hover:bg-rose-500/25',
    };

    const sizes = {
      sm: 'h-8 px-2.5 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-sm gap-2',
      lg: 'h-10 px-4 text-base gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Badge
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'emerald' | 'amber' | 'crimson' | 'violet' | 'muted';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'muted',
  children,
  ...props
}) => {
  const variants = {
    cyan: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    crimson: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    violet: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
    muted: 'bg-[#192030] border-[#222B3D] text-[#94A3B8]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
