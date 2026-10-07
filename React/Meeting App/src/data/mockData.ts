import { EventType, HostProfile, Booking, GroupConsensusPoll, ConnectedCalendar, WebhookLog, TimeSlot } from '../types';

export const initialHostProfile: HostProfile = {
  name: 'Alex Rivera',
  role: 'Lead Product Architect',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDm05Sw0Y7flfNqkzcMtf55dtOUfZu0xkaw2ru5vcvkZ9EgYqElQv-tGYEsX19KsYpDi3zdsQUm2TWshVRqfotyOzNDv1Tx4DT0bURoRHCaPQpawKQxb3VwJAg4A_l4OEJmtxS8-JkWgAfs4TeLH0s6YvcFjFYETpB723qv1rAOp0uC5fqSJO3Sk_Oj9eQj4-Ca1G3J5sQWoRXr0GmND-nP0d-cXnXISQJNvIyCBR5IhThqrCMhSmunfw',
  verified: true,
  timezone: 'America/New_York',
  timezoneLabel: 'America/New_York (EDT, GMT-4)',
  activeQuarter: 'Q4 Active'
};

export const initialEventTypes: EventType[] = [
  {
    id: 'evt-1',
    slug: 'discovery-30',
    title: '30 Min Discovery Call',
    durationMinutes: 30,
    description: 'Initial sync to explore workflow bottlenecks, technical sync points, and architectural feasibility for the upcoming Q4 sprint.',
    locationType: 'google-meet',
    locationDetails: 'meet.google.com/xyz-qwer-abc',
    color: '#2563eb',
    isActive: true,
    bufferBeforeMinutes: 10,
    bufferAfterMinutes: 15,
    maxPerDay: 4,
    noticeLeadHours: 4,
    horizonDays: 30
  },
  {
    id: 'evt-2',
    slug: 'architecture-60',
    title: '60 Min Architecture Deep-Dive',
    durationMinutes: 60,
    description: 'Comprehensive system review, schema design alignment, and API contract specifications.',
    locationType: 'zoom',
    locationDetails: 'zoom.us/j/9876543210',
    color: '#006c49',
    isActive: true,
    bufferBeforeMinutes: 15,
    bufferAfterMinutes: 15,
    maxPerDay: 2,
    noticeLeadHours: 12,
    horizonDays: 45
  },
  {
    id: 'evt-3',
    slug: 'quick-intro-15',
    title: '15 Min Quick Intro Sync',
    durationMinutes: 15,
    description: 'Rapid alignment call to assess fit, verify requirements, or answer urgent questions.',
    locationType: 'phone',
    locationDetails: '+1 (555) 234-5678',
    color: '#943700',
    isActive: true,
    bufferBeforeMinutes: 5,
    bufferAfterMinutes: 10,
    maxPerDay: 6,
    noticeLeadHours: 2,
    horizonDays: 14
  }
];

export const defaultSlots: TimeSlot[] = [
  { id: 's1', time: '09:00 AM', period: 'Morning', isAvailable: true },
  { id: 's2', time: '09:30 AM', period: 'Morning', isAvailable: true },
  { id: 's3', time: '10:00 AM', period: 'Morning', isAvailable: true },
  { id: 's4', time: '10:30 AM', period: 'Morning', isAvailable: true },
  { id: 's5', time: '11:00 AM', period: 'Morning', isAvailable: true },
  { id: 's6', time: '01:30 PM', period: 'Afternoon', isAvailable: true },
  { id: 's7', time: '02:00 PM', period: 'Afternoon', isAvailable: true },
  { id: 's8', time: '03:00 PM', period: 'Afternoon', isAvailable: true },
  { id: 's9', time: '04:30 PM', period: 'Afternoon', isAvailable: true },
];

