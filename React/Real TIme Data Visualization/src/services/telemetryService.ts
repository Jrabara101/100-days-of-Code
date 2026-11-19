import { RingBuffer } from '../engine/ringBuffer';
import { detectAnomaly } from '../engine/anomaly';
import { CausalEventPin, HypothesisStickyNote, MetricId, TelemetryPoint } from '../types/telemetry';

export interface TelemetrySnapshot {
  timestamp: number;
  points: Record<MetricId, TelemetryPoint>;
  isStreaming: boolean;
  isPaused: boolean;
  bufferCount: number;
  dvrTimestamp?: number;
}

export class TelemetryService {
  private buffers: Record<MetricId, RingBuffer<TelemetryPoint>>;
  private listeners: Set<(snapshot: TelemetrySnapshot) => void> = new Set();
  private timer: number | null = null;
  private intervalMs: number = 1000;
  private speedMultiplier: number = 1;
  private isStreaming: boolean = true;
  private isHoverPaused: boolean = false;
  private bufferedTicks: Record<MetricId, TelemetryPoint[]> = {
    checkout_velocity: [],
    active_sessions: [],
    api_latency: [],
    error_rate: []
  };

  private causalEvents: CausalEventPin[] = [];
  private hypothesisNotes: HypothesisStickyNote[] = [];

  // Seasonal baseline parameters
  private baseParams: Record<MetricId, { mean: number; stdDev: number; amplitude: number; noise: number }> = {
    checkout_velocity: { mean: 4200, stdDev: 350, amplitude: 600, noise: 75 },
    active_sessions: { mean: 28500, stdDev: 2200, amplitude: 4500, noise: 400 },
    api_latency: { mean: 68, stdDev: 8, amplitude: 12, noise: 4 },
    error_rate: { mean: 0.12, stdDev: 0.04, amplitude: 0.05, noise: 0.02 }
  };

  // Active injected anomalies / surges
  private injectedShifts: Record<MetricId, { multiplier: number; remainingTicks: number }> = {
    checkout_velocity: { multiplier: 1, remainingTicks: 0 },
    active_sessions: { multiplier: 1, remainingTicks: 0 },
    api_latency: { multiplier: 1, remainingTicks: 0 },
    error_rate: { multiplier: 1, remainingTicks: 0 },
  };

  constructor() {
    this.buffers = {
      checkout_velocity: new RingBuffer<TelemetryPoint>(1800), // 30 minutes at 1s
      active_sessions: new RingBuffer<TelemetryPoint>(1800),
      api_latency: new RingBuffer<TelemetryPoint>(1800),
      error_rate: new RingBuffer<TelemetryPoint>(1800)
    };

    this.initializeHistoricalData();
    this.initializeCausalEvents();
    this.initializeHypotheses();
    this.startStreaming();
  }

  private initializeHistoricalData() {
    const now = Date.now();
    const historyCount = 900; // 15 mins of 1s ticks or 30 mins at 2s
    const stepMs = 1000;
    const startTime = now - historyCount * stepMs;

    for (let i = 0; i < historyCount; i++) {
      const time = startTime + i * stepMs;
      const progress = i / historyCount;
      
      // Inject a realistic surge event around 70% of history (e.g., 5 mins ago)
      const isSurgeZone = progress > 0.65 && progress < 0.85;
      const surgeFactor = isSurgeZone ? Math.sin((progress - 0.65) / 0.2 * Math.PI) * 0.35 : 0;

      (Object.keys(this.baseParams) as MetricId[]).forEach((metricId) => {
        const point = this.generatePoint(metricId, time, surgeFactor, false);
        this.buffers[metricId].push(point);
      });
    }
  }

