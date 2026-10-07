import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeRemaining(ms: number): string {
  const seconds = Math.max(0, ms / 1000);
  return `${seconds.toFixed(1)}s`;
}
