import { AnomalyDriver, MetricId, TelemetryPoint } from '../types/telemetry';

export interface AnomalyResult {
  isAnomaly: boolean;
  severity: 'mild' | 'moderate' | 'critical';
  zScore: number;
  variancePct: number;
  drivers: AnomalyDriver[];
  explanation: string;
}

/**
 * Seasonal Baseline & Z-Score Anomaly Detector
 */
export function detectAnomaly(
  currentVal: number,
  baselineVal: number,
  rollingStdDev: number,
  metricId: MetricId
): AnomalyResult {
  const delta = currentVal - baselineVal;
  const zScore = rollingStdDev > 0 ? delta / rollingStdDev : 0;
  const absZ = Math.abs(zScore);
  const variancePct = baselineVal !== 0 ? (delta / baselineVal) * 100 : 0;

  const isAnomaly = absZ >= 2.2 || Math.abs(variancePct) > 25;
  let severity: 'mild' | 'moderate' | 'critical' = 'mild';

  if (absZ >= 3.5 || Math.abs(variancePct) > 50) {
    severity = 'critical';
  } else if (absZ >= 2.6 || Math.abs(variancePct) > 30) {
    severity = 'moderate';
  }

  // Generate top root-cause drivers based on metric and direction
  const drivers: AnomalyDriver[] = [];

  if (metricId === 'checkout_velocity') {
    if (variancePct > 0) {
      drivers.push(
        { dimension: 'Region: US-East (Virginia)', contribution: '+64% of surge', percentage: 64, color: '#38BDF8', category: 'region' },
        { dimension: 'Channel: Direct iOS App', contribution: '+24% of surge', percentage: 24, color: '#A855F7', category: 'device' },
        { dimension: 'Checkout Method: 1-Tap Apple Pay', contribution: 'Avg 1.8s faster', percentage: 12, color: '#10B981', category: 'payment' }
      );
    } else {
      drivers.push(
        { dimension: 'Gateway: Stripe EU Tier-1', contribution: '48% failed attempts', percentage: 48, color: '#F43F5E', category: 'payment' },
        { dimension: 'Client: Chrome v131 Mobile', contribution: '32% abandoned carts', percentage: 32, color: '#F59E0B', category: 'device' },
        { dimension: 'Region: Frankfürt Hub', contribution: '20% timeout surge', percentage: 20, color: '#A855F7', category: 'region' }
      );
    }
  } else if (metricId === 'active_sessions') {
    drivers.push(
      { dimension: 'Referral: Autumn Promo Campaign', contribution: '+58% incoming traffic', percentage: 58, color: '#38BDF8', category: 'marketing' as any },
      { dimension: 'Platform: Mobile Safari', contribution: '+27% session share', percentage: 27, color: '#A855F7', category: 'device' },
      { dimension: 'Geo: DACH & Western Europe', contribution: '+15% concurrents', percentage: 15, color: '#2DD4BF', category: 'region' }
    );
  } else if (metricId === 'api_latency') {
    drivers.push(
      { dimension: 'Microservice: /v2/inventory-lock', contribution: '+72% execution time', percentage: 72, color: '#F43F5E', category: 'service' },
      { dimension: 'DB Pool: Postgres Read Replica #3', contribution: 'Queue saturation at 94%', percentage: 18, color: '#F59E0B', category: 'service' },
      { dimension: 'Network: Inter-AZ packet drop', contribution: '10% retry overhead', percentage: 10, color: '#94A3B8', category: 'service' }
    );
  } else {
    // error_rate
    drivers.push(
      { dimension: 'HTTP 504: Upstream Gateway Timeout', contribution: '62% of errors', percentage: 62, color: '#F43F5E', category: 'service' },
      { dimension: 'Auth Token Expiry (JWT 401)', contribution: '25% repeat loops', percentage: 25, color: '#F59E0B', category: 'service' },
      { dimension: 'Client Edge: Sydney PoP', contribution: '13% route degradation', percentage: 13, color: '#A855F7', category: 'region' }
    );
  }

  const sign = variancePct >= 0 ? '+' : '';
  const explanation = `${sign}${variancePct.toFixed(1)}% vs. seasonal baseline (Z=${zScore.toFixed(2)}σ)`;

  return {
    isAnomaly,
    severity,
    zScore,
    variancePct,
    drivers,
    explanation,
  };
}
