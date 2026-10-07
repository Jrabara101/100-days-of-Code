import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  segments?: number;
  color?: 'primary' | 'secondary' | 'error' | 'purple' | 'amber';
}

export function Progress({
  value,
  max = 100,
  segments = 10,
  color = 'primary',
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  const activeColorClass = {
    primary: 'bg-primary shadow-[0_0_8px_#4cd7f6]',
    secondary: 'bg-secondary shadow-[0_0_6px_#4edea3]',
    error: 'bg-error shadow-[0_0_8px_#ffb4ab]',
    purple: 'bg-tertiary-fixed shadow-[0_0_8px_#ddb7ff]',
    amber: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
  }[color];

  return (
    <div
      className={cn('w-full h-2.5 bg-surface-container-high rounded flex gap-0.5 p-0.5 overflow-hidden', className)}
      {...props}
    >
      {Array.from({ length: segments }).map((_, i) => {
        const segmentThreshold = ((i + 1) / segments) * 100;
        const isActive = percentage >= segmentThreshold;
        const isPartial = !isActive && percentage > ((i) / segments) * 100;

        return (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-[1px] transition-all duration-150',
              isActive
                ? activeColorClass
                : isPartial
                ? `${activeColorClass} opacity-50`
                : 'bg-surface-container-highest opacity-40'
            )}
          />
        );
      })}
    </div>
  );
}
