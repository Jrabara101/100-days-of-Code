import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'outline' | 'neon' | 'mono';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'default',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono-data tracking-wider uppercase transition-colors';

  const variants = {
    default: 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30',
    primary: 'bg-primary/15 text-primary border border-primary/30 font-semibold',
    outline: 'bg-transparent text-outline border border-outline-variant/40',
    neon: 'bg-primary-container text-[#09090b] font-bold shadow-[0_0_10px_rgba(56,189,248,0.4)]',
    mono: 'bg-surface-container-lowest/80 text-on-surface backdrop-blur-md border border-white/10',
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