  private initializeCausalEvents() {
    const now = Date.now();
    this.causalEvents = [
      {
        id: 'event-deploy-24',
        timestamp: now - 12 * 60 * 1000, // 12 mins ago
        title: 'v2.4 Checkout Optimization Deploy',
        badge: '🚀 10:15 v2.4 Deploy',
        category: 'deploy',
        impactSummary: '+28% checkout conversion velocity shift',
        iconName: 'Rocket',
        color: '#38BDF8',
        affectedMetrics: ['checkout_velocity', 'api_latency'],
        details: 'Enabled optimized 1-tap checkout flow and rolled out Redis connection pooling globally.'
      },
      {
        id: 'event-promo-email',
        timestamp: now - 7 * 60 * 1000, // 7 mins ago
        title: 'Autumn Promo Campaign Blast (2.4M Recipients)',
        badge: '📣 10:20 Promo Email',
        category: 'marketing',
        impactSummary: '+58% concurrent sessions surge',
        iconName: 'Megaphone',
        color: '#A855F7',
        affectedMetrics: ['active_sessions', 'checkout_velocity'],
        details: 'Sent seasonal discounts blast to high-intent loyalty tier. Peak open rates in Western Europe.'
      },
      {
        id: 'event-gw-latency',
        timestamp: now - 3 * 60 * 1000, // 3 mins ago
        title: 'EU Payment Gateway Retry Spike',
        badge: '⚡ 10:24 EU Gateway Spike',
        category: 'infrastructure',
        impactSummary: '+18ms temporary P95 latency bump',
        iconName: 'Zap',
        color: '#F59E0B',
        affectedMetrics: ['api_latency', 'error_rate'],
        details: 'Frankfürt tier-1 payment processor experienced 12s connection throttling before auto-failover to Zurich replica.'
      }
    ];
  }

  private initializeHypotheses() {
    const now = Date.now();
    this.hypothesisNotes = [
      {
        id: 'hypo-1',
        timestamp: now - 10 * 60 * 1000,
        metricId: 'checkout_velocity',
        author: 'Elena Rostova',
        avatar: 'ER',
        role: 'Staff Product Eng',
        note: 'Switched 1-tap payment CTA styling here. Watching Apple Pay completion rate for 45 mins.',
        createdAt: now - 10 * 60 * 1000
      },
      {
        id: 'hypo-2',
        timestamp: now - 4 * 60 * 1000,
        metricId: 'api_latency',
        author: 'Marcus Vance',
        avatar: 'MV',
        role: 'Site Reliability Lead',
        note: 'Raised DB connection pool max limit from 60 to 120. P95 latency dropped 14ms immediately.',
        createdAt: now - 4 * 60 * 1000
      }
    ];
  }

  private generatePoint(
    metricId: MetricId,
    timestamp: number,
    surgeBoost: number = 0,
    checkLiveAnomaly: boolean = true
  ): TelemetryPoint {
    const params = this.baseParams[metricId];
    const date = new Date(timestamp);
    const hours = date.getHours() + date.getMinutes() / 60;

    // Daily seasonal diurnal cycle (sinusoidal peak around 2 PM)
    const seasonalFactor = Math.sin(((hours - 6) / 24) * 2 * Math.PI);
    const baseline = params.mean + params.amplitude * seasonalFactor;

    // Confidence corridor (+- 2 sigma)
    const confidenceBandLow = Math.max(0, baseline - 2.2 * params.stdDev);
    const confidenceBandHigh = baseline + 2.2 * params.stdDev;

    // Random Brownian walk & noise
    const randomWalk = (Math.random() - 0.5) * params.noise * 2;
    
    // Injected multiplier from manual simulation
    const injected = this.injectedShifts[metricId];
    let effectiveMultiplier = 1;
    if (injected.remainingTicks > 0) {
      effectiveMultiplier = injected.multiplier;
      injected.remainingTicks--;
    }

    let value = (baseline + randomWalk) * (1 + surgeBoost) * effectiveMultiplier;
    if (metricId === 'error_rate') {
      value = Math.max(0.01, value);
    } else {
      value = Math.max(0, value);
    }

    // Anomaly detection
    let isAnomaly = false;
    let anomalySeverity: 'mild' | 'moderate' | 'critical' | undefined;
    let zScore: number | undefined;
    let drivers = undefined;

    if (checkLiveAnomaly) {
      const anomalyResult = detectAnomaly(value, baseline, params.stdDev, metricId);
      isAnomaly = anomalyResult.isAnomaly;
      anomalySeverity = anomalyResult.severity;
      zScore = anomalyResult.zScore;
      drivers = anomalyResult.drivers;
    }

    const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Breakdown for cohort views
    const mobileRatio = 0.58 + (Math.sin(timestamp / 50000) * 0.05);
    const desktopRatio = 0.34 + (Math.cos(timestamp / 60000) * 0.04);
    const tabletRatio = Math.max(0.04, 1 - (mobileRatio + desktopRatio));

    return {
      timestamp,
      timeLabel,
      value,
      baseline,
      confidenceBandLow,
      confidenceBandHigh,
      isAnomaly,
      anomalySeverity,
      zScore,
      drivers,
      secondaryValue: value * (0.85 + (Math.random() - 0.5) * 0.1),
      breakdown: {
        mobile: value * mobileRatio,
        desktop: value * desktopRatio,
        tablet: value * tabletRatio
      }
    };
  }

