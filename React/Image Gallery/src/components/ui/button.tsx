import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'secondary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] outline-none';

    const variants = {
      primary:
        'bg-primary-container text-[#09090b] font-semibold hover:bg-primary hover:shadow-[0_0_16px_rgba(56,189,248,0.5)] border border-primary-container/80',
      secondary:
        'bg-surface-container-high/80 text-on-surface hover:bg-surface-container-highest hover:text-white border border-outline-variant/40 hover:border-outline-variant/80',
      ghost:
        'bg-transparent text-outline hover:text-on-surface hover:bg-white/5 border border-transparent',
      destructive:
        'bg-error-container/20 text-error hover:bg-error-container/30 border border-error-container/40',
      outline:
        'bg-surface-container-lowest/60 text-on-surface-variant hover:text-on-surface border border-outline-variant/40 hover:border-primary/50',
    };

    const sizes = {
      sm: 'h-7 px-2.5 text-xs rounded-md gap-1.5',
      md: 'h-9 px-3.5 text-xs rounded-lg gap-2',
      lg: 'h-11 px-5 text-sm rounded-xl gap-2.5',
      icon: 'h-8 w-8 rounded-lg p-0 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
