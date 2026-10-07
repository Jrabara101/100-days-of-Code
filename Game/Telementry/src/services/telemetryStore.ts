import { useState, useEffect, useMemo } from 'react';
import { 
  Session, 
  PlayerProfile, 
  PeriodFilter, 
  ProfileScenario, 
  CoreStatMetric, 
  DailySummary, 
  PersonalRecord, 
  Milestone, 
  PlayerGoal, 
  StreakData, 
  InsightRule, 
  WeeklyRecap, 
  PlayerAnnotation, 
  FriendComparison,
  StatSparkPoint,
  MatchResult
} from '../types/telemetry';
import { 
  DEFAULT_PLAYER, 
  generateRealistic6MonthSessions, 
  generateLowDataSessions, 
  INITIAL_RECORDS, 
  INITIAL_MILESTONES, 
  INITIAL_GOALS, 
  INITIAL_STREAK, 
  INITIAL_INSIGHTS, 
  INITIAL_WEEKLY_RECAP, 
  INITIAL_ANNOTATIONS, 
  INITIAL_FRIEND_COMPARISON 
} from './seedData';

const STORAGE_KEY_SCENARIO = 'chrono_telemetry_scenario';
const STORAGE_KEY_PERIOD = 'chrono_telemetry_period';
const STORAGE_KEY_GOALS = 'chrono_telemetry_goals';
const STORAGE_KEY_ANNOTATIONS = 'chrono_telemetry_annotations';
const STORAGE_KEY_INSIGHTS = 'chrono_telemetry_insights';
const STORAGE_KEY_PROFILE = 'chrono_telemetry_profile';