  public startStreaming() {
    if (this.timer !== null) return;
    this.isStreaming = true;

    this.timer = window.setInterval(() => {
      this.tick();
    }, this.intervalMs / this.speedMultiplier);
  }

  public stopStreaming() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.isStreaming = false;
    this.notify();
  }

  public setSpeed(multiplier: number) {
    this.speedMultiplier = multiplier;
    if (this.timer !== null) {
      this.stopStreaming();
      this.startStreaming();
    }
  }

  public setHoverPaused(paused: boolean) {
    this.isHoverPaused = paused;

    if (!paused) {
      // Catch up buffered ticks smoothly
      (Object.keys(this.bufferedTicks) as MetricId[]).forEach((metricId) => {
        const queue = this.bufferedTicks[metricId];
        while (queue.length > 0) {
          const pt = queue.shift();
          if (pt) this.buffers[metricId].push(pt);
        }
      });
      this.notify();
    }
  }

  public getBufferedCount(): number {
    return this.bufferedTicks.checkout_velocity.length;
  }

  private tick() {
    const now = Date.now();
    const snapshotPoints: Record<MetricId, TelemetryPoint> = {} as any;

    (Object.keys(this.baseParams) as MetricId[]).forEach((metricId) => {
      const pt = this.generatePoint(metricId, now, 0, true);
      snapshotPoints[metricId] = pt;

      if (this.isHoverPaused) {
        // Buffer incoming ticks during inspection lock
        this.bufferedTicks[metricId].push(pt);
      } else {
        this.buffers[metricId].push(pt);
      }
    });

    this.notify();
  }

  public injectEvent(event: CausalEventPin, shiftMetric?: MetricId, multiplier: number = 1.35, durationTicks: number = 30) {
    this.causalEvents.push(event);
    if (shiftMetric) {
      this.injectedShifts[shiftMetric] = { multiplier, remainingTicks: durationTicks };
    }
    this.notify();
  }

  public addHypothesisNote(note: Omit<HypothesisStickyNote, 'id' | 'createdAt'>): HypothesisStickyNote {
    const fullNote: HypothesisStickyNote = {
      ...note,
      id: `hypo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now()
    };
    this.hypothesisNotes.push(fullNote);
    this.notify();
    return fullNote;
  }

  public getHypotheses(): HypothesisStickyNote[] {
    return [...this.hypothesisNotes];
  }

  public getCausalEvents(): CausalEventPin[] {
    return [...this.causalEvents];
  }

  public getSeries(metricId: MetricId): TelemetryPoint[] {
    return this.buffers[metricId].toArray();
  }

  public getLatestPoint(metricId: MetricId): TelemetryPoint | undefined {
    return this.buffers[metricId].getLast();
  }

  public subscribe(listener: (snapshot: TelemetrySnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const latestPoints: Record<MetricId, TelemetryPoint> = {
      checkout_velocity: this.buffers.checkout_velocity.getLast() || ({} as any),
      active_sessions: this.buffers.active_sessions.getLast() || ({} as any),
      api_latency: this.buffers.api_latency.getLast() || ({} as any),
      error_rate: this.buffers.error_rate.getLast() || ({} as any)
    };

    const snapshot: TelemetrySnapshot = {
      timestamp: Date.now(),
      points: latestPoints,
      isStreaming: this.isStreaming,
      isPaused: this.isHoverPaused,
      bufferCount: this.getBufferedCount()
    };

    this.listeners.forEach((listener) => listener(snapshot));
  }
}

// Global Singleton for easy shared streaming
export const telemetryEngine = new TelemetryService();
