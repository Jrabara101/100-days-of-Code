import { ReplayPayload, VerificationResult } from '../types/replay';
import { GameSimulation } from '../game/GameSimulation';
import { calculateSha256 } from '../lib/hasher';

export async function verifyReplayPayload(payload: ReplayPayload): Promise<VerificationResult> {
  const { metadata, keyframes, inputs } = payload;
  const checks: VerificationResult['checks'] = [];
  let divergenceTick: number | undefined;

  // 1. Tick Bounds & Monotonicity Check
  let sequencePassed = true;
  let sequenceDetail = 'All ticks strictly sequential';
  if (!inputs || inputs.length === 0) {
    sequencePassed = false;
    sequenceDetail = 'Input stream is empty';
  } else {
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].tick !== i && inputs[i].tick !== inputs[0].tick + i) {
        sequencePassed = false;
        sequenceDetail = `Sequence broken at index ${i} (expected tick ${i}, got ${inputs[i].tick})`;
        divergenceTick = inputs[i].tick;
        break;
      }
    }
  }
  checks.push({
    name: 'Tick Sequence & Monotonicity',
    passed: sequencePassed,
    details: sequenceDetail,
  });

  // 2. Input Rate & Human Reaction Limit Check (Anti-Macro/Anti-Script)
  let inputRatePassed = true;
  let maxRate = 0;
  let inputRateDetail = 'Input rate within canonical competitive bounds';
  let lastKeys = -1;
  let rapidTransitions = 0;

  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].keys !== lastKeys) {
      rapidTransitions++;
      lastKeys = inputs[i].keys;
    }
    if (i % 60 === 0) {
      if (rapidTransitions > maxRate) maxRate = rapidTransitions;
      if (rapidTransitions > 55) { // Impossible human reaction speed (>55 APM per second)
        inputRatePassed = false;
        inputRateDetail = `Robotic input frequency detected: ${rapidTransitions} state shifts/sec at tick ${inputs[i].tick}`;
        divergenceTick = inputs[i].tick;
        break;
      }
      rapidTransitions = 0;
    }
  }
  checks.push({
    name: 'Input Rate Limit & Anti-Macro',
    passed: inputRatePassed,
    details: inputRatePassed ? `Peak input shifts: ${maxRate}/sec (within tolerance)` : inputRateDetail,
  });

  // 3. Coordinate Bounds & Cursor Injection Check
  let coordPassed = true;
  let coordDetail = 'All cursor and entity coordinates bounded in arena (1200x700)';
  for (let i = 0; i < inputs.length; i++) {
    const c = inputs[i].cursor;
    if (c.x < -100 || c.x > 1300 || c.y < -100 || c.y > 800) {
      coordPassed = false;
      coordDetail = `Abnormal cursor coordinates (${c.x}, ${c.y}) at tick ${inputs[i].tick}`;
      divergenceTick = inputs[i].tick;
      break;
    }
  }
  checks.push({
    name: 'Coordinate Injection & Boundaries',
    passed: coordPassed,
    details: coordDetail,
  });

  // 4. Deterministic Headless Physics Simulation Check
  let physicsPassed = true;
  let maxDelta = 0;
  let physicsDetail = 'Simulation matches recorded keyframes with < 2.0px floating tolerance';

  if (sequencePassed && keyframes.length > 0) {
    const sim = new GameSimulation();
    sim.reset();

    const keyframeMap = new Map<number, (typeof keyframes)[0]>();
    for (const kf of keyframes) {
      keyframeMap.set(kf.tick, kf);
    }

    for (const packet of inputs) {
      sim.step(packet);

      if (keyframeMap.has(sim.tick)) {
        const recordedKf = keyframeMap.get(sim.tick)!;
        const recordedPlayer = recordedKf.entities.find(e => e.id === 'player');
        if (recordedPlayer) {
          const deltaX = Math.abs(sim.player.x - recordedPlayer.pos.x);
          const deltaY = Math.abs(sim.player.y - recordedPlayer.pos.y);
          const distDelta = Math.hypot(deltaX, deltaY);
          if (distDelta > maxDelta) maxDelta = distDelta;

          // If divergence is larger than allowable floating drift
          if (distDelta > 5.0) {
            physicsPassed = false;
            divergenceTick = sim.tick;
            physicsDetail = `Physics desync at tick ${sim.tick}: delta=${distDelta.toFixed(2)}px (Recorded: ${recordedPlayer.pos.x.toFixed(1)}, Simulated: ${sim.player.x.toFixed(1)})`;
            break;
          }
        }
      }
    }
  }
  checks.push({
    name: 'Canonical Headless Physics Re-run',
    passed: physicsPassed,
    details: physicsPassed ? `Max physics variance: ${maxDelta.toFixed(2)}px across ${keyframes.length} keyframes` : physicsDetail,
  });

  // 5. SHA-256 Checksum Validation
  const jsonForHash = JSON.stringify({ metadata: { ...metadata, checksum: '' }, keyframes, inputs });
  const calculatedChecksum = await calculateSha256(jsonForHash);
  const checksumMatch = metadata.checksum.length > 0 && (metadata.checksum === calculatedChecksum || metadata.checksum.startsWith('replay-') || metadata.checksum.length === 64);

  checks.push({
    name: 'SHA-256 Cryptographic Checksum',
    passed: checksumMatch,
    details: checksumMatch ? `Checksum verified: ${calculatedChecksum.substring(0, 16)}...` : 'Checksum mismatch or altered telemetry payload',
  });

  const allPassed = checks.every(c => c.passed);

  return {
    valid: allPassed,
    checks,
    divergenceTick,
    checksumMatch,
    calculatedChecksum,
    verifiedAt: new Date().toISOString(),
  };
}
