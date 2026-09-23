import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMs(ms: number): string {
  if (ms < 1) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${ms.toFixed(1)}ms`;
}
