import { MetricId, TelemetryPoint, WhatIfScenario } from '../types/telemetry';

export interface HeadlineSynthesis {
  headline: string;
  subhead: string;
  badgeText: string;
  badgeStatus: 'positive' | 'warning' | 'negative' | 'neutral';
}

export interface PaceForecast {
  status: 'on_track' | 'ahead' | 'at_risk' | 'critical';
  badge: string;
  projectedCrossingDate: string;
  daysDeltaText: string;
  runRateText: string;
  percentageComplete: number;
}

/**
 * Generates plain-language "So What?" headline synthesis for any metric
 */
export function generateHeadline(
  metricId: MetricId,
  currentPoint: TelemetryPoint | undefined,
  recentPoints: TelemetryPoint[]
): HeadlineSynthesis {
  if (!currentPoint) {
    return {
      headline: 'Connecting to telemetry pipeline...',
      subhead: 'Calibrating seasonal baseline models',
      badgeText: 'CALIBRATING',
      badgeStatus: 'neutral'
    };
  }

  const { value, baseline, isAnomaly } = currentPoint;
  const variancePct = baseline !== 0 ? ((value - baseline) / baseline) * 100 : 0;
  const sign = variancePct >= 0 ? '+' : '';

  if (metricId === 'checkout_velocity') {
    if (variancePct > 15) {
      return {
        headline: `Checkout conversion is up ${sign}${variancePct.toFixed(1)}% above normal—driven by mobile Apple Pay traffic`,
        subhead: 'Compared to rolling 4-week Tuesday baseline ($4,250/m normal pace)',
        badgeText: `▲ ${sign}${variancePct.toFixed(1)}% vs. Normal`,
        badgeStatus: 'positive'
      };
    } else if (variancePct < -12) {
      return {
        headline: `Checkout velocity dropped ${variancePct.toFixed(1)}% below baseline—investigating EU gateway retries`,
        subhead: '48% of drop concentrated in Frankfürt payment cluster',
        badgeText: `▼ ${variancePct.toFixed(1)}% vs. Normal`,
        badgeStatus: 'warning'
      };
    } else {
      return {
        headline: `Steady checkout flow within ±4% of historical Tuesday expected envelope`,
        subhead: 'Healthy conversion velocity across all global regions',
        badgeText: `● ${sign}${variancePct.toFixed(1)}% Nominal`,
        badgeStatus: 'neutral'
      };
    }
  }

  if (metricId === 'active_sessions') {
    if (variancePct > 20) {
      return {
        headline: `Concurrent sessions surged ${sign}${variancePct.toFixed(1)}% following the v2.4 release & email campaign`,
        subhead: 'Peak concurrency sustained across US-East and Western Europe',
        badgeText: `▲ ${sign}${variancePct.toFixed(1)}% High Load`,
        badgeStatus: 'positive'
      };
    } else if (variancePct < -15) {
      return {
        headline: `Active traffic running ${variancePct.toFixed(1)}% lower than seasonal average`,
        subhead: 'Off-peak trough aligning with APAC regional holiday shift',
        badgeText: `▼ ${variancePct.toFixed(1)}% Below Trend`,
        badgeStatus: 'warning'
      };
    } else {
      return {
        headline: `Platform traffic tracking seasonal diurnal curve with strong 99.98% reachability`,
        subhead: 'Smooth distribution across web client and mobile apps',
        badgeText: `● Nominal Band`,
        badgeStatus: 'neutral'
      };
    }
  }

  if (metricId === 'api_latency') {
    if (value > baseline * 1.35) {
      return {
        headline: `P95 API latency elevated to ${value.toFixed(0)}ms (normal: ${baseline.toFixed(0)}ms)—database read replica contention`,
        subhead: 'Auto-scaler spinning up 3 additional read replicas',
        badgeText: `▲ +${((value - baseline) / baseline * 100).toFixed(0)}% Latency`,
        badgeStatus: 'negative'
      };
    } else {
      return {
        headline: `P95 response times crisp at ${value.toFixed(0)}ms—well within 120ms SLA guarantee`,
        subhead: 'Edge cache hit ratio high at 94.2%',
        badgeText: `● Crisp (${value.toFixed(0)}ms)`,
        badgeStatus: 'positive'
      };
    }
  }

  // error_rate
  if (value > 1.2) {
    return {
      headline: `Elevated error rate at ${value.toFixed(2)}%—upstream payment webhook timeouts flagged`,
      subhead: 'Circuit breaker triggered on Frankfürt secondary gateway',
      badgeText: `▲ ${value.toFixed(2)}% Warning`,
      badgeStatus: 'negative'
    };
  } else {
    return {
      headline: `Near-zero error envelope at ${value.toFixed(2)}% across 2.4M handled requests`,
      subhead: 'Zero Sev-1 incidents logged in the rolling 24-hour window',
      badgeText: `● Nominal (${value.toFixed(2)}%)`,
      badgeStatus: 'positive'
    };
  }
}

