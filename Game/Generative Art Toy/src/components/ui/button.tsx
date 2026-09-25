import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'glass' | 'neon' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50 active:scale-95 select-none cursor-pointer",
          // Variants
          variant === 'default' && "bg-white/10 text-white hover:bg-white/20 border border-white/15 backdrop-blur-md shadow-sm",
          variant === 'outline' && "border border-white/20 bg-transparent hover:bg-white/10 text-white",
          variant === 'ghost' && "hover:bg-white/10 text-white/80 hover:text-white",
          variant === 'glass' && "bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/10 backdrop-blur-xl shadow-lg",
          variant === 'neon' && "bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] border border-pink-500/40",
          variant === 'destructive' && "bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30",
          // Sizes
          size === 'default' && "h-8 px-3 py-1.5",
          size === 'sm' && "h-7 px-2.5 text-[11px]",
          size === 'lg' && "h-9 px-4 text-sm",
          size === 'icon' && "h-8 w-8",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
