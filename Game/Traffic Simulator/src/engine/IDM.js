/**
 * Intelligent Driver Model (IDM) & MOBIL Lane Changing Physics Engine
 * Formulated by Martin Treiber and Dirk Helbing.
 */

export const DRIVER_PROFILES = {
  COMMUTER: {
    name: 'Calm Commuter',
    v0: 16.67,       // ~60 km/h (m/s)
    T: 1.4,          // Safe time headway (seconds)
    s0: 4.0,         // Minimum standstill gap (meters)
    aMax: 1.4,       // Max comfortable acceleration (m/s^2)
    bComf: 1.8,      // Comfortable deceleration (m/s^2)
    bMax: 6.0,       // Emergency max deceleration (m/s^2)
    delta: 4,        // Acceleration exponent
    politeness: 0.3, // MOBIL politeness factor
    color: '#38bdf8' // Cyan
  },
  AGGRESSIVE: {
    name: 'Aggressive Tailgater',
    v0: 23.6,        // ~85 km/h
    T: 0.8,          // Tailgater headway
    s0: 2.0,         // Tight standstill gap
    aMax: 2.8,       // Rapid acceleration
    bComf: 3.0,      // Sharp braking
    bMax: 7.5,
    delta: 4,
    politeness: 0.05,
    color: '#f43f5e' // Crimson / Red
  },
  TRUCK: {
    name: 'Heavy Freight Truck',
    v0: 13.88,       // ~50 km/h
    T: 2.2,          // Long safe gap
    s0: 7.0,         // Extended bumper distance
    aMax: 0.7,       // Sluggish acceleration
    bComf: 1.2,      // Heavy vehicle braking
    bMax: 4.5,
    delta: 4,
    politeness: 0.6,
    color: '#fbbf24' // Amber
  },
  AUTONOMOUS_AV: {
    name: 'Autonomous AV (Platoon)',
    v0: 18.0,        // ~65 km/h
    T: 0.5,          // V2V Connected tight headway
    s0: 2.0,         // Low gap
    aMax: 2.0,       // Responsive
    bComf: 2.2,
    bMax: 6.5,
    delta: 4,
    politeness: 0.8, // High cooperation
    color: '#10b981' // Emerald Neon
  },
  STUDENT: {
    name: 'Cautious Student',
    v0: 12.5,        // ~45 km/h
    T: 2.4,          // Huge safety buffer
    s0: 6.0,
    aMax: 0.9,
    bComf: 1.4,
    bMax: 5.0,
    delta: 4,
    politeness: 0.5,
    color: '#a855f7' // Purple
  }
};

/**
 * Computes instantaneous longitudinal acceleration using IDM differential equation.
 * 
 * @param {number} v - Current vehicle speed (m/s)
 * @param {number|null} vLead - Lead vehicle speed (m/s) or null if free road
 * @param {number} netDistance - Net bumper-to-bumper distance to leader (m)
 * @param {Object} params - IDM parameters (v0, T, s0, aMax, bComf, delta, bMax)
 * @returns {number} Acceleration (m/s^2)
 */
export function calculateIDMAcceleration(v, vLead, netDistance, params) {
  const v0 = Math.max(0.1, params.v0);
  const T = Math.max(0.1, params.T);
  const s0 = Math.max(0.5, params.s0);
  const aMax = Math.max(0.1, params.aMax);
  const bComf = Math.max(0.1, params.bComf);
  const delta = params.delta || 4;
  const bMax = params.bMax || 6.5;

  // Free-flow acceleration component
  // aFree = aMax * (1 - (v / v0)^delta)
  const speedRatio = Math.max(0, v / v0);
  const aFree = aMax * (1 - Math.pow(speedRatio, delta));

  // If no lead vehicle in sight or distance is effectively infinite
  if (vLead === null || netDistance === Infinity || netDistance > 250) {
    return Math.max(-bMax, aFree);
  }

  // Interaction term
  // deltaV = v - vLead (positive when closing in on leader)
  const deltaV = v - vLead;
  
  // Desired dynamic equilibrium gap s*
  // s*(v, deltaV) = s0 + max(0, v*T + (v * deltaV) / (2 * sqrt(aMax * bComf)))
  const dynamicTerm = (v * deltaV) / (2 * Math.sqrt(aMax * bComf));
  const sStar = s0 + Math.max(0, v * T + dynamicTerm);

  // Interaction braking acceleration
  // aInt = -aMax * (s* / s)^2
  const actualGap = Math.max(0.01, netDistance);
  const aInt = -aMax * Math.pow(sStar / actualGap, 2);

  const rawAccel = aFree + aInt;

  // Clamp within realistic emergency braking boundaries
  return Math.max(-bMax, Math.min(aMax * 1.5, rawAccel));
}

/**
 * Evaluates MOBIL (Minimizing Overall Braking Induced by Lane Changes) criteria
 * Checks safety condition (b_follower >= -b_safe) and incentive condition
 */
export function evaluateMOBILChange({
  selfAccelCurrent,
  selfAccelTarget,
  newFollowerAccelCurrent,
  newFollowerAccelWithSelf,
  oldFollowerAccelCurrent,
  oldFollowerAccelWithoutSelf,
  politeness = 0.3,
  threshold = 0.2, // acceleration gain threshold (m/s^2)
  bSafe = 4.0      // safety limit (m/s^2)
}) {
  // Safety check: new follower must not be forced to brake harder than -bSafe
  if (newFollowerAccelWithSelf < -bSafe) {
    return false;
  }

  // Incentive check:
  // (a_self_new - a_self_old) + politeness * [(a_new_follower_new - a_new_follower_old) + (a_old_follower_new - a_old_follower_old)] > threshold
  const selfGain = selfAccelTarget - selfAccelCurrent;
  const followerLoss = newFollowerAccelWithSelf - newFollowerAccelCurrent;
  const oldFollowerGain = oldFollowerAccelWithoutSelf - oldFollowerAccelCurrent;

  const totalAdvantage = selfGain + politeness * (followerLoss + oldFollowerGain);

  return totalAdvantage > threshold;
}
