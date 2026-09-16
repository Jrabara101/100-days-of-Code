import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return new Intl.NumberFormat('en-US').format(score);
}

export function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/10 shadow-lg';
  if (rank === 2) return 'bg-slate-300/20 text-slate-200 border-slate-300/40 shadow-slate-400/10 shadow-lg';
  if (rank === 3) return 'bg-amber-700/20 text-amber-500 border-amber-700/40 shadow-amber-700/10 shadow-lg';
  if (rank <= 10) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (rank <= 100) return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
  return 'bg-slate-800 text-slate-400 border-slate-700';
}

export function getTierTheme(tier: string) {
  const normalized = tier.toLowerCase();
  switch (normalized) {
    case 'master':
      return {
        label: 'Master',
        badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        border: 'border-purple-500/40',
        glow: 'from-purple-500/20 via-fuchsia-500/10 to-transparent',
        accent: '#a855f7',
      };
    case 'diamond':
      return {
        label: 'Diamond',
        badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        border: 'border-cyan-500/40',
        glow: 'from-cyan-500/20 via-blue-500/10 to-transparent',
        accent: '#06b6d4',
      };
    case 'gold':
      return {
        label: 'Gold',
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        border: 'border-amber-500/40',
        glow: 'from-amber-500/20 via-yellow-500/10 to-transparent',
        accent: '#f59e0b',
      };
    case 'silver':
      return {
        label: 'Silver',
        badge: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
        border: 'border-slate-400/40',
        glow: 'from-slate-400/20 via-slate-500/10 to-transparent',
        accent: '#94a3b8',
      };
    case 'bronze':
    default:
      return {
        label: 'Bronze',
        badge: 'bg-orange-700/15 text-orange-400 border-orange-700/30',
        border: 'border-orange-700/40',
        glow: 'from-orange-700/20 via-amber-900/10 to-transparent',
        accent: '#c2410c',
      };
  }
}
