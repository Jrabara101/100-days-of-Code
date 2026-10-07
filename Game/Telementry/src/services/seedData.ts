import { 
  Session, 
  PlayerProfile, 
  PersonalRecord, 
  Milestone, 
  PlayerGoal, 
  StreakData, 
  InsightRule, 
  WeeklyRecap, 
  PlayerAnnotation,
  FriendComparison,
  GameMode,
  MatchResult,
  SessionTimelineMoment,
  RawEvent
} from '../types/telemetry';

export const DEFAULT_PLAYER: PlayerProfile = {
  id: 'usr_chrono_7781',
  displayName: 'CYBER_VALKYRIE',
  tag: '#412',
  avatarSeed: 'Valkyrie',
  rankTier: 'VORTEX // S-TIER',
  elo: 2840,
  serverRegion: 'US-EAST',
  pingMs: 14,
  timezone: 'America/New_York',
  privacy: {
    profileVisibility: 'friends',
    showPlaytime: true,
    showKd: true,
    showGoals: true,
  },
  units: 'metric',
};

const MAPS = [
  'Neon Haven', 
  'Shattered Grid', 
  'Sub-Zero Base', 
  'Orbital Ring', 
  'Canyon Siphon', 
  'Apex Core'
];

const WEAPONS = [
  'Phantom-X', 
  'Arc-Viper', 
  'Tempest-9', 
  'Chronos DMR', 
  'Pulse Carbine'
];

const MODES: GameMode[] = [
  'Ranked 5v5', 
  'Ranked 5v5', 
  'Casual Quickplay', 
  'Deathmatch', 
  'Payload Push'
];

function generateTimeline(
  kills: number, 
  deaths: number, 
  roundsWon: number, 
  roundsLost: number, 
  hasPr: boolean
): SessionTimelineMoment[] {
  const moments: SessionTimelineMoment[] = [];
  const totalRounds = roundsWon + roundsLost;
  
  moments.push({
    timeOffsetSec: 15,
    type: 'round_win',
    description: 'Round 1 Pistol Round Secured',
    round: 1
  });

  if (kills >= 15) {
    moments.push({
      timeOffsetSec: 320,
      type: 'clutch',
      description: '1v3 Clutch Defuse under Smoke',
      round: 4
    });
  }

  if (hasPr) {
    moments.push({
      timeOffsetSec: 720,
      type: 'pr',
      description: 'Personal Best Round: 980 DMG with Phantom-X',
      round: 8
    });
    moments.push({
      timeOffsetSec: 1140,
      type: 'ace',
      description: '5-Kill ACE to clinch Match Point',
      round: 12
    });
  } else if (kills >= 20) {
    moments.push({
      timeOffsetSec: 890,
      type: 'kill',
      description: 'Triple Kill with Headshots across Mid',
      round: 9
    });
  }

  if (deaths > 12) {
    moments.push({
      timeOffsetSec: 1300,
      type: 'death',
      description: 'Caught in Crossfire on Site B',
      round: 14
    });
  }

  moments.push({
    timeOffsetSec: 1800,
    type: roundsWon > roundsLost ? 'round_win' : 'death',
    description: roundsWon > roundsLost ? 'Victory Declared (Match Point)' : 'Defeat Finalized',
    round: totalRounds
  });

  return moments;
}

function generateRawEvents(session: Partial<Session>): RawEvent[] {
  const events: RawEvent[] = [];
  const baseTime = new Date(session.startTime || Date.now()).getTime();

  events.push({
    id: `ev_${session.id}_start`,
    timestamp: new Date(baseTime).toISOString(),
    type: 'match_start',
    payload: { map: session.map, mode: session.mode }
  });

  const kills = session.kills || 10;
  for (let i = 0; i < kills; i++) {
    events.push({
      id: `ev_${session.id}_k_${i}`,
      timestamp: new Date(baseTime + (i * 95000) + 30000).toISOString(),
      type: 'kill',
      payload: { weapon: session.primaryWeapon, headshot: i % 3 === 0 }
    });
  }

  const deaths = session.deaths || 8;
  for (let i = 0; i < deaths; i++) {
    events.push({
      id: `ev_${session.id}_d_${i}`,
      timestamp: new Date(baseTime + (i * 120000) + 60000).toISOString(),
      type: 'death',
      payload: { round: i + 1 }
    });
  }

  events.push({
    id: `ev_${session.id}_end`,
    timestamp: new Date(session.endTime || baseTime + 1800000).toISOString(),
    type: 'match_end',
    payload: { result: session.result, roundsWon: session.roundsWon, roundsLost: session.roundsLost }
  });

  return events;
}

