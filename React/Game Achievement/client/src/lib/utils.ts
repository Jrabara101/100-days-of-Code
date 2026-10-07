import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BadgeTier } from "../types/achievement";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  return points.toLocaleString();
}

export function getTierColor(tier: BadgeTier): string {
  switch (tier) {
    case 'bronze':
      return '#D97706';
    case 'silver':
      return '#94A3B8';
    case 'gold':
      return '#F59E0B';
    case 'prismatic':
      return '#A855F7';
    default:
      return '#64748B';
  }
}

export function getTierBadgeClass(tier: BadgeTier): string {
  switch (tier) {
    case 'bronze':
      return 'bg-amber-950/40 text-amber-400 border border-amber-800/60';
    case 'silver':
      return 'bg-slate-800/60 text-slate-300 border border-slate-700';
    case 'gold':
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    case 'prismatic':
      return 'bg-purple-950/40 text-purple-300 border border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse-glow';
    default:
      return 'bg-slate-900 text-slate-400 border border-slate-800';
  }
}
