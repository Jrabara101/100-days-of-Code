import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 100
  colorShift?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, colorShift = true, ...props }, ref) => {
    // Dynamic color shifts: Green (> 40%) -> Amber (20-40%) -> Red (< 20%)
    const getGradientClass = (val: number) => {
      if (!colorShift) return 'bg-studio-sienna';
      if (val > 40) return 'from-studio-moss via-amber-500 to-studio-sienna';
      if (val > 20) return 'from-amber-500 to-studio-sienna';
      return 'from-rose-600 to-red-700 animate-pulse';
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-[#241710] shadow-inner',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full transition-all duration-700 bg-gradient-to-r',
            getGradientClass(value)
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
