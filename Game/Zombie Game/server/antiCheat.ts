import { RunSubmission, TelemetryEvent } from '../src/types/game.js';

export interface VerificationResult {
  isValid: boolean;
  reason?: string;
  verifiedScore: number;
}

export function verifyCombatTelemetry(run: RunSubmission): VerificationResult {
  const { durationMs, wavesCleared, scrapCollected, finalScore, telemetry } = run;

  // 1. Check duration vs waves cleared feasibility
  // Minimum physically possible time per wave is ~8 seconds even with instant kills
  const minExpectedDurationMs = Math.max(5000, (wavesCleared - 1) * 7000);
  if (durationMs < minExpectedDurationMs && wavesCleared > 1) {
    return {
      isValid: false,
      reason: `Temporal anomaly: Duration of ${Math.round(durationMs / 1000)}s is unfeasible for clearing ${wavesCleared} waves.`,
      verifiedScore: 0,
    };
  }

  // 2. Check scrap collection upper bound
  const maxFeasibleScrap = wavesCleared * 2500 + 2000;
  if (scrapCollected > maxFeasibleScrap) {
    return {
      isValid: false,
      reason: `Biomass tampering: Collected ${scrapCollected} scrap exceeds wave maximum (${maxFeasibleScrap}).`,
      verifiedScore: 0,
    };
  }

  // 3. Telemetry buffer analysis (if telemetry provided)
  if (Array.isArray(telemetry) && telemetry.length > 0) {
    let shotsFired = 0;
    let shotsHit = 0;
    let lastShotTime = 0;
    let lastWeapon = '';

    for (const event of telemetry) {
      if (event.action === 'shot') {
        shotsFired++;
        // Check fire rate limit (< 35ms between shots indicates memory injection / turbo spam)
        if (event.weaponId === lastWeapon && event.timeMs - lastShotTime < 35 && lastShotTime > 0) {
          return {
            isValid: false,
            reason: `Weapon fire rate overflow: Shot delta ${event.timeMs - lastShotTime}ms violates ballistic rate limit.`,
            verifiedScore: 0,
          };
        }
        lastShotTime = event.timeMs;
        lastWeapon = event.weaponId;
      } else if (event.action === 'hit') {
        shotsHit += event.hitCount || 1;
      }
    }

    // Shotgun and piercing can yield more hits than shots, but not 10x
    if (shotsFired > 0 && shotsHit > shotsFired * 8) {
      return {
        isValid: false,
        reason: `Ballistic trajectory anomaly: Hit ratio (${shotsHit}/${shotsFired}) exceeds piercing bounds.`,
        verifiedScore: 0,
      };
    }
  }

  // Recalculate authoritative score:
  // Base: wavesCleared * 1000 + scrapCollected * 2 + duration bonus
  const calculatedBaseScore = Math.floor(
    wavesCleared * 1250 +
    scrapCollected * 1.5 +
    Math.min(durationMs / 100, 15000)
  );

  // Allow client score within a reasonable variance (due to kill combos / crits)
  const maxAllowedVariance = calculatedBaseScore * 0.4 + 500;
  if (Math.abs(finalScore - calculatedBaseScore) > maxAllowedVariance && finalScore > calculatedBaseScore + maxAllowedVariance) {
    return {
      isValid: false,
      reason: `Score ledger mismatch: Submitted score ${finalScore} deviates from calculated baseline ${calculatedBaseScore}.`,
      verifiedScore: calculatedBaseScore,
    };
  }

  return {
    isValid: true,
    verifiedScore: finalScore,
  };
}
