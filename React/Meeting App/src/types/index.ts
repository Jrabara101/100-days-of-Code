export type LocationType = 'google-meet' | 'zoom' | 'in-person' | 'phone';

export interface EventType {
  id: string;
  slug: string;
  title: string;
  durationMinutes: number;
  description: string;
  locationType: LocationType;
  locationDetails: string;
  color: string;
  isActive: boolean;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  maxPerDay: number;
  noticeLeadHours: number;
  horizonDays: number;
}

export interface HostProfile {
  name: string;
  role: string;
  avatarUrl: string;
  verified: boolean;
  timezone: string;
  timezoneLabel: string;
  activeQuarter: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  period: 'Morning' | 'Afternoon';
  isAvailable: boolean;
  conflict?: boolean;
}

export interface DayAvailability {
  dayNumber: number;
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: string; // Mon, Tue, etc.
  isPast: boolean;
  isWeekend: boolean;
  isAvailable: boolean;
  availableSlotsCount: number;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  eventTitle: string;
  hostName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestCompany?: string;
  guestNotes?: string;
  projectScope?: string;
  dateStr: string;
  formattedDate: string;
  timeStr: string;
  durationMinutes: number;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
  meetLink: string;
  timezone: string;
  remindersEnabled: {
    email24h: boolean;
    sms1h: boolean;
  };
  createdAt: string;
}

export interface PollVoter {
  name: string;
  email: string;
  votedSlots: string[]; // Slot IDs voted "Yes"
}

export interface PollSlot {
  id: string;
  dateStr: string;
  formattedDate: string;
  timeStr: string;
  votes: string[]; // Voter names
}

export interface GroupConsensusPoll {
  id: string;
  title: string;
  description: string;
  hostName: string;
  durationMinutes: number;
  quorumNeeded: number;
  totalStakeholders: number;
  slots: PollSlot[];
  voters: PollVoter[];
  status: 'open' | 'locked';
  lockedSlotId?: string;
}

export interface WebhookLog {
  id: string;
  event: 'booking.created' | 'booking.rescheduled' | 'booking.cancelled' | 'poll.consensus_locked';
  timestamp: string;
  status: 'delivered' | 'retrying' | 'failed';
  responseCode: number;
  payload: Record<string, any>;
}

export interface ConnectedCalendar {
  provider: 'google' | 'microsoft';
  name: string;
  email: string;
  status: 'connected' | 'syncing' | 'error';
  lastSyncedAt: string;
  totalSyncedEvents: number;
}
