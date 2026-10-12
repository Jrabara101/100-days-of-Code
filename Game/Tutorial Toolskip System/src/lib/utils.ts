import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EventCategory } from '../types/replay';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor(ms % 1000);

  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');
  const msStr = String(milliseconds).padStart(3, '0');

  return `${mStr}:${sStr}.${msStr}`;
}

export function formatTick(tick: number): string {
  return `TICK: ${String(tick).padStart(6, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getCategoryColor(category: EventCategory): {
  color: string;
  bg: string;
  border: string;
  text: string;
  badge: string;
} {
  switch (category) {
    case 'kill':
      return {
        color: '#F59E0B',
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/50',
        text: 'text-amber-400',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      };
    case 'death':
      return {
        color: '#F43F5E',
        bg: 'bg-rose-500/20',
        border: 'border-rose-500/50',
        text: 'text-rose-400',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      };
    case 'ability':
      return {
        color: '#8B5CF6',
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/50',
        text: 'text-purple-400',
        badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      };
    case 'checkpoint':
      return {
        color: '#10B981',
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/50',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      };
    case 'milestone':
    default:
      return {
        color: '#38BDF8',
        bg: 'bg-sky-500/20',
        border: 'border-sky-500/50',
        text: 'text-sky-400',
        badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      };
  }
}
