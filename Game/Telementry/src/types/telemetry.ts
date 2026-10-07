export type GameMode = 
  | 'Ranked 5v5'
  | 'Casual Quickplay'
  | 'Deathmatch'
  | 'Payload Push'
  | 'Overdrive Protocol';

export type MatchResult = 'VICTORY' | 'DEFEAT';

export type PeriodFilter = '7d' | '30d' | 'season' | 'all';

export type ProfileScenario = 'veteran' | 'empty' | 'low_data';

export interface RawEvent {
  id: string;
  timestamp: string; // ISO string
  type: 
    | 'match_start'
    | 'kill'
    | 'death'
    | 'assist'
    | 'headshot'
    | 'clutch_won'
    | 'objective_secured'
    | 'pr_broken'
    | 'match_end';
  payload?: Record<string, unknown>;
}

export interface SessionTimelineMoment {
  timeOffsetSec: number;
  type: 'kill' | 'death' | 'clutch' | 'pr' | 'round_win' | 'ace';
  description: string;
  round: number;
}

export interface Session {
  id: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  durationMinutes: number;
  mode: GameMode;
  map: string;
  result: MatchResult;
  roundsWon: number;
  roundsLost: number;
  eloChange: number; // e.g. +24 or -18
  
  // Core metrics
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
  accuracyPercent: number;
  headshotPercent: number;
  damageDealt: number;
  peakRoundDamage: number;
  primaryWeapon: string;
  
  // Tags & Notable moments
  notableBadges: string[]; // e.g., 'PR SET', 'CLUTCH x3', 'FLAWLESS DEF', 'COMEBACK'
  
  // Supporting data
  timeline: SessionTimelineMoment[];
  rawEvents: RawEvent[];
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  playtimeHours: number;
  sessionCount: number;
  wins: number;
  losses: number;
  winRate: number; // percentage
  avgKd: number;
  avgAccuracy: number;
  avgDamage: number;
  dominantResult: 'VICTORY' | 'DEFEAT' | 'REST';
  notableEvent?: string;
  isStreakActive: boolean;
  isFrozen?: boolean;
}

export interface StatSparkPoint {
  date: string;
  value: number;
}

export interface CoreStatMetric {
  id: 'kd' | 'accuracy' | 'win_rate' | 'damage';
  name: string;
  currentValue: number;
  formattedValue: string;
  previousValue: number;
  delta: number;
  deltaPercent: number;
  isPositive: boolean;
  unit: string;
  sparkline: StatSparkPoint[];
  formula: string;
  explanation: string;
  sessionsCount: number;
  contributingSessions: { id: string; date: string; value: string; result: MatchResult }[];
}

export interface PersonalRecord {
  id: string;
  category: 'damage' | 'kd' | 'kills' | 'accuracy' | 'win_streak';
  title: string;
  currentRecord: number;
  formattedRecord: string;
  unit: string;
  previousRecord: number;
  beatenBy: number;
  achievedDate: string;
  achievedSessionId: string;
  sessionMode: string;
  map: string;
  nearMiss?: {
    recentValue: number;
    difference: number;
    date: string;
    sessionId: string;
  };
}

export interface Milestone {
  id: string;
  title: string;
  category: string;
  currentProgress: number;
  targetValue: number;
  unit: string;
  percentComplete: number;
  isCompleted: boolean;
  completedDate?: string;
  badge: string;
  description: string;
}

export interface PlayerGoal {
  id: string;
  title: string;
  metric: 'accuracy' | 'kd' | 'weekly_hours' | 'win_rate' | 'damage';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string; // YYYY-MM-DD
  status: 'active' | 'completed' | 'expired';
  createdBy: 'player' | 'suggested';
  suggestedReason?: string;
}

export interface StreakData {
  currentStreakDays: number;
  longestStreakDays: number;
  freezesRemaining: number;
  maxFreezes: number;
  freezesUsedThisWeek: number;
  lastActiveLocalDate: string;
  wasForgiven: boolean;
  welcomeBackMessage?: string;
}

export interface InsightRule {
  id: string;
  type: 'time_of_day' | 'tilt_warning' | 'weapon_synergy' | 'fatigue' | 'warmup';
  headline: string;
  narrative: string;
  actionableTip: string;
  evidence: {
    label: string;
    valueA: string;
    valueB: string;
    sampleSize: number;
    timeframe: string;
  };
  dismissed: boolean;
  iconName: string;
}

export interface WeeklyRecap {
  weekLabel: string;
  dateRange: string;
  topMoment: {
    title: string;
    description: string;
    sessionId: string;
  };
  biggestImprovement: {
    metric: string;
    delta: string;
    context: string;
  };
  recordSet?: {
    title: string;
    val: string;
  };
  totalPlaytimeHours: number;
  matchesPlayed: number;
  wins: number;
  winRate: number;
  mvpWeapon: string;
}

export interface PlayerAnnotation {
  id: string;
  date: string; // YYYY-MM-DD
  note: string;
  category: 'gear' | 'settings' | 'team' | 'physical';
}

export interface PlayerProfile {
  id: string;
  displayName: string;
  tag: string;
  avatarSeed: string;
  rankTier: string;
  elo: number;
  serverRegion: string;
  pingMs: number;
  timezone: string;
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showPlaytime: boolean;
    showKd: boolean;
    showGoals: boolean;
  };
  units: 'metric' | 'imperial';
}

export interface FriendComparison {
  friendName: string;
  friendAvatar: string;
  friendRank: string;
  sharedSessionsCount: number;
  metrics: {
    name: string;
    playerVal: string;
    friendVal: string;
    playerAdvantage: boolean | null;
  }[];
}
