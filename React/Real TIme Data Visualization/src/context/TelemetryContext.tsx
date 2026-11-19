import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  CausalEventPin,
  ChartLens,
  DeltaMeasurement,
  HypothesisStickyNote,
  MetricId,
  MetricMeta,
  PerspectiveLens,
  ShiftHighlight,
  TelemetryPoint,
  WhatIfScenario,
  WidgetSize
} from '../types/telemetry';
import { telemetryEngine, TelemetrySnapshot } from '../services/telemetryService';
import { downsampleLTTB } from '../engine/lttb';

export const METRIC_METAS: Record<MetricId, MetricMeta> = {
  checkout_velocity: {
    id: 'checkout_velocity',
    name: 'Checkout Velocity',
    unit: '/m',
    prefix: '$',
    format: (val: number) => `$${Math.round(val).toLocaleString()}/m`,
    kicker: 'LIVE CHECKOUT VELOCITY',
    color: '#38BDF8', // Cyan
    secondaryColor: '#0284C7',
    goalTarget: 5000,
    goalUnit: '$/min'
  },
  active_sessions: {
    id: 'active_sessions',
    name: 'Active Sessions',
    unit: 'users',
    prefix: '',
    format: (val: number) => `${Math.round(val).toLocaleString()} users`,
    kicker: 'GLOBAL CONCURRENT SESSIONS',
    color: '#A855F7', // Violet
    secondaryColor: '#7E22CE',
    goalTarget: 32000,
    goalUnit: 'users'
  },
  api_latency: {
    id: 'api_latency',
    name: 'P95 API Latency',
    unit: 'ms',
    prefix: '',
    format: (val: number) => `${Math.round(val)}ms`,
    kicker: 'GATEWAY P95 LATENCY',
    color: '#2DD4BF', // Teal
    secondaryColor: '#0F766E',
    goalTarget: 75,
    goalUnit: 'ms'
  },
  error_rate: {
    id: 'error_rate',
    name: 'Error Envelope',
    unit: '%',
    prefix: '',
    format: (val: number) => `${val.toFixed(2)}%`,
    kicker: 'RELIABILITY & ANOMALY ENVELOPE',
    color: '#F43F5E', // Rose
    secondaryColor: '#BE123C',
    goalTarget: 0.1,
    goalUnit: '%'
  }
};

interface TelemetryContextType {
  // Streaming state
  isStreaming: boolean;
  toggleStreaming: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
  isInspectionLocked: boolean;
  setInspectionLocked: (locked: boolean) => void;
  bufferedTicksCount: number;

  // Lenses & View
  perspectiveLens: PerspectiveLens;
  setPerspectiveLens: (lens: PerspectiveLens) => void;
  primaryMetricId: MetricId;
  setPrimaryMetricId: (id: MetricId) => void;
  chartLens: ChartLens;
  setChartLens: (lens: ChartLens) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Time-Travel DVR Scrubber
  playbackMode: 'live' | 'dvr';
  setPlaybackMode: (mode: 'live' | 'dvr') => void;
  timeWindowMinutes: number;
  setTimeWindowMinutes: (mins: number) => void;
  dvrPosition: number; // 0 to 100% of available timeline
  setDvrPosition: (pos: number) => void;
  rewindMinutes: (mins: number) => void;

  // Crosshair Synchronization
  hoveredTimestamp: number | null;
  setHoveredTimestamp: (ts: number | null) => void;

  // Delta measurement span
  deltaMeasurement: DeltaMeasurement | null;
  setDeltaMeasurement: (dm: DeltaMeasurement | null) => void;

  // Causal events & Hypotheses
  causalEvents: CausalEventPin[];
  injectNewEvent: (title: string, category: CausalEventPin['category'], metricId: MetricId) => void;
  selectedEvent: CausalEventPin | null;
  setSelectedEvent: (ev: CausalEventPin | null) => void;
  hypothesisNotes: HypothesisStickyNote[];
  addHypothesis: (metricId: MetricId, note: string, author?: string) => void;

  // What-If Simulator
  whatIfScenario: WhatIfScenario;
  updateWhatIfScenario: (update: Partial<WhatIfScenario>) => void;
  resetWhatIfScenario: () => void;

  // Anomaly drill-down filter
  selectedSegmentFilter: string | null;
  setSelectedSegmentFilter: (filter: string | null) => void;

  // Widget sizing
  widgetSizes: Record<string, WidgetSize>;
  cycleWidgetSize: (widgetId: string) => void;

  // Modals & Drawers
  isSinceLastCheckedOpen: boolean;
  setIsSinceLastCheckedOpen: (open: boolean) => void;
  isClipModalOpen: boolean;
  setIsClipModalOpen: (open: boolean) => void;
  clipTargetWidget: { title: string; subtitle: string; metricId: MetricId } | null;
  triggerClipModal: (target: { title: string; subtitle: string; metricId: MetricId }) => void;
  shiftHighlights: ShiftHighlight[];

