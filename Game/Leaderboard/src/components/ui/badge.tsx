import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground border-border',
        master:
          'border-purple-500/40 bg-purple-500/15 text-purple-400 font-bold tracking-wide shadow-purple-500/10 shadow-sm',
        diamond:
          'border-cyan-500/40 bg-cyan-500/15 text-cyan-400 font-bold tracking-wide shadow-cyan-500/10 shadow-sm',
        gold:
          'border-amber-500/40 bg-amber-500/15 text-amber-400 font-bold tracking-wide shadow-amber-500/10 shadow-sm',
        silver:
          'border-slate-400/40 bg-slate-400/15 text-slate-300 font-bold tracking-wide shadow-slate-400/10 shadow-sm',
        bronze:
          'border-orange-700/40 bg-orange-700/15 text-orange-400 font-bold tracking-wide shadow-orange-700/10 shadow-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
