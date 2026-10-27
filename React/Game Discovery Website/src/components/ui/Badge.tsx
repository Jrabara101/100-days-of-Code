import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'cyan' | 'lime' | 'amber' | 'rose' | 'slate' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-[#192234] text-[#F8FAFC] border-white/10',
    cyan: 'bg-[#06B6D4]/15 text-[#38BDF8] border-[#06B6D4]/30',
    lime: 'bg-[#84CC16]/20 text-[#84CC16] border-[#84CC16]/40 font-bold',
    amber: 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30',
    rose: 'bg-[#F43F5E]/15 text-[#FB7185] border-[#F43F5E]/30',
    slate: 'bg-[#1E293B]/70 text-[#94A3B8] border-white/5',
    outline: 'bg-transparent text-[#94A3B8] border-[#1E293B]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border tracking-wide transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
