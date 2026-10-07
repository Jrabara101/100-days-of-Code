import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'subtle';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default:
        'bg-magma-900/90 backdrop-blur-md border border-ember-orange/30 shadow-[0_4px_24px_rgba(0,0,0,0.6)] rounded-lg',
      glow:
        'bg-magma-900/95 backdrop-blur-lg border border-solar-gold/50 shadow-[0_0_20px_rgba(251,191,36,0.25)] rounded-lg',
      subtle:
        'bg-magma-950/80 backdrop-blur-sm border border-magma-800 rounded-md',
    };

    return (
      <div ref={ref} className={cn(variants[variant], className)} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-4 border-b border-magma-800/80 flex items-center justify-between', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-rajdhani font-bold tracking-wider text-base text-text-primary', className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-4', className)} {...props} />
);
