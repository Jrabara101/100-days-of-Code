export type ArchetypeId = 'fine-dining' | 'wellness-studio' | 'creative-padel';

export type VisitStyle = 'express' | 'classic' | 'celebration';

export interface VisitStyleConfig {
  id: VisitStyle;
  label: string;
  durationMinutes: number;
  badge: string;
  description: string;
  idealFor: string;
}

export type SlotStatus = 'available' | 'prime' | 'held-by-poll' | 'booked' | 'gap-express' | 'waitlist-only';

export interface TimeSlot {
  id: string;
  timeStr: string; // e.g. "06:45 PM"
  militaryTime: string; // "18:45"
  minutesFromMidnight: number;
  status: SlotStatus;
  crowdEnergy: 'calm' | 'brisk' | 'aperitivo' | 'prime-buzz' | 'winding-down';
  lightLevel: 'sunlit' | 'golden-hour' | 'candlelit';
  ambientDb: number;
  openSpotsCount: number;
  totalSpotsCount: number;
  arrivalLoad: number; // current guests booked in this 15-min bucket
  maxPacingArrivals: number; // e.g. 16 guests max per 15 min
  smartNudge?: {
    triggerIfBooked: boolean;
    reason: string;
    suggestedAlternativeTime: string;
    alternativeSpotName: string;
    timeDelta: string;
  };
  waitlistOdds?: number; // e.g. 84 (%)
  waitlistQueuePosition?: number;
}

export type ZoneTag = 
  | 'intimate'
  | 'high-energy'
  | 'sunlit'
  | 'power-outlet'
  | 'dog-friendly'
  | 'garden-pergola'
  | 'acoustic-quiet'
  | 'chef-view'
  | 'infrared'
  | 'reformer'
  | 'acoustics-treated'
  | 'court-glass';

export interface VibeTag {
  id: ZoneTag;
  label: string;
  icon: string;
  description: string;
}

export interface Spot {
  id: string;
  code: string; // e.g. "BOOTH 04"
  name: string; // e.g. "Sunlit Window Corner Booth"
  zoneId: string;
  zoneName: string;
  capacityMin: number;
  capacityMax: number;
  optimalCapacity: number;
  vibes: ZoneTag[];
  noiseLevel: 'Whisper Soft (<55dB)' | 'Warm Conversation (55-65dB)' | 'Lively Buzz (65-75dB)';
  noiseDb: number;
  comfortRating: string; // e.g. "Plush Mohair Banquette"
  sightlineSummary: string;
  photoUrl: string;
  isWeatherContingency?: boolean; // Outdoor patio with indoor shadow table
  indoorBackupSpotId?: string;
  priceDeposit?: number; // e.g. $25/pp or $45/hr
  // Spatial SVG coordinates on the floorplan
  svg: {
    shape: 'rect' | 'circle' | 'path';
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    rotation?: number;
  };
}

export interface Zone {
  id: string;
  name: string;
  archetypeId: ArchetypeId;
  description: string;
  vibePills: string[];
  spots: Spot[];
  indoor: boolean;
  ambientLighting: 'direct-sun' | 'diffused-courtyard' | 'amber-glow' | 'studio-lumens';
}

export interface Archetype {
  id: ArchetypeId;
  name: string;
  tagline: string;
  heroSerif: string;
  categoryBadge: string;
  defaultPartySize: number;
  currency: string;
  priceNote: string;
  zones: Zone[];
  curatedAddOns: {
    id: string;
    title: string;
    price: number;
    badge: string;
    description: string;
    category: 'sommelier' | 'course' | 'wellness' | 'gear';
  }[];
  hospitalityPrompts: {
    occasions: { id: string; label: string; icon: string; prompt: string }[];
    comforts: { id: string; label: string; icon: string; prompt: string }[];
  };
  sampleVipGuest: {
    name: string;
    streak: number;
    notes: string;
    preferences: string[];
  };
}

export interface SoftHoldGroupPoll {
  holdId: string;
  spotId: string;
  slotId: string;
  timeStr: string;
  dateStr: string;
  expiresAt: number; // timestamp
  secondsRemaining: number;
  totalDurationSeconds: number;
  shareableUrl: string;
  partySize: number;
  participants: {
    id: string;
    name: string;
    status: 'joined' | 'pending' | 'organizer';
    avatar: string;
    dietaryNotes?: string;
    tabPaid?: boolean;
    splitAmount?: number;
  }[];
}

export interface ConfirmedReservation {
  id: string;
  code: string; // e.g. "RES #8492-LUM"
  archetypeId: ArchetypeId;
  dateStr: string;
  timeStr: string;
  partySize: number;
  visitStyle: VisitStyle;
  spot: Spot;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hospitalityNotes: string[];
  addOns: string[];
  depositTotal: number;
  depositPaid: boolean;
  isWeatherContingencyCovered: boolean;
  indoorBackupTable?: string;
  status: 'confirmed' | 'running-late' | 'swapped';
  graceWindowMinutes: number; // e.g. 10m or 15m
  estimatedTurnTimeMinutes: number;
  createdAt: string;
  qrCodeData: string;
  pacingBucketId: string;
}

export interface WaitlistEntry {
  id: string;
  slotTime: string;
  dateStr: string;
  partySize: number;
  probabilityPercent: number;
  queuePosition: number;
  autoClaimEnabled: boolean;
  timeToleranceWindow: string; // e.g. "6:30 PM - 8:00 PM"
  guestName: string;
  guestPhone: string;
}

export interface HostStandTableStatus {
  tableId: string;
  tableCode: string;
  currentPartyName?: string;
  partySize?: number;
  seatedAt?: string;
  expectedTurnTimeMinutes: number;
  elapsedMinutes: number;
  progressPercent: number;
  status: 'vacant' | 'seated-appetizers' | 'mains-in-progress' | 'dessert-check' | 'held-hold' | 'reserved-imminent';
  alerts?: string[];
  isVip?: boolean;
}
