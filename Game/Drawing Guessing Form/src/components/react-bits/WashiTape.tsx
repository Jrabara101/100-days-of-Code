import React from 'react';
import { cn } from '@/lib/utils';

interface WashiTapeProps {
  className?: string;
  label?: string;
}

export const WashiTape: React.FC<WashiTapeProps> = ({ className, label }) => {
  return (
    <div
      className={cn(
        'washi-tape px-2 py-0.5 text-[9px] font-hand font-bold text-studio-wood shadow-sm select-none',
        className
      )}
    >
      {label}
    </div>
  );
};
