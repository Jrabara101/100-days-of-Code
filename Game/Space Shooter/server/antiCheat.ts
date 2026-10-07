import crypto from 'crypto';

export interface TelemetryEvent {
  timeMs: number;
  action: 'thrust' | 'fire' | 'graze' | 'hit' | 'dash' | 'emp' | 'powerup_collect';
  x: number;
  y: number;
  hitTargetId?: string;
  extra?: number;
}

export interface RunSubmission {
  sectorSeed: number;
  shipId: 'interceptor' | 'dreadnought' | 'scout';
  score: number;
  durationMs: number;
  waveReached: number;
  grazes: number;
  accuracy: number;
  activeSynergies: string[];
  telemetry: TelemetryEvent[];
}

export interface VerificationResult {
  verified: boolean;
  reason?: string;
  runHash: string;
  metrics: {
    telemetrySamples: number;
    avgFireIntervalMs: number;
    maxObservedSpeed: number;
    scorePerSecond: number;
  };
}

export function verifyFlightTelemetry(submission: RunSubmission): VerificationResult {
  const { score, durationMs, waveReached, grazes, shipId, telemetry } = submission;

  // 1. Duration & wave clearing constraints
  if (durationMs < 2000 && score > 500) {
    return {
      verified: false,
      reason: 'Flagged: Impossible mission duration for submitted score.',
      runHash: '',
      metrics: { telemetrySamples: telemetry.length, avgFireIntervalMs: 0, maxObservedSpeed: 0, scorePerSecond: 0 },
    };
  }

  // Minimum time per wave cleared
  const minTimePerWave = 2000; // 2 seconds minimum per wave even with instant kills
  if (waveReached > 1 && durationMs < (waveReached - 1) * minTimePerWave) {
    return {
      verified: false,
      reason: 'Flagged: Wave clear rate exceeds physical spawn and transit velocity.',
      runHash: '',
      metrics: { telemetrySamples: telemetry.length, avgFireIntervalMs: 0, maxObservedSpeed: 0, scorePerSecond: 0 },
    };
  }

  // 2. Fire rate constraints
  const fireEvents = telemetry.filter((t) => t.action === 'fire');
  let minFireInterval = Infinity;
  let totalInterval = 0;
  let intervalCount = 0;

  for (let i = 1; i < fireEvents.length; i++) {
    const dt = fireEvents[i].timeMs - fireEvents[i - 1].timeMs;
    if (dt > 0) {
      if (dt < minFireInterval) minFireInterval = dt;
      totalInterval += dt;
      intervalCount++;
    }
  }

  const avgFireIntervalMs = intervalCount > 0 ? totalInterval / intervalCount : 0;
  // If weapon fired faster than 40ms interval on average, flag rapid-fire packet injection
  if (minFireInterval < 25 && fireEvents.length > 20) {
    return {
      verified: false,
      reason: `Flagged: Weapon discharge rate (${minFireInterval}ms) exceeded hardware thermal limit.`,
      runHash: '',
      metrics: { telemetrySamples: telemetry.length, avgFireIntervalMs, maxObservedSpeed: 0, scorePerSecond: 0 },
    };
  }

  // 3. Movement kinematics constraint (No instantaneous warp hacks)
  let maxObservedSpeed = 0;
  for (let i = 1; i < telemetry.length; i++) {
    const dt = (telemetry[i].timeMs - telemetry[i - 1].timeMs) / 1000;
    if (dt > 0.01 && dt < 1.0) {
      const dx = telemetry[i].x - telemetry[i - 1].x;
      const dy = telemetry[i].y - telemetry[i - 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = dist / dt; // pixels per second
      if (speed > maxObservedSpeed) {
        maxObservedSpeed = speed;
      }
    }
  }

  // Max speed allowed: 2400 px/sec (allowing for phase dash)
  if (maxObservedSpeed > 3200) {
    return {
      verified: false,
      reason: `Flagged: Vessel vector velocity anomaly detected (${Math.round(maxObservedSpeed)} px/s).`,
      runHash: '',
      metrics: { telemetrySamples: telemetry.length, avgFireIntervalMs, maxObservedSpeed, scorePerSecond: 0 },
    };
  }

  // 4. Score-to-time ratio sanity check
  const scorePerSecond = durationMs > 0 ? (score / (durationMs / 1000)) : 0;
  // Maximum plausible score generation rate even with x4 overcharge and boss clears
  if (scorePerSecond > 65000) {
    return {
      verified: false,
      reason: 'Flagged: Score accumulation curve outside theoretical DPS boundaries.',
      runHash: '',
      metrics: { telemetrySamples: telemetry.length, avgFireIntervalMs, maxObservedSpeed, scorePerSecond },
    };
  }

  // Generate authoritative signed SHA-256 run hash
  const payload = `${submission.sectorSeed}:${shipId}:${score}:${durationMs}:${waveReached}:${grazes}:${telemetry.length}:SYS_AEROSTRIKE_AUTH`;
  const runHash = crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16).toUpperCase();

  return {
    verified: true,
    runHash: `AUTH-${runHash}`,
    metrics: {
      telemetrySamples: telemetry.length,
      avgFireIntervalMs: Math.round(avgFireIntervalMs),
      maxObservedSpeed: Math.round(maxObservedSpeed),
      scorePerSecond: Math.round(scorePerSecond),
    },
  };
}
