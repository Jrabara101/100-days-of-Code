import type { WorkingHours } from '../types/chat';

export interface TimezoneContextInfo {
  city: string;
  localTime12h: string;
  localTime24h: string;
  hour24: number;
  isSleeping: boolean; // 22:00 - 07:00
  isWorkingHours: boolean;
  offsetDeltaLabel: string;
  statusLabel: string;
  icon: 'moon' | 'sun' | 'briefcase';
  next9amIso: string;
  next9amLabel: string;
}

const CITY_OVERRIDES: Record<string, string> = {
  'America/Los_Angeles': 'San Francisco',
  'America/New_York': 'New York',
  'America/Chicago': 'Chicago',
  'Europe/London': 'London',
  'Europe/Berlin': 'Berlin',
  'Europe/Paris': 'Paris',
  'Europe/Amsterdam': 'Amsterdam',
  'Europe/Stockholm': 'Stockholm',
  'Asia/Singapore': 'Singapore',
  'Asia/Tokyo': 'Tokyo',
  'Asia/Kolkata': 'Bengaluru',
  'Asia/Dubai': 'Dubai',
  'Australia/Sydney': 'Sydney',
};

function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = date.toLocaleString('en-US', { timeZone });
  return Math.round((new Date(tzStr).getTime() - new Date(utcStr).getTime()) / 60_000);
}

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getContactTimezoneInfo(
  recipientTimezone: string,
  workingHours: WorkingHours = { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
  referenceTimezone = 'Asia/Singapore',
  now = new Date()
): TimezoneContextInfo {
  let validTz = recipientTimezone || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: validTz }).format(now);
  } catch {
    validTz = 'UTC';
  }

  const city =
    CITY_OVERRIDES[validTz] ?? validTz.split('/').pop()?.replace(/_/g, ' ') ?? 'UTC';

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: validTz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now);

  const hourRaw = Number(parts.find((p) => p.type === 'hour')?.value ?? '12');
  const hour24 = hourRaw === 24 ? 0 : hourRaw;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const totalMins = hour24 * 60 + minute;

  const localTime12h = new Intl.DateTimeFormat('en-US', {
    timeZone: validTz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  const localTime24h = `${hour24.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;

  const isSleeping = hour24 >= 22 || hour24 < 7;
  const startMins = parseTimeToMinutes(workingHours.start);
  const endMins = parseTimeToMinutes(workingHours.end);
  const isWorkingHours = !isSleeping && totalMins >= startMins && totalMins <= endMins;

  const myOffset = getTimeZoneOffsetMinutes(referenceTimezone, now);
  const theirOffset = getTimeZoneOffsetMinutes(validTz, now);
  const diffHours = Math.round((theirOffset - myOffset) / 60);
  const offsetDeltaLabel =
    diffHours === 0
      ? 'Same timezone'
      : diffHours > 0
        ? `+${diffHours}h ahead`
        : `${diffHours}h behind`;

  let statusLabel = 'Off-hours';
  let icon: 'moon' | 'sun' | 'briefcase' = 'sun';
  if (isSleeping) {
    statusLabel = 'Sleeping';
    icon = 'moon';
  } else if (isWorkingHours) {
    statusLabel = 'Working hours';
    icon = 'briefcase';
  }

  // Compute next 9:00 AM in recipient's timezone
  let minsUntil9am = 9 * 60 - totalMins;
  if (minsUntil9am <= 0) minsUntil9am += 24 * 60;
  const next9amDate = new Date(now.getTime() + minsUntil9am * 60_000);
  const next9amLabel =
    totalMins < 9 * 60 ? 'Today 9:00 AM their time' : 'Tomorrow 9:00 AM their time';

  return {
    city,
    localTime12h,
    localTime24h,
    hour24,
    isSleeping,
    isWorkingHours,
    offsetDeltaLabel,
    statusLabel,
    icon,
    next9amIso: next9amDate.toISOString(),
    next9amLabel,
  };
}

