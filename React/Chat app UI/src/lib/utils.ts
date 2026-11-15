import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatShortTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function formatDateCapsule(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(d);

  if (sameDay) return `Today, ${formatted}`;
  if (isYesterday) return `Yesterday, ${formatted}`;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes?: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)]+/g);
  return matches ? Array.from(new Set(matches)) : [];
}

export function canEditMessage(createdAt: string, senderId: string, currentUserId: string): boolean {
  if (senderId !== currentUserId) return false;
  return Date.now() - new Date(createdAt).getTime() <= 15 * 60_000;
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface DiffSegment {
  type: 'same' | 'removed' | 'added';
  text: string;
}

export function computeSimpleWordDiff(prev: string, next: string): DiffSegment[] {
  const a = prev.split(/\s+/);
  const b = next.split(/\s+/);
  const bSet = new Set(b);
  const aSet = new Set(a);

  const segments: DiffSegment[] = [];
  for (const word of a) {
    if (!bSet.has(word)) {
      segments.push({ type: 'removed', text: word });
    }
  }
  for (const word of b) {
    segments.push({
      type: aSet.has(word) ? 'same' : 'added',
      text: word,
    });
  }
  return segments;
}

