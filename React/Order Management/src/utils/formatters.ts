// Strict financial formatting from integer cents to USD
export function formatCents(cents: number, showSign: boolean = false): string {
  const isNegative = cents < 0;
  const absValue = Math.abs(cents);
  const dollars = (absValue / 100).toFixed(2);
  const formatted = `$${Number(dollars).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isNegative) {
    return `-${formatted}`;
  }
  if (showSign && cents > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

export function formatGrams(grams: number): string {
  const lbs = grams / 453.592;
  if (lbs < 1) {
    const oz = (grams / 28.3495).toFixed(1);
    return `${oz} oz`;
  }
  return `${lbs.toFixed(1)} lbs`;
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function formatShortDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
}

export interface SlaRemaining {
  text: string;
  isUrgent: boolean; // < 2 hours
  isCritical: boolean; // < 1 hour
  isOverdue: boolean;
  totalMinutes: number;
}

export function calculateSlaRemaining(slaShipByIso: string): SlaRemaining {
  try {
    const target = new Date(slaShipByIso).getTime();
    const now = Date.now();
    const diffMs = target - now;
    const totalMinutes = Math.floor(diffMs / 60000);

    if (totalMinutes <= 0) {
      return {
        text: 'BREACHED',
        isUrgent: true,
        isCritical: true,
        isOverdue: true,
        totalMinutes,
      };
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    let text = '';
    if (hours > 0) {
      text = `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
    } else {
      text = `${mins}m left`;
    }

    return {
      text,
      isUrgent: totalMinutes < 120,
      isCritical: totalMinutes < 60,
      isOverdue: false,
      totalMinutes,
    };
  } catch {
    return {
      text: '--',
      isUrgent: false,
      isCritical: false,
      isOverdue: false,
      totalMinutes: 9999,
    };
  }
}

export function calculateGraceSecondsRemaining(graceEndsIso?: string): number {
  if (!graceEndsIso) return 0;
  const target = new Date(graceEndsIso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((target - now) / 1000);
  return Math.max(0, diffSec);
}

export function formatGraceCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

