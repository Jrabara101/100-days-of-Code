import { PRIZE_LADDER } from '../data/triviaData';

export interface ScoreCalculationResult {
  baseBounty: number;
  timeRemainingMs: number;
  totalDurationMs: number;
  timeRatio: number;
  timeScalar: number;
  streak: number;
  streakMultiplier: number;
  pointsAwarded: number;
}

/**
 * Deterministic Monotonic Time-Decay Scoring Model
 * Rewards fast cognitive intuition while guaranteeing baseline floor for late correct submissions.
 *
 * S_i = floor( B_i * (lambda + (1 - lambda) * (t_remain / T_max)) * M_streak )
 */
export function calculateDecayedScore(
  tierIndex: number,
  remainingMs: number,
  totalDurationMs: number,
  currentStreak: number,
  lambda: number = 0.35
): ScoreCalculationResult {
  const currentTier = PRIZE_LADDER[tierIndex] || PRIZE_LADDER[PRIZE_LADDER.length - 1];
  const baseBounty = currentTier.bounty;

  const clampedRemaining = Math.max(0, Math.min(totalDurationMs, remainingMs));
  const timeRatio = clampedRemaining / totalDurationMs;

  // Non-linear scaled curve with minimum floor lambda
  const timeScalar = lambda + (1 - lambda) * timeRatio;

  // Streak Multiplier: +25% per consecutive correct answer, capped at 5x streak (2.25x max)
  const streakMultiplier = 1.0 + Math.min(5, currentStreak) * 0.25;

  const pointsAwarded = Math.floor(baseBounty * timeScalar * streakMultiplier);

  return {
    baseBounty,
    timeRemainingMs: clampedRemaining,
    totalDurationMs,
    timeRatio,
    timeScalar,
    streak: currentStreak,
    streakMultiplier,
    pointsAwarded
  };
}

/**
 * Calculates the locked-in guaranteed safe haven payout based on completed tiers.
 */
export function calculateSafeHavenPayout(clearedTierIndex: number): number {
  let highestSafeBounty = 0;
  for (let i = 0; i <= clearedTierIndex; i++) {
    if (PRIZE_LADDER[i]?.safe) {
      highestSafeBounty = PRIZE_LADDER[i].bounty;
    }
  }
  return highestSafeBounty;
}
