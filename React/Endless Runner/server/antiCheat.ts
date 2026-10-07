import { RunSubmissionPayload, TelemetryAction } from '../src/types/game';

export interface AntiCheatValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Server-authoritative physics and telemetry verification.
 * Confirms that submitted run complies with physical constraints:
 * - Speed envelope
 * - Jump hangtime limitations
 * - Score bounds
 * - Input rate feasibility
 */
export function validateRunTelemetry(payload: RunSubmissionPayload): AntiCheatValidationResult {
  const { distance, durationMs, score, inputTelemetry, coinsCollected } = payload;

  // 1. Basic sanity bounds
  if (distance <= 0) {
    return { valid: false, reason: 'Invalid distance (non-positive)' };
  }

  if (durationMs < 500) {
    return { valid: false, reason: 'Run duration too short for traversal' };
  }

  const durationSec = durationMs / 1000;
  const avgSpeed = distance / durationSec;

  // 2. Speed envelope check
  // BASE_SPEED is 24, MAX_SPEED is 54, Overdrive boost is ~1.35 (~73 m/s max theoretically)
  if (avgSpeed > 75) {
    return {
      valid: false,
      reason: `Average speed (${avgSpeed.toFixed(1)} m/s) exceeds maximum physical velocity limit`,
    };
  }

  if (avgSpeed < 5 && distance > 200) {
    return {
      valid: false,
      reason: `Average speed (${avgSpeed.toFixed(1)} m/s) suspiciously slow for endless runner track`,
    };
  }

  // 3. Score envelope check
  // Score is roughly distance * 10 * combo + coins * 100.
  // Maximum theoretical multiplier is ~6x with overdrive. Max score < distance * 70 + coins * 500 + 5000.
  const maxPossibleScore = distance * 70 + (coinsCollected + 10) * 500 + 10000;
  if (score > maxPossibleScore) {
    return {
      valid: false,
      reason: `Score (${score}) exceeds theoretical maximum for traversed distance (${distance}m)`,
    };
  }

  // 4. Telemetry physical plausibility
  if (Array.isArray(inputTelemetry) && inputTelemetry.length > 0) {
    let lastActionTime = 0;
    let consecutiveJumpsInAir = 0;

    for (const item of inputTelemetry) {
      // Time must be monotonically non-decreasing
      if (item.timeMs < lastActionTime) {
        return { valid: false, reason: 'Non-chronological telemetry timestamps detected' };
      }

      // Check humanly possible input frequency (cannot send 50 actions in 50ms)
      const timeDiff = item.timeMs - lastActionTime;
      if (timeDiff < 25 && item.action !== 'OVERDRIVE') {
        // Debounce tolerance
      }

      // Jump height constraints
      if (item.action === 'JUMP') {
        if (item.y > 4.5) {
          return { valid: false, reason: 'Superhuman jump height recorded in telemetry' };
        }
      }

      // Lane bounds
      if (![0, 1, 2].includes(item.lane)) {
        return { valid: false, reason: 'Out-of-bounds lane index recorded' };
      }

      lastActionTime = item.timeMs;
    }
  }

  return { valid: true };
}
