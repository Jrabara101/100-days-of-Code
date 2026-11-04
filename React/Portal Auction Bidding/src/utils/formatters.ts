export function formatCents(cents: number, includeDecimals = false): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(dollars);
}

export function formatTimeRemaining(remainingMs: number): {
  formatted: string;
  isOvertime: boolean;
  isExpired: boolean;
  secondsRemaining: number;
} {
  if (remainingMs <= 0) {
    return {
      formatted: '00:00.0',
      isOvertime: false,
      isExpired: true,
      secondsRemaining: 0,
    };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const tenths = Math.floor((remainingMs % 1000) / 100);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isOvertime = totalSeconds < 120; // less than 2 minutes: popcorn overtime

  if (hours > 0) {
    const hStr = hours.toString().padStart(2, '0');
    const mStr = minutes.toString().padStart(2, '0');
    const sStr = seconds.toString().padStart(2, '0');
    return {
      formatted: `${hStr}h ${mStr}m ${sStr}s`,
      isOvertime: false,
      isExpired: false,
      secondsRemaining: totalSeconds,
    };
  }

  const mStr = minutes.toString().padStart(2, '0');
  const sStr = seconds.toString().padStart(2, '0');

  if (isOvertime) {
    return {
      formatted: `${mStr}m ${sStr}.${tenths}s`,
      isOvertime: true,
      isExpired: false,
      secondsRemaining: totalSeconds,
    };
  }

  return {
    formatted: `${mStr}m ${sStr}s`,
    isOvertime: false,
    isExpired: false,
    secondsRemaining: totalSeconds,
  };
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}d ago`;
}

export function formatDateTime(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(new Date(isoString));
}