export function generateRealistic6MonthSessions(): Session[] {
  const sessions: Session[] = [];
  // Reference date: Sept 30, 2026
  const now = new Date(2026, 8, 30, 8, 30, 0); // Month index 8 is September
  const totalDays = 180; // 6 months

  let sessionCounter = 1;

  for (let dayOffset = totalDays; dayOffset >= 0; dayOffset--) {
    const sessionDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dayOfWeek = sessionDate.getDay(); // 0 is Sun, 6 is Sat

    // Create realistic play frequency:
    // Tue/Thu/Fri/Sat/Sun more likely to play; Mon/Wed occasionally rest days
    const isRestDay = (dayOfWeek === 1 && dayOffset % 5 !== 0) || (dayOffset % 17 === 0);
    if (isRestDay && dayOffset > 2) {
      continue; // No sessions this day (rest day gap)
    }

    // Identify special historical periods:
    const isHotStreakPeriod = dayOffset >= 18 && dayOffset <= 24; // 1 week hot streak
    const isSlumpPeriod = dayOffset >= 35 && dayOffset <= 39;     // 4 days tilt/slump
    const isOutlierDay = dayOffset === 2; // 2 days ago: the massive peak outlier match!

    // Determine session count for the day
    const sessionCount = isOutlierDay ? 3 : isHotStreakPeriod ? 4 : (dayOfWeek === 0 || dayOfWeek === 6) ? 3 : 2;

    for (let s = 0; s < sessionCount; s++) {
      const matchHour = 18 + s * 2 + Math.floor(Math.random() * 2); // Mostly evening sessions (18:00 - 23:00)
      const startTime = new Date(sessionDate);
      startTime.setHours(matchHour, Math.floor(Math.random() * 45), 0, 0);

      const durationMinutes = 20 + Math.floor(Math.random() * 25);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

      let result: MatchResult = Math.random() > 0.42 ? 'VICTORY' : 'DEFEAT';
      let accuracyPercent = 38 + Math.floor(Math.random() * 10);
      let kdRatio = 1.35 + (Math.random() * 0.9 - 0.3);
      let damageDealt = 1800 + Math.floor(Math.random() * 800);
      let peakRoundDamage = 450 + Math.floor(Math.random() * 300);
      const notableBadges: string[] = [];

      // Hot streak logic
      if (isHotStreakPeriod) {
        result = 'VICTORY';
        accuracyPercent = 46 + Math.floor(Math.random() * 6); // Boosted accuracy
        kdRatio = 2.1 + Math.random() * 0.8;
        damageDealt = 2400 + Math.floor(Math.random() * 600);
        if (s === 1) notableBadges.push('STREAK x5');
      }

      // Slump logic (tilt after 3 losses)
      if (isSlumpPeriod) {
        result = Math.random() > 0.25 ? 'DEFEAT' : 'VICTORY';
        accuracyPercent = 33 + Math.floor(Math.random() * 5);
        kdRatio = 0.85 + Math.random() * 0.4;
        damageDealt = 1350 + Math.floor(Math.random() * 400);
      }

      // Outlier session logic (the signature PR match)
      const isTheOutlierSession = isOutlierDay && s === 1;
      if (isTheOutlierSession) {
        result = 'VICTORY';
        accuracyPercent = 54.2;
        kdRatio = 2.45;
        damageDealt = 3050; // Near miss of all-time 3,120 record!
        peakRoundDamage = 980;
        notableBadges.push('PR SET', 'CLUTCH x3', 'ACE');
      } else if (result === 'VICTORY' && Math.random() > 0.7) {
        notableBadges.push(Math.random() > 0.5 ? 'CLUTCH x2' : 'FLAWLESS DEF');
      }

      const kills = isTheOutlierSession ? 27 : Math.max(4, Math.round(kdRatio * 11));
      const deaths = isTheOutlierSession ? 11 : Math.max(3, Math.round(kills / kdRatio));
      const assists = 4 + Math.floor(Math.random() * 8);
      const roundsWon = result === 'VICTORY' ? 13 : Math.floor(Math.random() * 11);
      const roundsLost = result === 'VICTORY' ? Math.floor(Math.random() * 11) : 13;
      const eloChange = result === 'VICTORY' ? 18 + Math.floor(Math.random() * 14) : -(12 + Math.floor(Math.random() * 12));

      const primaryWeapon = isTheOutlierSession 
        ? 'Phantom-X' 
        : WEAPONS[(sessionCounter + s) % WEAPONS.length];
      const map = isTheOutlierSession 
        ? 'Neon Haven' 
        : MAPS[(sessionCounter + dayOffset) % MAPS.length];
      const mode = isTheOutlierSession ? 'Ranked 5v5' : MODES[s % MODES.length];

      const sessionId = `ses_${sessionCounter.toString().padStart(4, '0')}`;
      const sessionObj: Session = {
        id: sessionId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes,
        mode,
        map,
        result,
        roundsWon,
        roundsLost,
        eloChange,
        kills,
        deaths,
        assists,
        kdRatio: Number((kills / Math.max(1, deaths)).toFixed(2)),
        accuracyPercent: Number(accuracyPercent.toFixed(1)),
        headshotPercent: Number((accuracyPercent * 0.74).toFixed(1)),
        damageDealt,
        peakRoundDamage,
        primaryWeapon,
        notableBadges,
        timeline: generateTimeline(kills, deaths, roundsWon, roundsLost, isTheOutlierSession),
        rawEvents: []
      };

      sessionObj.rawEvents = generateRawEvents(sessionObj);
      sessions.push(sessionObj);
      sessionCounter++;
    }
  }

  // Sort descending (most recent first)
  return sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

export function generateLowDataSessions(): Session[] {
  // 3 sessions total (under 5 data points threshold to test "Trends unlock after 5 sessions")
  const base = new Date(2026, 8, 29, 19, 0, 0);

  const s1: Session = {
    id: 'ses_low_001',
    startTime: new Date(base.getTime() - 48 * 3600 * 1000).toISOString(),
    endTime: new Date(base.getTime() - 47.5 * 3600 * 1000).toISOString(),
    durationMinutes: 28,
    mode: 'Casual Quickplay',
    map: 'Neon Haven',
    result: 'VICTORY',
    roundsWon: 13,
    roundsLost: 7,
    eloChange: 0,
    kills: 14,
    deaths: 9,
    assists: 5,
    kdRatio: 1.56,
    accuracyPercent: 39.5,
    headshotPercent: 28.0,
    damageDealt: 1940,
    peakRoundDamage: 520,
    primaryWeapon: 'Pulse Carbine',
    notableBadges: ['FIRST MATCH WIN'],
    timeline: generateTimeline(14, 9, 13, 7, false),
    rawEvents: []
  };

  const s2: Session = {
    id: 'ses_low_002',
    startTime: new Date(base.getTime() - 24 * 3600 * 1000).toISOString(),
    endTime: new Date(base.getTime() - 23.4 * 3600 * 1000).toISOString(),
    durationMinutes: 34,
    mode: 'Casual Quickplay',
    map: 'Shattered Grid',
    result: 'DEFEAT',
    roundsWon: 10,
    roundsLost: 13,
    eloChange: 0,
    kills: 11,
    deaths: 12,
    assists: 4,
    kdRatio: 0.92,
    accuracyPercent: 36.1,
    headshotPercent: 24.5,
    damageDealt: 1620,
    peakRoundDamage: 410,
    primaryWeapon: 'Tempest-9',
    notableBadges: [],
    timeline: generateTimeline(11, 12, 10, 13, false),
    rawEvents: []
  };

  const s3: Session = {
    id: 'ses_low_003',
    startTime: base.toISOString(),
    endTime: new Date(base.getTime() + 32 * 60 * 1000).toISOString(),
    durationMinutes: 32,
    mode: 'Ranked 5v5',
    map: 'Apex Core',
    result: 'VICTORY',
    roundsWon: 13,
    roundsLost: 11,
    eloChange: 22,
    kills: 18,
    deaths: 10,
    assists: 7,
    kdRatio: 1.80,
    accuracyPercent: 43.0,
    headshotPercent: 31.0,
    damageDealt: 2310,
    peakRoundDamage: 640,
    primaryWeapon: 'Phantom-X',
    notableBadges: ['CLUTCH x2'],
    timeline: generateTimeline(18, 10, 13, 11, false),
    rawEvents: []
  };

  s1.rawEvents = generateRawEvents(s1);
  s2.rawEvents = generateRawEvents(s2);
  s3.rawEvents = generateRawEvents(s3);

  return [s3, s2, s1];
}

export const INITIAL_RECORDS: PersonalRecord[] = [
  {
    id: 'pr_dmg',
    category: 'damage',
    title: 'Peak Match Damage',
    currentRecord: 3120,
    formattedRecord: '3,120 DMG',
    unit: 'DMG',
    previousRecord: 2850,
    beatenBy: 270,
    achievedDate: '2026-08-14',
    achievedSessionId: 'ses_0088',
    sessionMode: 'Ranked 5v5',
    map: 'Neon Haven',
    nearMiss: {
      recentValue: 3050,
      difference: 70,
      date: '2026-09-28',
      sessionId: 'ses_0176'
    }
  },
  {
    id: 'pr_kd',
    category: 'kd',
    title: 'Highest Single-Match K/D',
    currentRecord: 4.25,
    formattedRecord: '4.25 K/D',
    unit: 'ratio',
    previousRecord: 3.40,
    beatenBy: 0.85,
    achievedDate: '2026-09-02',
    achievedSessionId: 'ses_0132',
    sessionMode: 'Ranked 5v5',
    map: 'Sub-Zero Base',
  },
  {
    id: 'pr_kills',
    category: 'kills',
    title: 'Most Frags in Match',
    currentRecord: 34,
    formattedRecord: '34 Kills',
    unit: 'kills',
    previousRecord: 29,
    beatenBy: 5,
    achievedDate: '2026-07-22',
    achievedSessionId: 'ses_0045',
    sessionMode: 'Deathmatch',
    map: 'Orbital Ring'
  },
  {
    id: 'pr_accuracy',
    category: 'accuracy',
    title: 'Best Headshot Accuracy',
    currentRecord: 56.4,
    formattedRecord: '56.4%',
    unit: '%',
    previousRecord: 51.0,
    beatenBy: 5.4,
    achievedDate: '2026-09-18',
    achievedSessionId: 'ses_0160',
    sessionMode: 'Ranked 5v5',
    map: 'Canyon Siphon'
  },
  {
    id: 'pr_streak',
    category: 'win_streak',
    title: 'Longest Win Streak',
    currentRecord: 7,
    formattedRecord: '7 Matches',
    unit: 'wins',
    previousRecord: 5,
    beatenBy: 2,
    achievedDate: '2026-09-10',
    achievedSessionId: 'ses_0148',
    sessionMode: 'Ranked 5v5',
    map: 'All Maps'
  }
];

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'ms_matches',
    title: 'Century Veteran',
    description: 'Deploy into 100 competitive combat sessions',
    category: 'deployment',
    currentProgress: 182,
    targetValue: 200,
    unit: 'matches',
    percentComplete: 91,
    isCompleted: false,
    badge: 'CENTURY_II'
  },
  {
    id: 'ms_headshots',
    title: 'Precision Specialist V',
    description: 'Hit 50 Longshot Headshots with Sniper or DMR',
    category: 'weaponry',
    currentProgress: 48,
    targetValue: 50,
    unit: 'headshots',
    percentComplete: 96,
    isCompleted: false,
    badge: 'DEATH_CROSS'
  },
  {
    id: 'ms_playtime',
    title: 'Tactical Dedication',
    description: 'Log 100 hours of active combat simulation',
    category: 'endurance',
    currentProgress: 104.5,
    targetValue: 100,
    unit: 'hours',
    percentComplete: 100,
    isCompleted: true,
    completedDate: '2026-09-21',
    badge: 'TIME_WARP'
  },
  {
    id: 'ms_srank',
    title: 'Apex Vanguard',
    description: 'Achieve S-Rank (2800+ Elo) in Season 04',
    category: 'ranking',
    currentProgress: 2840,
    targetValue: 2800,
    unit: 'Elo',
    percentComplete: 100,
    isCompleted: true,
    completedDate: '2026-09-24',
    badge: 'VORTEX_ELITE'
  }
];

