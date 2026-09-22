import React from 'react';
import { cn } from '@/lib/utils';

interface ShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export const ShinyText: React.FC<ShinyTextProps> = ({ children, className }) => {
  return (
    <span
      className={cn(
        'inline-block bg-gradient-to-r from-cyan-400 via-white to-cyan-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer font-bold drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]',
        className
      )}
    >
      {children}
    </span>
  );
};
