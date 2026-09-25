import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'neon';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border backdrop-blur-md transition-all select-none",
        variant === 'default' && "bg-black/30 border-white/15 text-white/80",
        variant === 'success' && "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
        variant === 'warning' && "bg-amber-500/15 border-amber-500/30 text-amber-400",
        variant === 'neon' && "bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.25)]",
        className
      )}
      {...props}
    />
  );
}