export const INITIAL_GOALS: PlayerGoal[] = [
  {
    id: 'goal_1',
    title: 'Cross 45% Weapon Accuracy',
    metric: 'accuracy',
    targetValue: 45.0,
    currentValue: 42.6,
    unit: '%',
    deadline: '2026-10-15',
    status: 'active',
    createdBy: 'player'
  },
  {
    id: 'goal_2',
    title: 'Maintain 3+ Sessions per Week',
    metric: 'weekly_hours',
    targetValue: 6.0,
    currentValue: 4.8,
    unit: 'hrs',
    deadline: '2026-10-05',
    status: 'active',
    createdBy: 'player'
  },
  {
    id: 'goal_sug_1',
    title: 'Push K/D to 2.00 on Phantom-X',
    metric: 'kd',
    targetValue: 2.00,
    currentValue: 1.84,
    unit: 'ratio',
    deadline: '2026-10-20',
    status: 'active',
    createdBy: 'suggested',
    suggestedReason: 'Based on your 2.45 K/D with Phantom-X over the last 5 evening sessions.'
  }
];

export const INITIAL_STREAK: StreakData = {
  currentStreakDays: 14,
  longestStreakDays: 22,
  freezesRemaining: 1, // 1 free miss per week (Forgiving streak system)
  maxFreezes: 2,
  freezesUsedThisWeek: 0,
  lastActiveLocalDate: '2026-09-29',
  wasForgiven: false,
  welcomeBackMessage: 'Welcome back! Your streak was preserved with a weekly freeze.'
};

