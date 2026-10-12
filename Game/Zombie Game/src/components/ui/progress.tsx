import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorColor?: string;
}

export function Progress({ value, indicatorColor = 'bg-amber-500', className, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn('relative h-2.5 w-full overflow-hidden rounded-sm bg-slate-900 border border-[#1E272B]', className)}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-150', indicatorColor)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