export function useTelemetryStore() {
  // Scenario state (Veteran / Low Data / Empty)
  const [scenario, setScenario] = useState<ProfileScenario>(() => {
    return (localStorage.getItem(STORAGE_KEY_SCENARIO) as ProfileScenario) || 'veteran';
  });

  // Period filter ('7d' | '30d' | 'season' | 'all')
  const [period, setPeriod] = useState<PeriodFilter>(() => {
    // Check URL search params first, fallback to localStorage
    const params = new URLSearchParams(window.location.search);
    const p = params.get('period') as PeriodFilter;
    if (p && ['7d', '30d', 'season', 'all'].includes(p)) return p;
    return (localStorage.getItem(STORAGE_KEY_PERIOD) as PeriodFilter) || '30d';
  });

  // Player profile state
  const [player, setPlayer] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
    return saved ? JSON.parse(saved) : DEFAULT_PLAYER;
  });

  // Selected session for drawer inspection
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('session');
  });

  // Active stat for "How was this calculated?" modal
  const [explainingStatId, setExplainingStatId] = useState<CoreStatMetric['id'] | null>(null);

  // Table Twin modal state (for chart accessibility)
  const [tableTwinOpen, setTableTwinOpen] = useState(false);
  const [tableTwinTarget, setTableTwinTarget] = useState<'flight_recorder' | 'heatmap' | 'core_stats' | null>(null);

  // Why drawer trigger for the Hero Insight
  const [insightWhyDrawerOpen, setInsightWhyDrawerOpen] = useState(false);

  // Playtime awareness line visibility toggle (Decision 5: gentle, optional, player can hide)
  const [showPlaytimeAwareness, setShowPlaytimeAwareness] = useState<boolean>(true);

  // Goals state
  const [goals, setGoals] = useState<PlayerGoal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GOALS);
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  // Annotations state
  const [annotations, setAnnotations] = useState<PlayerAnnotation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ANNOTATIONS);
    return saved ? JSON.parse(saved) : INITIAL_ANNOTATIONS;
  });

  // Insights state
  const [insights, setInsights] = useState<InsightRule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INSIGHTS);
    return saved ? JSON.parse(saved) : INITIAL_INSIGHTS;
  });

  // Streak state
  const [streak, setStreak] = useState<StreakData>(INITIAL_STREAK);

  // Records & Milestones
  const [records] = useState<PersonalRecord[]>(INITIAL_RECORDS);
  const [milestones] = useState<Milestone[]>(INITIAL_MILESTONES);
  const [weeklyRecap] = useState<WeeklyRecap>(INITIAL_WEEKLY_RECAP);
  const [friendComparison] = useState<FriendComparison>(INITIAL_FRIEND_COMPARISON);

  // Active date filter (from Flight-recorder strip or Heatmap click)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('date');
  });

  // Sync state to LocalStorage and URL params
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCENARIO, scenario);
  }, [scenario]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PERIOD, period);
    const url = new URL(window.location.href);
    url.searchParams.set('period', period);
    if (selectedSessionId) {
      url.searchParams.set('session', selectedSessionId);
    } else {
      url.searchParams.delete('session');
    }
    if (selectedDateFilter) {
      url.searchParams.set('date', selectedDateFilter);
    } else {
      url.searchParams.delete('date');
    }
    window.history.replaceState({}, '', url.toString());
  }, [period, selectedSessionId, selectedDateFilter]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(annotations));
  }, [annotations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INSIGHTS, JSON.stringify(insights));
  }, [insights]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(player));
  }, [player]);

  // Load all sessions based on current scenario
  const allSessions: Session[] = useMemo(() => {
    if (scenario === 'empty') return [];
    if (scenario === 'low_data') return generateLowDataSessions();
    return generateRealistic6MonthSessions();
  }, [scenario]);

  // Calculate cutoff date for selected period filter
  const { currentPeriodSessions, previousPeriodSessions, daysCount } = useMemo(() => {
    if (allSessions.length === 0) {
      return { currentPeriodSessions: [], previousPeriodSessions: [], daysCount: 30 };
    }

    // Anchor calculation to newest session timestamp in dataset
    const newestTime = new Date(allSessions[0].startTime).getTime();

    let durationDays = 30;
    if (period === '7d') durationDays = 7;
    else if (period === '30d') durationDays = 30;
    else if (period === 'season') durationDays = 90;
    else if (period === 'all') durationDays = 180;

    const currentCutoff = newestTime - durationDays * 24 * 60 * 60 * 1000;
    const previousCutoff = currentCutoff - durationDays * 24 * 60 * 60 * 1000;

    const current = allSessions.filter(s => new Date(s.startTime).getTime() >= currentCutoff);
    const previous = allSessions.filter(
      s => new Date(s.startTime).getTime() < currentCutoff && new Date(s.startTime).getTime() >= previousCutoff
    );

    return {
      currentPeriodSessions: current,
      previousPeriodSessions: previous,
      daysCount: durationDays
    };
  }, [allSessions, period]);

  // Precompute Daily Summaries across the last 30 days for Flight-Recorder Strip
  const flightRecorderDays: DailySummary[] = useMemo(() => {
    if (allSessions.length === 0) return [];

    const days: DailySummary[] = [];
    const refDate = new Date(allSessions[0].startTime);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(refDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];

      const daySessions = allSessions.filter(s => s.startTime.startsWith(dateStr));

      if (daySessions.length === 0) {
        days.push({
          date: dateStr,
          playtimeHours: 0,
          sessionCount: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          avgKd: 0,
          avgAccuracy: 0,
          avgDamage: 0,
          dominantResult: 'REST',
          isStreakActive: false
        });
      } else {
        const wins = daySessions.filter(s => s.result === 'VICTORY').length;
        const losses = daySessions.filter(s => s.result === 'DEFEAT').length;
        const totalDurationMins = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
        const totalKills = daySessions.reduce((acc, s) => acc + s.kills, 0);
        const totalDeaths = daySessions.reduce((acc, s) => acc + s.deaths, 0);
        const avgAcc = daySessions.reduce((acc, s) => acc + s.accuracyPercent, 0) / daySessions.length;
        const avgDmg = daySessions.reduce((acc, s) => acc + s.damageDealt, 0) / daySessions.length;
        const hasPr = daySessions.some(s => s.notableBadges.includes('PR SET'));

        days.push({
          date: dateStr,
          playtimeHours: Number((totalDurationMins / 60).toFixed(1)),
          sessionCount: daySessions.length,
          wins,
          losses,
          winRate: Number(((wins / daySessions.length) * 100).toFixed(1)),
          avgKd: Number((totalKills / Math.max(1, totalDeaths)).toFixed(2)),
          avgAccuracy: Number(avgAcc.toFixed(1)),
          avgDamage: Math.round(avgDmg),
          dominantResult: wins >= losses ? 'VICTORY' : 'DEFEAT',
          notableEvent: hasPr ? 'Personal Record Set!' : undefined,
          isStreakActive: true
        });
      }
    }
    return days;
  }, [allSessions]);

  // Precompute 52-Week Contribution Heatmap (364 days)
  const heatmapDays = useMemo(() => {
    if (allSessions.length === 0) return [];

    const map = new Map<string, { count: number; hours: number; wins: number }>();
    allSessions.forEach(s => {
      const dateKey = s.startTime.split('T')[0];
      const entry = map.get(dateKey) || { count: 0, hours: 0, wins: 0 };
      entry.count += 1;
      entry.hours += s.durationMinutes / 60;
      if (s.result === 'VICTORY') entry.wins += 1;
      map.set(dateKey, entry);
    });

    const days = [];
    const ref = new Date(allSessions[0].startTime);
    for (let i = 363; i >= 0; i--) {
      const d = new Date(ref.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const data = map.get(dateStr) || { count: 0, hours: 0, wins: 0 };
      days.push({
        date: dateStr,
        count: data.count,
        hours: Number(data.hours.toFixed(1)),
        wins: data.wins,
        dayOfWeek: d.getDay()
      });
    }
    return days;
  }, [allSessions]);

  // Compute Core Metrics with truthful deltas & sparklines
  const coreStats: CoreStatMetric[] = useMemo(() => {
    const hasEnoughData = currentPeriodSessions.length >= 5;
    const hasPreviousData = previousPeriodSessions.length >= 5;

    // 1. K/D Ratio
    const currKills = currentPeriodSessions.reduce((acc, s) => acc + s.kills, 0);
    const currDeaths = currentPeriodSessions.reduce((acc, s) => acc + s.deaths, 0);
    const currKd = currentPeriodSessions.length > 0 ? Number((currKills / Math.max(1, currDeaths)).toFixed(2)) : 0;

    const prevKills = previousPeriodSessions.reduce((acc, s) => acc + s.kills, 0);
    const prevDeaths = previousPeriodSessions.reduce((acc, s) => acc + s.deaths, 0);
    const prevKd = previousPeriodSessions.length > 0 ? Number((prevKills / Math.max(1, prevDeaths)).toFixed(2)) : 0;

    const kdDelta = hasEnoughData && hasPreviousData ? Number((currKd - prevKd).toFixed(2)) : 0;
    const kdDeltaPercent = hasEnoughData && hasPreviousData && prevKd > 0 ? Number((((currKd - prevKd) / prevKd) * 100).toFixed(1)) : 0;

    // 2. Weapon Accuracy
    const currAcc = currentPeriodSessions.length > 0 
      ? Number((currentPeriodSessions.reduce((acc, s) => acc + s.accuracyPercent, 0) / currentPeriodSessions.length).toFixed(1)) 
      : 0;
    const prevAcc = previousPeriodSessions.length > 0 
      ? Number((previousPeriodSessions.reduce((acc, s) => acc + s.accuracyPercent, 0) / previousPeriodSessions.length).toFixed(1)) 
      : 0;
    const accDelta = hasEnoughData && hasPreviousData ? Number((currAcc - prevAcc).toFixed(1)) : 0;
    const accDeltaPercent = hasEnoughData && hasPreviousData && prevAcc > 0 ? Number((((currAcc - prevAcc) / prevAcc) * 100).toFixed(1)) : 0;

    // 3. Win Rate
    const currWins = currentPeriodSessions.filter(s => s.result === 'VICTORY').length;
    const currWinRate = currentPeriodSessions.length > 0 
      ? Number(((currWins / currentPeriodSessions.length) * 100).toFixed(1)) 
      : 0;
    const prevWins = previousPeriodSessions.filter(s => s.result === 'VICTORY').length;
    const prevWinRate = previousPeriodSessions.length > 0 
      ? Number(((prevWins / previousPeriodSessions.length) * 100).toFixed(1)) 
      : 0;
    const wrDelta = hasEnoughData && hasPreviousData ? Number((currWinRate - prevWinRate).toFixed(1)) : 0;
    const wrDeltaPercent = hasEnoughData && hasPreviousData && prevWinRate > 0 ? Number((((currWinRate - prevWinRate) / prevWinRate) * 100).toFixed(1)) : 0;

    // 4. Avg Damage
    const currDamage = currentPeriodSessions.length > 0 
      ? Math.round(currentPeriodSessions.reduce((acc, s) => acc + s.damageDealt, 0) / currentPeriodSessions.length) 
      : 0;
    const prevDamage = previousPeriodSessions.length > 0 
      ? Math.round(previousPeriodSessions.reduce((acc, s) => acc + s.damageDealt, 0) / previousPeriodSessions.length) 
      : 0;
    const dmgDelta = hasEnoughData && hasPreviousData ? currDamage - prevDamage : 0;
    const dmgDeltaPercent = hasEnoughData && hasPreviousData && prevDamage > 0 ? Number((((currDamage - prevDamage) / prevDamage) * 100).toFixed(1)) : 0;

    // 7-Point Sparklines
    const generateSparkline = (getValue: (s: Session) => number): StatSparkPoint[] => {
      if (currentPeriodSessions.length === 0) return [];
      const chronological = [...currentPeriodSessions].reverse();
      const pointsCount = Math.min(7, chronological.length);
      const step = Math.max(1, Math.floor(chronological.length / pointsCount));
      const points: StatSparkPoint[] = [];

      for (let i = 0; i < pointsCount; i++) {
        const idx = Math.min(chronological.length - 1, i * step);
        const session = chronological[idx];
        points.push({
          date: session.startTime.split('T')[0],
          value: getValue(session)
        });
      }
      return points;
    };

    const contributingSessionsFor = (formatVal: (s: Session) => string) => {
      return currentPeriodSessions.slice(0, 5).map(s => ({
        id: s.id,
        date: s.startTime.split('T')[0],
        value: formatVal(s),
        result: s.result
      }));
    };

    return [
      {
        id: 'kd',
        name: 'Kill / Death Ratio',
        currentValue: currKd,
        formattedValue: currKd > 0 ? currKd.toFixed(2) : '—',
        previousValue: prevKd,
        delta: kdDelta,
        deltaPercent: kdDeltaPercent,
        isPositive: kdDelta >= 0,
        unit: 'ratio',
        sparkline: generateSparkline(s => s.kdRatio),
        formula: 'Total Confirmed Eliminations ÷ Total Deaths across evaluated sessions',
        explanation: 'Reflects your combat efficiency per life. Unlike raw kills, this measures positional discipline and survival impact.',
        sessionsCount: currentPeriodSessions.length,
        contributingSessions: contributingSessionsFor(s => `${s.kdRatio.toFixed(2)} (${s.kills}K / ${s.deaths}D)`)
      },
      {
        id: 'accuracy',
        name: 'Weapon Accuracy',
        currentValue: currAcc,
        formattedValue: currAcc > 0 ? `${currAcc}%` : '—',
        previousValue: prevAcc,
        delta: accDelta,
        deltaPercent: accDeltaPercent,
        isPositive: accDelta >= 0,
        unit: '%',
        sparkline: generateSparkline(s => s.accuracyPercent),
        formula: '(Rounds Hit ÷ Rounds Fired) × 100 across primary weapons',
        explanation: 'Measures shot placement and crosshair micro-adjustments. Derived directly from tick-by-tick shot hitboxes.',
        sessionsCount: currentPeriodSessions.length,
        contributingSessions: contributingSessionsFor(s => `${s.accuracyPercent}% (${s.primaryWeapon})`)
      },
      {
        id: 'win_rate',
        name: 'Match Win Rate',
        currentValue: currWinRate,
        formattedValue: currWinRate > 0 ? `${currWinRate}%` : '—',
        previousValue: prevWinRate,
        delta: wrDelta,
        deltaPercent: wrDeltaPercent,
        isPositive: wrDelta >= 0,
        unit: '%',
        sparkline: generateSparkline(s => s.result === 'VICTORY' ? 100 : 0),
        formula: '(Victories ÷ Total Completed Matches) × 100',
        explanation: 'The ultimate indicator of match closing ability. Drawn from validated match results without counting disconnected rounds.',
        sessionsCount: currentPeriodSessions.length,
        contributingSessions: contributingSessionsFor(s => `${s.result} (${s.roundsWon}-${s.roundsLost})`)
      },
      {
        id: 'damage',
        name: 'Avg Match Damage',
        currentValue: currDamage,
        formattedValue: currDamage > 0 ? currDamage.toLocaleString() : '—',
        previousValue: prevDamage,
        delta: dmgDelta,
        deltaPercent: dmgDeltaPercent,
        isPositive: dmgDelta >= 0,
        unit: 'DMG',
        sparkline: generateSparkline(s => s.damageDealt),
        formula: 'Sum of all validated damage dealt to enemy operators ÷ Matches played',
        explanation: 'Raw combat pressure inflicted on the opposing squad. Filters out friendly fire and post-round overkill damage.',
        sessionsCount: currentPeriodSessions.length,
        contributingSessions: contributingSessionsFor(s => `${s.damageDealt.toLocaleString()} DMG`)
      }
    ];
  }, [currentPeriodSessions, previousPeriodSessions]);

  // Total weekly playtime for the Playtime Awareness line
  const weeklyPlaytimeHours = useMemo(() => {
    const now = allSessions.length > 0 ? new Date(allSessions[0].startTime).getTime() : Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const weekSessions = allSessions.filter(s => new Date(s.startTime).getTime() >= sevenDaysAgo);
    const mins = weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    return Number((mins / 60).toFixed(1));
  }, [allSessions]);

  // Filtered session list for Activity tab
  const getFilteredSessions = (filters: {
    mode?: string;
    result?: string;
    searchQuery?: string;
    date?: string | null;
  }) => {
    return allSessions.filter(session => {
      if (filters.mode && filters.mode !== 'all' && session.mode !== filters.mode) return false;
      if (filters.result && filters.result !== 'all' && session.result !== filters.result) return false;
      if (filters.date && !session.startTime.startsWith(filters.date)) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesMap = session.map.toLowerCase().includes(q);
        const matchesWeapon = session.primaryWeapon.toLowerCase().includes(q);
        const matchesMode = session.mode.toLowerCase().includes(q);
        if (!matchesMap && !matchesWeapon && !matchesMode) return false;
      }
      return true;
    });
  };

  // Selected session object for detailed inspection
  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return allSessions.find(s => s.id === selectedSessionId) || null;
  }, [selectedSessionId, allSessions]);

  // Goal management
  const addGoal = (newGoal: Omit<PlayerGoal, 'id' | 'currentValue' | 'status' | 'createdBy'>) => {
    let currentVal = 0;
    if (newGoal.metric === 'accuracy') currentVal = coreStats.find(c => c.id === 'accuracy')?.currentValue || 0;
    else if (newGoal.metric === 'kd') currentVal = coreStats.find(c => c.id === 'kd')?.currentValue || 0;
    else if (newGoal.metric === 'win_rate') currentVal = coreStats.find(c => c.id === 'win_rate')?.currentValue || 0;
    else if (newGoal.metric === 'damage') currentVal = coreStats.find(c => c.id === 'damage')?.currentValue || 0;
    else if (newGoal.metric === 'weekly_hours') currentVal = weeklyPlaytimeHours;

    const goal: PlayerGoal = {
      ...newGoal,
      id: `goal_${Date.now()}`,
      currentValue: currentVal,
      status: 'active',
      createdBy: 'player'
    };
    setGoals(prev => [goal, ...prev]);
  };

  const deleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const toggleGoalStatus = (goalId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          status: g.status === 'completed' ? 'active' : 'completed'
        };
      }
      return g;
    }));
  };

  // Annotations
  const addAnnotation = (date: string, note: string, category: PlayerAnnotation['category']) => {
    const ann: PlayerAnnotation = {
      id: `ann_${Date.now()}`,
      date,
      note,
      category
    };
    setAnnotations(prev => [ann, ...prev]);
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  // Streak forgiveness action
  const useStreakFreeze = () => {
    if (streak.freezesRemaining > 0) {
      setStreak(prev => ({
        ...prev,
        freezesRemaining: prev.freezesRemaining - 1,
        freezesUsedThisWeek: prev.freezesUsedThisWeek + 1,
        wasForgiven: true,
        welcomeBackMessage: 'Streak freeze consumed! Your daily streak remains intact.'
      }));
    }
  };

  // Data Export functions
  const exportAsJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      player,
      totalSessions: allSessions.length,
      sessions: allSessions,
      personalRecords: records,
      milestones,
      goals,
      annotations
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronostrike_telemetry_${player.displayName}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    if (allSessions.length === 0) return;
    const headers = ['SessionID', 'Date', 'Mode', 'Map', 'Result', 'Kills', 'Deaths', 'Assists', 'KD_Ratio', 'Accuracy_Percent', 'Damage', 'Weapon', 'Duration_Mins', 'Elo_Change'];
    const rows = allSessions.map(s => [
      s.id,
      s.startTime,
      `"${s.mode}"`,
      `"${s.map}"`,
      s.result,
      s.kills,
      s.deaths,
      s.assists,
      s.kdRatio,
      s.accuracyPercent,
      s.damageDealt,
      `"${s.primaryWeapon}"`,
      s.durationMinutes,
      s.eloChange
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronostrike_sessions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    scenario,
    setScenario,
    period,
    setPeriod,
    player,
    setPlayer,
    allSessions,
    currentPeriodSessions,
    previousPeriodSessions,
    flightRecorderDays,
    heatmapDays,
    coreStats,
    weeklyPlaytimeHours,
    selectedSessionId,
    setSelectedSessionId,
    selectedSession,
    selectedDateFilter,
    setSelectedDateFilter,
    explainingStatId,
    setExplainingStatId,
    tableTwinOpen,
    setTableTwinOpen,
    tableTwinTarget,
    setTableTwinTarget,
    insightWhyDrawerOpen,
    setInsightWhyDrawerOpen,
    showPlaytimeAwareness,
    setShowPlaytimeAwareness,
    goals,
    addGoal,
    deleteGoal,
    toggleGoalStatus,
    streak,
    useStreakFreeze,
    records,
    milestones,
    insights,
    setInsights,
    weeklyRecap,
    annotations,
    addAnnotation,
    deleteAnnotation,
    friendComparison,
    getFilteredSessions,
    exportAsJSON,
    exportAsCSV
  };
}
