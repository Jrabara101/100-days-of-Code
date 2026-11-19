export type MetricId = 'checkout_velocity' | 'active_sessions' | 'api_latency' | 'error_rate';

export type PerspectiveLens = 'executive' | 'live_ops' | 'analyst';

export type ChartLens = 'continuous_trend' | 'cohort_breakdown' | 'hourly_heatmap' | 'data_table';

export type WidgetSize = 'compact' | 'standard' | 'spotlight';

export interface AnomalyDriver {
  dimension: string;
  contribution: string;
  percentage: number;
  color: string;
  category: 'region' | 'device' | 'payment' | 'service';
}

export interface TelemetryPoint {
  timestamp: number; // Unix ms
  timeLabel: string; // e.g. "10:42:15 AM"
  value: number;
  baseline: number; // Seasonal expected baseline ("Typical Tuesday at 9:00 AM")
  confidenceBandLow: number;
  confidenceBandHigh: number;
  isAnomaly: boolean;
  anomalySeverity?: 'mild' | 'moderate' | 'critical';
  zScore?: number;
  drivers?: AnomalyDriver[];
  secondaryValue?: number; // E.g. mobile vs desktop or comparison series
  breakdown?: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

export interface CausalEventPin {
  id: string;
  timestamp: number;
  title: string;
  badge: string;
  category: 'deploy' | 'marketing' | 'infrastructure' | 'pricing';
  impactSummary: string;
  iconName: string;
  color: string;
  affectedMetrics: MetricId[];
  details: string;
}

export interface HypothesisStickyNote {
  id: string;
  timestamp: number;
  metricId: MetricId;
  author: string;
  avatar: string;
  role: string;
  note: string;
  createdAt: number;
}

export interface WhatIfScenario {
  trafficGrowth: number; // -30% to +100%
  conversionLift: number; // -20% to +50%
  serverCap: number; // 0 to 10000 req/s
  active: boolean;
}

export interface DeltaMeasurement {
  isActive: boolean;
  startX: number;
  endX: number;
  startTime: number;
  endTime: number;
  startVal: number;
  endVal: number;
  deltaVal: number;
  deltaPct: number;
  durationMinutes: number;
  eventsInSpan: CausalEventPin[];
}

export interface MetricMeta {
  id: MetricId;
  name: string;
  unit: string;
  prefix: string;
  format: (val: number) => string;
  kicker: string;
  color: string;
  secondaryColor: string;
  goalTarget: number;
  goalUnit: string;
}

export interface ShiftHighlight {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  direction: 'up' | 'down' | 'resolved';
  metricId: MetricId;
}
