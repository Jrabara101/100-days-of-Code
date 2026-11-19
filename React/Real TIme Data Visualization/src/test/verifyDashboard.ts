import { RingBuffer } from '../engine/ringBuffer';
import { downsampleLTTB } from '../engine/lttb';
import { detectAnomaly } from '../engine/anomaly';
import { generateHeadline, calculateGoalPace, generateWhatIfProjection } from '../engine/narrative';
import { TelemetryPoint, WhatIfScenario } from '../types/telemetry';

console.log('--- 🧪 RUNNING LUMINOUS TELEMETRY ENGINE VERIFICATION SUITE ---');

// 1. Ring Buffer Verification
console.log('\n[TEST 1] Ring Buffer Capacity & Retention:');
const buffer = new RingBuffer<number>(5);
for (let i = 1; i <= 8; i++) {
  buffer.push(i);
}
const arr = buffer.toArray();
console.log(`Pushed 1..8 into capacity-5 buffer. Result: [${arr.join(', ')}]`);
if (arr.length === 5 && arr[0] === 4 && arr[4] === 8) {
  console.log('✅ RingBuffer successfully preserves FIFO and prevents memory expansion.');
} else {
  throw new Error('RingBuffer failed capacity test');
}

// 2. LTTB Downsampler Verification
console.log('\n[TEST 2] LTTB Downsampler Extrema Preservation:');
const samplePoints: TelemetryPoint[] = [];
for (let i = 0; i < 500; i++) {
  const isSpike = i === 250;
  samplePoints.push({
    timestamp: 1700000000000 + i * 1000,
    timeLabel: `10:00:${i}`,
    value: isSpike ? 9999 : 100 + Math.sin(i * 0.1) * 20,
    baseline: 100,
    confidenceBandLow: 80,
    confidenceBandHigh: 120,
    isAnomaly: isSpike
  });
}

const downsampled = downsampleLTTB(samplePoints, 50);
console.log(`Downsampled 500 points to ${downsampled.length} points.`);
const foundSpike = downsampled.find((p) => p.value === 9999);
if (foundSpike) {
  console.log(`✅ LTTB preserved sharp peak (value: ${foundSpike.value} at ts: ${foundSpike.timestamp}).`);
} else {
  throw new Error('LTTB failed to preserve critical peak');
}

// 3. Seasonal Baseline & Z-Score Anomaly Detector
console.log('\n[TEST 3] Seasonal Baseline & Z-Score Anomaly Detection:');
const normalResult = detectAnomaly(4300, 4200, 350, 'checkout_velocity');
console.log(`Nominal reading (4300 vs 4200): isAnomaly=${normalResult.isAnomaly}, Z=${normalResult.zScore.toFixed(2)}`);

const anomalyResult = detectAnomaly(5800, 4200, 350, 'checkout_velocity');
console.log(`Surge reading (5800 vs 4200): isAnomaly=${anomalyResult.isAnomaly}, severity=${anomalyResult.severity}, Z=${anomalyResult.zScore.toFixed(2)}`);
console.log(`Top Driver: ${anomalyResult.drivers[0].dimension} (${anomalyResult.drivers[0].contribution})`);
if (anomalyResult.isAnomaly && anomalyResult.drivers.length >= 3) {
  console.log('✅ Anomaly detector correctly flagged surge with top 3 causal drivers.');
} else {
  throw new Error('Anomaly detector failed');
}

// 4. Plain-Language Headline Synthesis & Pace Forecast
console.log('\n[TEST 4] Plain-Language "So What?" Headline Synthesis:');
const headline = generateHeadline(
  'checkout_velocity',
  {
    timestamp: Date.now(),
    timeLabel: '10:42:00 AM',
    value: 5200,
    baseline: 4200,
    confidenceBandLow: 3500,
    confidenceBandHigh: 4900,
    isAnomaly: true
  },
  []
);
console.log(`Headline: "${headline.headline}"`);
console.log(`Badge: [${headline.badgeText}] (Status: ${headline.badgeStatus})`);
if (headline.headline.includes('Checkout conversion is up')) {
  console.log('✅ Headline synthesis translated metrics into clear human takeaways.');
} else {
  throw new Error('Headline synthesis failed');
}

// 5. Goal Pace & Run-Rate Weather Forecast
console.log('\n[TEST 5] Goal Pace & Run-Rate Weather:');
const pace = calculateGoalPace(4800, 5000, 0.5);
console.log(`Pace Badge: ${pace.badge}`);
console.log(`Projected Date: ${pace.projectedCrossingDate} (${pace.daysDeltaText})`);
if (pace.status === 'ahead') {
  console.log('✅ Goal pace run-rate correctly calculated early completion prediction.');
} else {
  throw new Error('Goal pace forecast failed');
}

// 6. What-If Scenario Projection
console.log('\n[TEST 6] Tactile What-If Forecast Simulator:');
const scenario: WhatIfScenario = {
  trafficGrowth: 25,
  conversionLift: 10,
  serverCap: 8000,
  active: true
};
const projection = generateWhatIfProjection(
  {
    timestamp: Date.now(),
    timeLabel: '10:42:00 AM',
    value: 4200,
    baseline: 4200,
    confidenceBandLow: 3500,
    confidenceBandHigh: 4900,
    isAnomaly: false
  },
  scenario,
  10,
  60000
);
console.log(`Generated ${projection.length} projected future points.`);
const lastProjected = projection[projection.length - 1];
console.log(`End Projected Value: ${lastProjected.value.toFixed(0)} (vs baseline 4200)`);
if (lastProjected.value > 5200) {
  console.log('✅ What-If scenario bent projection curve accurately according to lift inputs.');
} else {
  throw new Error('What-If projection failed');
}

console.log('\n🎯 ALL 6 CORE TELEMETRY & SYNTHESIS ENGINES PASSED WITH ZERO ERRORS.\n');
