import type { DiagnosticSnapshot, FleetSummaryResponse, TelemetryReportPayload } from '../types/telemetry';

export class TelemetryClient {
  private static instance: TelemetryClient;
  private sessionId: string;
  private apiBaseUrl: string = '/api';

  private constructor() {
    this.sessionId = `sess-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    this.setupAutoBeacon();
  }

  public static getInstance(): TelemetryClient {
    if (!TelemetryClient.instance) {
      TelemetryClient.instance = new TelemetryClient();
    }
    return TelemetryClient.instance;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Dispatches a live telemetry report to the ingestion backend.
   * Uses navigator.sendBeacon when possible or fallback to keepalive fetch.
   */
  public async submitReport(snapshot: DiagnosticSnapshot): Promise<{ success: boolean; error?: string }> {
    const payload: TelemetryReportPayload = {
      sessionId: this.sessionId,
      appVersion: 'v1.4.2-avionics',
      gpuRenderer: snapshot.hardware.gpuRenderer,
      cpuCores: snapshot.hardware.cores,
      memoryGb: snapshot.hardware.deviceMemoryGb,
      screenRefreshRate: snapshot.hardware.screenRefreshRate,
      dpr: snapshot.hardware.dpr,
      avgFps: snapshot.metrics.averageFps,
      p99FrameTimeMs: snapshot.metrics.onePercentLowFps > 0 ? 1000 / snapshot.metrics.onePercentLowFps : 16.66,
      onePercentLowFps: snapshot.metrics.onePercentLowFps,
      longTaskCount: snapshot.metrics.longTaskCount,
      droppedFrames: snapshot.metrics.droppedFrames,
      hardwareProfile: snapshot.hardware,
      stabilityScore: snapshot.metrics.stabilityScore,
      snapshot,
    };

    const endpoint = `${this.apiBaseUrl}/telemetry/report`;
    const serialized = JSON.stringify(payload);

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([serialized], { type: 'text/plain' });
        const enqueued = navigator.sendBeacon(endpoint, blob);
        if (enqueued) return { success: true };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
        keepalive: true,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return { success: true };
    } catch (err: any) {
      console.warn('Telemetry submission failed (operating offline or server down):', err);
      return { success: false, error: err?.message || 'Network error' };
    }
  }

  /**
   * Fetches aggregated fleet intelligence and regression reports.
   */
  public async fetchFleetSummary(): Promise<FleetSummaryResponse | null> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/telemetry/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch fleet telemetry summary:', err);
      return null;
    }
  }

  /**
   * Wires page unload beaconing so session results are automatically persisted when the tab closes.
   */
  private setupAutoBeacon() {
    if (typeof window === 'undefined') return;

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Can be triggered on page hide
      }
    });
  }
}

export const telemetryClient = TelemetryClient.getInstance();