export const initialBookings: Booking[] = [
  {
    id: 'bkg-101',
    eventTypeId: 'evt-1',
    eventTitle: '30 Min Discovery Call',
    hostName: 'Alex Rivera',
    guestName: 'Jane Doe',
    guestEmail: 'jane@enterprise.io',
    guestPhone: '+1 (555) 901-2345',
    guestCompany: 'Enterprise.io',
    projectScope: 'Scaling calendar sync to 10k enterprise seats with conflict resolution',
    guestNotes: 'Looking to integrate Google Calendar and Office 365 sync into our HR platform.',
    dateStr: '2024-10-24',
    formattedDate: 'Thursday, October 24, 2024',
    timeStr: '10:00 AM',
    durationMinutes: 30,
    status: 'confirmed',
    meetLink: 'https://meet.google.com/xyz-qwer-abc',
    timezone: 'America/New_York (EDT)',
    remindersEnabled: { email24h: true, sms1h: true },
    createdAt: '2024-10-21T14:32:00Z'
  },
  {
    id: 'bkg-102',
    eventTypeId: 'evt-2',
    eventTitle: '60 Min Architecture Deep-Dive',
    hostName: 'Alex Rivera',
    guestName: 'Marcus Vance',
    guestEmail: 'marcus@vancecloud.net',
    guestPhone: '+1 (555) 876-5432',
    guestCompany: 'Vance Cloud Corp',
    projectScope: 'Cross-cloud federated webhook orchestration pipeline',
    guestNotes: 'We need advice on resilient webhook retry logic and rate limit management.',
    dateStr: '2024-10-25',
    formattedDate: 'Friday, October 25, 2024',
    timeStr: '02:00 PM',
    durationMinutes: 60,
    status: 'confirmed',
    meetLink: 'https://zoom.us/j/9876543210',
    timezone: 'America/New_York (EDT)',
    remindersEnabled: { email24h: true, sms1h: false },
    createdAt: '2024-10-22T09:15:00Z'
  },
  {
    id: 'bkg-103',
    eventTypeId: 'evt-1',
    eventTitle: '30 Min Discovery Call',
    hostName: 'Alex Rivera',
    guestName: 'Sarah Jenkins',
    guestEmail: 's.jenkins@healthtech.co',
    guestNotes: 'Client postponed due to internal quarterly offsite.',
    dateStr: '2024-10-23',
    formattedDate: 'Wednesday, October 23, 2024',
    timeStr: '11:30 AM',
    durationMinutes: 30,
    status: 'cancelled',
    meetLink: 'https://meet.google.com/xyz-qwer-abc',
    timezone: 'America/New_York (EDT)',
    remindersEnabled: { email24h: true, sms1h: true },
    createdAt: '2024-10-19T11:00:00Z'
  }
];

export const initialGroupPoll: GroupConsensusPoll = {
  id: 'poll-2024',
  title: 'Q4 Architecture Review - Consensus Lock',
  description: 'Vote on workable times for our cross-functional team alignment. When all 3 key stakeholders vote "Yes", the slot is auto-locked and invites are dispatched.',
  hostName: 'Alex Rivera',
  durationMinutes: 45,
  quorumNeeded: 3,
  totalStakeholders: 3,
  status: 'open',
  voters: [
    { name: 'Alex Rivera (Host)', email: 'alex@company.com', votedSlots: ['ps-1', 'ps-2', 'ps-3'] },
    { name: 'Diana Prince (CTO)', email: 'diana@company.com', votedSlots: ['ps-1', 'ps-3'] },
  ],
  slots: [
    {
      id: 'ps-1',
      dateStr: '2024-10-28',
      formattedDate: 'Monday, Oct 28',
      timeStr: '02:00 PM EDT',
      votes: ['Alex Rivera (Host)', 'Diana Prince (CTO)']
    },
    {
      id: 'ps-2',
      dateStr: '2024-10-29',
      formattedDate: 'Tuesday, Oct 29',
      timeStr: '11:00 AM EDT',
      votes: ['Alex Rivera (Host)']
    },
    {
      id: 'ps-3',
      dateStr: '2024-10-30',
      formattedDate: 'Wednesday, Oct 30',
      timeStr: '03:30 PM EDT',
      votes: ['Alex Rivera (Host)', 'Diana Prince (CTO)']
    }
  ]
};

export const initialCalendars: ConnectedCalendar[] = [
  {
    provider: 'google',
    name: 'Google Calendar (Primary)',
    email: 'alex.rivera@gmail.com',
    status: 'connected',
    lastSyncedAt: 'Just now (2-way live sync)',
    totalSyncedEvents: 42
  },
  {
    provider: 'microsoft',
    name: 'Microsoft 365 Outlook',
    email: 'alex.rivera@enterprise.com',
    status: 'connected',
    lastSyncedAt: '2 mins ago',
    totalSyncedEvents: 28
  }
];

export const initialWebhookLogs: WebhookLog[] = [
  {
    id: 'wh-881',
    event: 'booking.created',
    timestamp: '2024-10-24 10:02:14 UTC',
    status: 'delivered',
    responseCode: 200,
    payload: {
      event: 'booking.created',
      bookingId: 'bkg-101',
      guest: 'Jane Doe',
      time: '2024-10-24T14:00:00Z',
      meetLink: 'https://meet.google.com/xyz-qwer-abc'
    }
  },
  {
    id: 'wh-880',
    event: 'booking.rescheduled',
    timestamp: '2024-10-23 16:40:02 UTC',
    status: 'delivered',
    responseCode: 200,
    payload: {
      event: 'booking.rescheduled',
      bookingId: 'bkg-099',
      previousSlot: '2024-10-23T13:00:00Z',
      newSlot: '2024-10-24T15:30:00Z'
    }
  },
  {
    id: 'wh-879',
    event: 'booking.cancelled',
    timestamp: '2024-10-23 09:12:33 UTC',
    status: 'delivered',
    responseCode: 200,
    payload: {
      event: 'booking.cancelled',
      bookingId: 'bkg-103',
      reason: 'Host calendar hold freed'
    }
  }
];
