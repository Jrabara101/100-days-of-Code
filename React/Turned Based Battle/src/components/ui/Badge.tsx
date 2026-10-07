import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'solar' | 'crimson' | 'cyan' | 'outline' | 'purple';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-magma-800 text-text-primary border-magma-700',
    solar: 'bg-solar-gold/20 text-solar-gold border-solar-gold/40 shadow-[0_0_8px_rgba(251,191,36,0.2)]',
    crimson: 'bg-crimson-heat/20 text-red-400 border-crimson-heat/40 shadow-[0_0_8px_rgba(220,38,38,0.2)]',
    cyan: 'bg-cooling-cyan/20 text-cooling-cyan border-cooling-cyan/40 shadow-[0_0_8px_rgba(56,189,248,0.2)]',
    purple: 'bg-electric-violet/20 text-purple-300 border-electric-violet/40',
    outline: 'bg-transparent text-text-muted border-magma-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