export const INITIAL_INSIGHTS: InsightRule[] = [
  {
    id: 'ins_tod',
    type: 'time_of_day',
    headline: 'Your accuracy is up 8.4% this week — mostly from evening sessions.',
    narrative: 'When you play between 19:00 and 23:00, your crosshair stabilization is noticeably sharper (+8.4% accuracy, 68% win rate) compared to afternoon matches (46% win rate).',
    actionableTip: 'Schedule ranked climb sessions during your prime evening reflex window.',
    evidence: {
      label: 'Evening vs Afternoon Accuracy',
      valueA: '45.2% (Evening)',
      valueB: '36.8% (Afternoon)',
      sampleSize: 28,
      timeframe: 'Past 14 Days'
    },
    dismissed: false,
    iconName: 'SunMedium'
  },
  {
    id: 'ins_tilt',
    type: 'tilt_warning',
    headline: 'Win rate drops 28% after 3 consecutive losses.',
    narrative: 'Analysis of session sequences reveals that continuing to queue immediately after back-to-back defeats results in rushed engagements and early deaths.',
    actionableTip: 'Taking a 15-minute breather or switching to a warm-up deathmatch resets mental fatigue.',
    evidence: {
      label: 'Performance Post 3-Loss Run',
      valueA: '32.1% Win Rate',
      valueB: '61.5% Baseline Win Rate',
      sampleSize: 18,
      timeframe: 'Season 04'
    },
    dismissed: false,
    iconName: 'ShieldAlert'
  },
  {
    id: 'ins_wep',
    type: 'weapon_synergy',
    headline: 'Phantom-X headshot multiplier outpaces all other rifles.',
    narrative: 'Your critical hit conversion rate on Phantom-X stands at 38.2%, yielding +340 more damage per round than with Arc-Viper.',
    actionableTip: 'Prioritize Phantom-X purchases during defensive half buys.',
    evidence: {
      label: 'Phantom-X vs Arc-Viper Damage/Round',
      valueA: '610 DMG (Phantom-X)',
      valueB: '430 DMG (Arc-Viper)',
      sampleSize: 54,
      timeframe: 'Last 30 Days'
    },
    dismissed: false,
    iconName: 'Crosshair'
  },
  {
    id: 'ins_fatigue',
    type: 'fatigue',
    headline: 'Diminishing returns kick in after session 4 in a single day.',
    narrative: 'Across your 6-month history, matches 1 to 3 average a 1.94 K/D. On days where you play 5 or more matches, K/D drops to 1.18.',
    actionableTip: 'Cap daily competitive blocks at 3-4 matches for optimal rank efficiency.',
    evidence: {
      label: 'Match 1-3 K/D vs Match 5+ K/D',
      valueA: '1.94 K/D (Matches 1-3)',
      valueB: '1.18 K/D (Matches 5+)',
      sampleSize: 34,
      timeframe: 'Last 60 Days'
    },
    dismissed: false,
    iconName: 'Clock'
  }
];

