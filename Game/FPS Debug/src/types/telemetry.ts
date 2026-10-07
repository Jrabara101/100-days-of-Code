export interface FrameTelemetrySample {
  timestamp: number;
  deltaMs: number;
  instantFps: number;
  isLongTask: boolean;
}

export interface HardwareProfile {
  gpuRenderer: string;
  gpuVendor?: string;
  cores: number;
  deviceMemoryGb?: number;
  screenRefreshRate: number;
  dpr: number;
  userAgent: string;
  webglVersion: string;
  maxTextureSize: number;
}

export interface PerformanceSummary {
  currentFps: number;
  averageFps: number;
  onePercentLowFps: number;
  pointOnePercentLowFps: number;
  currentFrameTimeMs: number;
  maxFrameTimeMs: number;
  minFrameTimeMs: number;
  totalFrames: number;
  droppedFrames: number;
  longTaskCount: number;
  memoryUsedMb?: number;
  memoryLimitMb?: number;
  stabilityScore: number; // 0 - 100%
}

export interface DiagnosticSnapshot {
  id: string;
  timestamp: string;
  hardware: HardwareProfile;
  metrics: PerformanceSummary;
  recentFrameHistory: number[]; // last 120-240 frame times in ms
  longTaskLogs: { durationMs: number; startTime: number; name?: string }[];
  errorLogs: { timestamp: number; message: string; stack?: string }[];
  incidentReason?: string;
}

export interface TelemetryReportPayload {
  sessionId: string;
  appVersion: string;
  gpuRenderer: string;
  cpuCores: number;
  memoryGb?: number;
  screenRefreshRate: number;
  dpr: number;
  avgFps: number;
  p99FrameTimeMs: number;
  onePercentLowFps: number;
  longTaskCount: number;
  droppedFrames: number;
  hardwareProfile: HardwareProfile;
  stabilityScore: number;
  snapshot?: DiagnosticSnapshot;
}

export interface FleetSummaryResponse {
  totalReports: number;
  fleetStabilityScore: number;
  fleetAverageFps: number;
  fleetP99Ms: number;
  hardwareDistribution: {
    gpus: { name: string; count: number; avgFps: number }[];
    coreCounts: { cores: number; count: number }[];
    memoryTiers: { memoryGb: number; count: number }[];
  };
  regressions: {
    id: string;
    gpuRenderer: string;
    avgFps: number;
    onePercentLowFps: number;
    severity: 'critical' | 'warning' | 'notice';
    reason: string;
    timestamp: string;
  }[];
  recentSessions: {
    sessionId: string;
    timestamp: string;
    gpuRenderer: string;
    avgFps: number;
    onePercentLowFps: number;
    stabilityScore: number;
    longTaskCount: number;
  }[];
}

export type HudMode = 'hidden' | 'pill' | 'strip' | 'deck';

export interface ChaosSettings {
  targetFpsCap: number; // 0 means uncapped, 30, 45, 60, 120
  cpuLagDelayMs: number; // 0 - 50ms artificial frame delay
  cpuWorkerLoadPct: number; // 0 - 100% worker thread busy-wait
  artificialJitterMs: number; // 0 - 100ms jitter
  memoryStressActive: boolean; // allocate memory buffers to trigger GC
  memoryStressMb: number; // MB of memory allocated
  dropFramesProbability: number; // 0.0 - 0.5 artificial hitch drop
}
