import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-studio-sienna text-white shadow hover:bg-studio-sienna/80',
        secondary:
          'border border-[#D5C7B0] bg-studio-paper text-studio-charcoal',
        warm:
          'border border-amber-300/80 bg-amber-100 text-amber-900 font-hand text-xs',
        success:
          'border border-emerald-300/60 bg-emerald-100 text-emerald-900 font-serif',
        studio:
          'border border-[#6B4D3B] bg-[#442F24] text-amber-200',
        outline: 'text-studio-charcoal border border-[#D5C7B0]',
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
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