export const INITIAL_WEEKLY_RECAP: WeeklyRecap = {
  weekLabel: 'Week 39 // Sept 22 - Sept 29',
  dateRange: 'Sept 22, 2026 – Sept 29, 2026',
  topMoment: {
    title: 'Clutch Ace on Neon Haven',
    description: 'Secured 5 rapid elimination frags on match point to defeat Ranked Top 100 squad.',
    sessionId: 'ses_0176'
  },
  biggestImprovement: {
    metric: 'Weapon Accuracy',
    delta: '+8.4%',
    context: 'Jumped from 34.2% to 42.6% over 18 ranked matches'
  },
  recordSet: {
    title: 'Peak Match Damage Near Miss',
    val: '3,050 DMG (Top 1% season best)'
  },
  totalPlaytimeHours: 14.8,
  matchesPlayed: 24,
  wins: 16,
  winRate: 66.7,
  mvpWeapon: 'Phantom-X'
};

export const INITIAL_ANNOTATIONS: PlayerAnnotation[] = [
  {
    id: 'ann_1',
    date: '2026-09-20',
    note: 'Switched to 800 DPI (0.35 in-game sens) & glass mousepad',
    category: 'gear'
  },
  {
    id: 'ann_2',
    date: '2026-09-08',
    note: 'Rebound flashbang and jump-throw to mouse thumb buttons',
    category: 'settings'
  }
];

export const INITIAL_FRIEND_COMPARISON: FriendComparison = {
  friendName: 'GHOST_RUNNER',
  friendAvatar: 'Ghost',
  friendRank: 'VORTEX // S-TIER',
  sharedSessionsCount: 38,
  metrics: [
    { name: 'Win Rate (Duo)', playerVal: '68.4%', friendVal: '68.4%', playerAdvantage: null },
    { name: 'Average K/D', playerVal: '1.84', friendVal: '1.71', playerAdvantage: true },
    { name: 'Weapon Accuracy', playerVal: '42.6%', friendVal: '45.1%', playerAdvantage: false },
    { name: 'Avg Damage/Match', playerVal: '2,410', friendVal: '2,290', playerAdvantage: true },
    { name: 'Clutches Won', playerVal: '18', friendVal: '14', playerAdvantage: true }
  ]
};