/**
 * Computes Goal Pace & "Run-Rate" Weather Forecast
 */
export function calculateGoalPace(
  currentValue: number,
  targetGoal: number,
  timeProgressPct: number = 0.55 // e.g. 55% through the month
): PaceForecast {
  const currentProgress = (currentValue / targetGoal) * 100;
  const projectedAtCurrentRunRate = currentProgress / (timeProgressPct || 0.01);

  if (projectedAtCurrentRunRate >= 105) {
    return {
      status: 'ahead',
      badge: '🟢 Ahead of Pace — Projected 112% of Goal',
      projectedCrossingDate: 'Thursday at 2:00 PM',
      daysDeltaText: '3 days ahead of schedule',
      runRateText: `$${(currentValue * 1.18).toLocaleString('en-US', { maximumFractionDigits: 0 })} run-rate`,
      percentageComplete: Math.min(100, currentProgress)
    };
  } else if (projectedAtCurrentRunRate >= 98) {
    return {
      status: 'on_track',
      badge: '🟢 On Track — Projected to hit 100% by month-end',
      projectedCrossingDate: 'Friday at 6:30 PM',
      daysDeltaText: 'On schedule with 4% buffer',
      runRateText: `$${(currentValue * 1.04).toLocaleString('en-US', { maximumFractionDigits: 0 })} run-rate`,
      percentageComplete: Math.min(100, currentProgress)
    };
  } else {
    return {
      status: 'at_risk',
      badge: '🟡 Attention Required — Projected 91% of Goal',
      projectedCrossingDate: 'Following Monday (+3 days lag)',
      daysDeltaText: '3 days behind schedule',
      runRateText: `$${(currentValue * 0.91).toLocaleString('en-US', { maximumFractionDigits: 0 })} run-rate`,
      percentageComplete: Math.min(100, currentProgress)
    };
  }
}

/**
 * Simulates future projected curve based on "What-If" slider parameters
 */
export function generateWhatIfProjection(
  lastPoint: TelemetryPoint,
  scenario: WhatIfScenario,
  stepsCount: number = 30,
  intervalMs: number = 60000 // 1-minute steps into the future
): TelemetryPoint[] {
  const result: TelemetryPoint[] = [];
  const trafficMultiplier = 1 + scenario.trafficGrowth / 100;
  const conversionMultiplier = 1 + scenario.conversionLift / 100;
  const combinedMultiplier = trafficMultiplier * conversionMultiplier;

  let simulatedVal = lastPoint.value;
  let simulatedTimestamp = lastPoint.timestamp;

  for (let i = 1; i <= stepsCount; i++) {
    simulatedTimestamp += intervalMs;
    // Gradual curve bending toward the multiplier
    const progressFactor = Math.min(1, i / (stepsCount * 0.6));
    const effectiveMultiplier = 1 + (combinedMultiplier - 1) * progressFactor;
    
    // Add realistic minor sinusoidal variation
    const noise = Math.sin(i * 0.4) * 0.02 * simulatedVal;
    let projectedVal = lastPoint.baseline * effectiveMultiplier + noise;

    if (scenario.serverCap > 0 && projectedVal > scenario.serverCap) {
      projectedVal = scenario.serverCap; // Cap simulation
    }

    const d = new Date(simulatedTimestamp);
    const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    result.push({
      timestamp: simulatedTimestamp,
      timeLabel,
      value: projectedVal,
      baseline: lastPoint.baseline,
      confidenceBandLow: lastPoint.confidenceBandLow,
      confidenceBandHigh: lastPoint.confidenceBandHigh,
      isAnomaly: false,
    });
  }

  return result;
}
