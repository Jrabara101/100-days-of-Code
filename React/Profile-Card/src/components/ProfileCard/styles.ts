import { cva } from 'class-variance-authority';

export const cardStyles = cva("rounded-xl p-6 transition-all", {
  variants: {
    intent: {
      minimal: "bg-white border border-gray-100 shadow-sm",
      glass: "bg-white/30 backdrop-blur-md border border-white/20",
      dark: "bg-slate-900 text-white shadow-2xl",
    },
    size: {
      sm: "max-w-xs",
      lg: "max-w-md",
    }
  },
  defaultVariants: {
    intent: "minimal",
    size: "sm"
  }
});