  // Data helpers
  getSeriesData: (metricId: MetricId, downsampleThreshold?: number) => TelemetryPoint[];
  getLatestPoint: (metricId: MetricId) => TelemetryPoint | undefined;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, setTickCounter] = useState(0);
  const [isStreaming, setIsStreaming] = useState(true);
  const [speed, setSpeedState] = useState(1);
  const [isInspectionLocked, setIsInspectionLocked] = useState(false);
  const [bufferedTicksCount, setBufferedTicksCount] = useState(0);

  const [perspectiveLens, setPerspectiveLens] = useState<PerspectiveLens>('executive');
  const [primaryMetricId, setPrimaryMetricId] = useState<MetricId>('checkout_velocity');
  const [chartLens, setChartLens] = useState<ChartLens>('continuous_trend');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [playbackMode, setPlaybackMode] = useState<'live' | 'dvr'>('live');
  const [timeWindowMinutes, setTimeWindowMinutes] = useState(15);
  const [dvrPosition, setDvrPosition] = useState(100);

  const [hoveredTimestamp, setHoveredTimestamp] = useState<number | null>(null);
  const [deltaMeasurement, setDeltaMeasurement] = useState<DeltaMeasurement | null>(null);

  const [causalEvents, setCausalEvents] = useState<CausalEventPin[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CausalEventPin | null>(null);
  const [hypothesisNotes, setHypothesisNotes] = useState<HypothesisStickyNote[]>([]);

  const [whatIfScenario, setWhatIfScenario] = useState<WhatIfScenario>({
    trafficGrowth: 15,
    conversionLift: 8,
    serverCap: 0,
    active: false
  });

  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState<string | null>(null);

  const [widgetSizes, setWidgetSizes] = useState<Record<string, WidgetSize>>({
    checkout_velocity: 'standard',
    active_sessions: 'standard',
    api_latency: 'standard',
    error_rate: 'standard',
    master_chart: 'standard',
    anomaly_rail: 'standard'
  });

  const [isSinceLastCheckedOpen, setIsSinceLastCheckedOpen] = useState(false);
  const [isClipModalOpen, setIsClipModalOpen] = useState(false);
  const [clipTargetWidget, setClipTargetWidget] = useState<{ title: string; subtitle: string; metricId: MetricId } | null>(null);

  // Shift highlights for "Since You Last Checked"
  const shiftHighlights: ShiftHighlight[] = useMemo(() => [
    {
      id: 'shift-1',
      title: 'Checkout speed improved 22%',
      description: 'Rollout of 1-tap Apple Pay flow reduced mean checkout drop-off by 22% in Western Europe.',
      timestamp: 'Yesterday at 5:40 PM',
      direction: 'up',
      metricId: 'checkout_velocity'
    },
    {
      id: 'shift-2',
      title: 'APAC concurrent sessions hit weekly peak',
      description: 'Autumn Promo campaign blast drove 38,400 peak concurrents across Tokyo and Singapore PoPs.',
      timestamp: 'Today at 6:15 AM',
      direction: 'up',
      metricId: 'active_sessions'
    },
    {
      id: 'shift-3',
      title: 'Frankfürt payment retry anomaly resolved',
      description: 'Secondary bank partner timeout rate returned to nominal 0.08% after Zurich traffic shift.',
      timestamp: 'Today at 8:20 AM',
      direction: 'resolved',
      metricId: 'error_rate'
    }
  ], []);

  // Subscribe to engine
  useEffect(() => {
    setCausalEvents(telemetryEngine.getCausalEvents());
    setHypothesisNotes(telemetryEngine.getHypotheses());

    const unsubscribe = telemetryEngine.subscribe((snapshot: TelemetrySnapshot) => {
      setTickCounter((prev) => prev + 1);
      setIsStreaming(snapshot.isStreaming);
      setBufferedTicksCount(snapshot.bufferCount);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync theme with HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleStreaming = useCallback(() => {
    if (isStreaming) {
      telemetryEngine.stopStreaming();
    } else {
      telemetryEngine.startStreaming();
    }
  }, [isStreaming]);

  const setSpeed = useCallback((s: number) => {
    setSpeedState(s);
    telemetryEngine.setSpeed(s);
  }, []);

  const setInspectionLocked = useCallback((locked: boolean) => {
    setIsInspectionLocked(locked);
    telemetryEngine.setHoverPaused(locked);
  }, []);

  const rewindMinutes = useCallback((mins: number) => {
    setPlaybackMode('dvr');
    const totalMinsAvailable = 30;
    const newPos = Math.max(0, 100 - (mins / totalMinsAvailable) * 100);
    setDvrPosition(newPos);
  }, []);

  const injectNewEvent = useCallback((title: string, category: CausalEventPin['category'], metricId: MetricId) => {
    const event: CausalEventPin = {
      id: `event-${Date.now()}`,
      timestamp: Date.now(),
      title,
      badge: `⚡ Live ${title.slice(0, 14)}`,
      category,
      impactSummary: 'Triggered immediate telemetry delta trajectory',
      iconName: category === 'deploy' ? 'Rocket' : category === 'marketing' ? 'Megaphone' : 'Zap',
      color: category === 'deploy' ? '#38BDF8' : category === 'marketing' ? '#A855F7' : '#F59E0B',
      affectedMetrics: [metricId],
      details: `User-injected causal milestone. Simulated operational shift active.`
    };
    telemetryEngine.injectEvent(event, metricId, 1.4, 25);
    setCausalEvents(telemetryEngine.getCausalEvents());
  }, []);

  const addHypothesis = useCallback((metricId: MetricId, note: string, author: string = 'You (Analyst)') => {
    const initials = author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AN';
    telemetryEngine.addHypothesisNote({
      metricId,
      author,
      avatar: initials,
      role: 'Dashboard Operator',
      note,
      timestamp: Date.now()
    });
    setHypothesisNotes(telemetryEngine.getHypotheses());
  }, []);

  const updateWhatIfScenario = useCallback((update: Partial<WhatIfScenario>) => {
    setWhatIfScenario((prev) => ({ ...prev, ...update }));
  }, []);

  const resetWhatIfScenario = useCallback(() => {
    setWhatIfScenario({
      trafficGrowth: 15,
      conversionLift: 8,
      serverCap: 0,
      active: false
    });
  }, []);

  const cycleWidgetSize = useCallback((widgetId: string) => {
    setWidgetSizes((prev) => {
      const current = prev[widgetId] || 'standard';
      const next: WidgetSize = current === 'compact' ? 'standard' : current === 'standard' ? 'spotlight' : 'compact';
      return { ...prev, [widgetId]: next };
    });
  }, []);

  const triggerClipModal = useCallback((target: { title: string; subtitle: string; metricId: MetricId }) => {
    setClipTargetWidget(target);
    setIsClipModalOpen(true);
  }, []);

  const getSeriesData = useCallback((metricId: MetricId, downsampleThreshold: number = 180): TelemetryPoint[] => {
    const raw = telemetryEngine.getSeries(metricId);
    if (raw.length === 0) return [];

    // Apply time-travel DVR slicing if active
    let sliced = raw;
    if (playbackMode === 'dvr' && dvrPosition < 100) {
      const targetIndex = Math.max(10, Math.floor((dvrPosition / 100) * raw.length));
      sliced = raw.slice(0, targetIndex);
    }

    // Apply window filter
    const windowMs = timeWindowMinutes * 60 * 1000;
    const latestTime = sliced[sliced.length - 1]?.timestamp || Date.now();
    const windowStart = latestTime - windowMs;
    const windowed = sliced.filter(p => p.timestamp >= windowStart);

    const dataToSample = windowed.length > 0 ? windowed : sliced;

    if (downsampleThreshold > 0 && dataToSample.length > downsampleThreshold) {
      return downsampleLTTB(dataToSample, downsampleThreshold);
    }
    return dataToSample;
  }, [playbackMode, dvrPosition, timeWindowMinutes]);

  const getLatestPoint = useCallback((metricId: MetricId): TelemetryPoint | undefined => {
    return telemetryEngine.getLatestPoint(metricId);
  }, []);

  return (
    <TelemetryContext.Provider
      value={{
        isStreaming,
        toggleStreaming,
        speed,
        setSpeed,
        isInspectionLocked,
        setInspectionLocked,
        bufferedTicksCount,
        perspectiveLens,
        setPerspectiveLens,
        primaryMetricId,
        setPrimaryMetricId,
        chartLens,
        setChartLens,
        theme,
        toggleTheme,
        playbackMode,
        setPlaybackMode,
        timeWindowMinutes,
        setTimeWindowMinutes,
        dvrPosition,
        setDvrPosition,
        rewindMinutes,
        hoveredTimestamp,
        setHoveredTimestamp,
        deltaMeasurement,
        setDeltaMeasurement,
        causalEvents,
        injectNewEvent,
        selectedEvent,
        setSelectedEvent,
        hypothesisNotes,
        addHypothesis,
        whatIfScenario,
        updateWhatIfScenario,
        resetWhatIfScenario,
        selectedSegmentFilter,
        setSelectedSegmentFilter,
        widgetSizes,
        cycleWidgetSize,
        isSinceLastCheckedOpen,
        setIsSinceLastCheckedOpen,
        isClipModalOpen,
        setIsClipModalOpen,
        clipTargetWidget,
        triggerClipModal,
        shiftHighlights,
        getSeriesData,
        getLatestPoint
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export function useTelemetry(): TelemetryContextType {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
