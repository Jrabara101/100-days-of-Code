import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'cyan';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-mono font-medium transition-colors border";
  const variants = {
    default: "border-transparent bg-cyan-500 text-zinc-950 font-semibold",
    secondary: "border-zinc-700 bg-zinc-800/80 text-zinc-300",
    destructive: "border-red-500/30 bg-red-500/10 text-red-400",
    outline: "text-zinc-300 border-zinc-700 bg-transparent",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  };

  return <div className={cn(base, variants[variant], className)} {...props} />;
}
