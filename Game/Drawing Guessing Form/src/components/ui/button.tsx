import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-studio-sienna text-white shadow-sm hover:bg-studio-siennaLight focus-visible:ring-studio-sienna',
        secondary:
          'bg-studio-paper text-studio-charcoal border border-[#D5C7B0] hover:bg-white hover:text-studio-ink',
        outline:
          'border border-[#D5C7B0] bg-transparent hover:bg-studio-paper hover:text-studio-ink text-studio-charcoal',
        ghost:
          'hover:bg-studio-paper text-studio-charcoal hover:text-studio-ink',
        studio:
          'bg-[#442F24] hover:bg-[#573D2F] border border-[#6B4D3B] text-amber-200 shadow-sm',
        success:
          'bg-studio-moss hover:bg-studio-mossLight text-white shadow-sm',
      },
      size: {
        default: 'h-9 px-3.5 py-2',
        sm: 'h-7 rounded-lg px-2 text-[11px]',
        lg: 'h-11 rounded-2xl px-6 text-sm',
        icon: 'h-8 w-8 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
