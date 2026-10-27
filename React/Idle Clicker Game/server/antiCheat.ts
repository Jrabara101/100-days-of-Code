export interface CadenceAnalysisResult {
  status: 'VALID' | 'CADENCE_WARNING' | 'ANOMALOUS';
  calculatedCps: number;
  variance: number;
  reason?: string;
}

export class AntiCheatService {
  private readonly MAX_HUMAN_CPS = 25;
  private readonly MAX_OFFLINE_CAP_SECONDS = 8 * 3600; // 8 hours authoritative cap
  private readonly CLOCK_SKEW_TOLERANCE_MS = 15000; // 15 seconds

  /**
   * Analyzes tap intervals to detect non-Poisson square-wave autoclickers and macro bots
   */
  public analyzeTapCadence(sampleDeltas?: number[], tapCount = 0, windowMs = 5000): CadenceAnalysisResult {
    if (!sampleDeltas || sampleDeltas.length < 5) {
      // Not enough sample points yet; evaluate raw CPS if window provided
      if (windowMs > 0 && tapCount > 0) {
        const rawCps = (tapCount / (windowMs / 1000));
        if (rawCps > this.MAX_HUMAN_CPS) {
          return {
            status: 'ANOMALOUS',
            calculatedCps: rawCps,
            variance: 0,
            reason: `Inhuman tap rate detected: ${rawCps.toFixed(1)} CPS (limit: ${this.MAX_HUMAN_CPS} CPS)`,
          };
        }
      }
      return { status: 'VALID', calculatedCps: 0, variance: 100 };
    }

    const n = sampleDeltas.length;
    const sum = sampleDeltas.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    const cps = mean > 0 ? 1000 / mean : 0;

    // Calculate variance and standard deviation
    const squareDiffs = sampleDeltas.map((val) => Math.pow(val - mean, 2));
    const variance = squareDiffs.reduce((acc, val) => acc + val, 0) / n;
    const stdDev = Math.sqrt(variance);

    // 1. Extreme CPS rate check
    if (cps > this.MAX_HUMAN_CPS) {
      return {
        status: 'ANOMALOUS',
        calculatedCps: cps,
        variance,
        reason: `Steady-state rate ${cps.toFixed(1)} CPS exceeds maximum physiological limit (${this.MAX_HUMAN_CPS} CPS).`,
      };
    }

    // 2. Square-wave / Zero-variance macro detection:
    // Human muscle motor jitter produces standard deviation > 12ms. Autoclickers produce < 3ms.
    if (n >= 8 && stdDev < 4.0 && mean < 150) {
      return {
        status: 'CADENCE_WARNING',
        calculatedCps: cps,
        variance,
        reason: `Non-Poisson cadence detected: near-zero interval variance (${stdDev.toFixed(2)}ms standard deviation).`,
      };
    }

    return {
      status: 'VALID',
      calculatedCps: cps,
      variance,
    };
  }

  /**
   * Clamps offline time using monotonic server time and rejects forward clock skew
   */
  public validateMonotonicOfflineTime(
    clientLastSavedAt: number,
    serverCurrentTime: number,
    customMaxCapSeconds = this.MAX_OFFLINE_CAP_SECONDS
  ): {
    offlineSeconds: number;
    sanitized: boolean;
    skewWarning?: string;
  } {
    // If client timestamp is set far in the future
    if (clientLastSavedAt > serverCurrentTime + this.CLOCK_SKEW_TOLERANCE_MS) {
      return {
        offlineSeconds: 0,
        sanitized: true,
        skewWarning: 'Client timestamp ahead of server monotonic time. Potential time-travel exploit blocked.',
      };
    }

    const elapsedMs = Math.max(0, serverCurrentTime - clientLastSavedAt);
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    const clampedSeconds = Math.min(elapsedSeconds, customMaxCapSeconds);

    return {
      offlineSeconds: clampedSeconds,
      sanitized: clampedSeconds < elapsedSeconds,
    };
  }

  /**
   * Convert exponential string or big number into a calibrated float score for leaderboard sorting
   */
  public parseScoreValue(lifetimeCurrency: string, shards: number): number {
    try {
      const match = lifetimeCurrency.toLowerCase().match(/^([\d.]+)e\+?(-?\d+)$/);
      if (match) {
        const mantissa = parseFloat(match[1]);
        const exp = parseInt(match[2], 10);
        return exp + Math.log10(Math.max(1, mantissa)) + shards * 0.1;
      }
      const num = parseFloat(lifetimeCurrency);
      if (!isNaN(num) && num > 0) {
        return Math.log10(num) + shards * 0.1;
      }
    } catch {
      // fallback
    }
    return shards;
  }
}

export const antiCheatService = new AntiCheatService();
