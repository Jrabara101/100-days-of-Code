import React from 'react';
import { cn } from '@/lib/utils';

interface TimeVignetteProps {
  timeLeft: number;
  active: boolean;
  className?: string;
}

export const TimeVignette: React.FC<TimeVignetteProps> = ({ timeLeft, active, className }) => {
  if (!active || timeLeft > 15) return null;

  const isCritical = timeLeft <= 5;
  const isUrgent = timeLeft <= 10;

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none z-20 transition-opacity duration-500 rounded-xl',
        isCritical
          ? 'ring-4 ring-rose-600/70 shadow-[inset_0_0_60px_rgba(225,29,72,0.6)] animate-pulse'
          : isUrgent
          ? 'ring-2 ring-amber-600/60 shadow-[inset_0_0_40px_rgba(217,130,43,0.4)] animate-pulse'
          : 'ring-1 ring-amber-500/40 shadow-[inset_0_0_25px_rgba(217,130,43,0.25)]',
        className
      )}
    />
  );
};
