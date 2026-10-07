import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'cyan';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50 select-none text-xs";
    
    const variants = {
      default: "bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-sm font-semibold",
      cyan: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30",
      destructive: "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30",
      outline: "border border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800 hover:text-white",
      secondary: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700/50",
      ghost: "hover:bg-zinc-800/80 text-zinc-300 hover:text-white",
      link: "text-cyan-400 underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-8 px-3 py-1.5",
      sm: "h-7 px-2.5 text-[11px]",
      lg: "h-9 px-4 text-sm",
      icon: "h-8 w-8",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
