// Puzzle definitions, asymmetric telemetry, and validation logic

export const INITIAL_GAME_STATE = {
  roomCode: 'SIGMA-7749',
  phase: 1, // 1: Harmonic Alignment, 2: Matrix Conduit, 3: Dual Interlock, 4: Escaped
  syncLock: 25.0, // Progress percentage
  countdownSeconds: 522.19, // 08:42.19
  isTimerRunning: true,
  overcharge: 22, // Nominal 22%
  hazardSafetyOn: true,
  
  // Player 1 (Cyan / Vex-01) State
  alpha: {
    frequency: 432.8,
    modulation: 74.2,
    gateTx: true,
    phaseSt: false,
    potCal: 18,
    activeNodes: ['A1', 'A3', 'B1', 'B2', 'C2', 'C3', 'C4'], // matching original visual state
    targetNodes: ['A1', 'B2', 'C3', 'C4'], // requirement for Phase 1
    keyHeld: false,
    keyHeldAt: null,
  },

  // Player 2 (Amber / Nyx-09) State
  beta: {
    hydraulicPressure: 14.2, // BAR
    fluidFlow: 88, // L/M
    packetInjectionRate: 92.0, // kP/s
    bypassDeg: 45, // 0, 45, 90, 135, 180
    fluxDiv: true,
    gateRel: true,
    activeHexes: ['H1', 'H2', 'H4', 'K2', 'K3', 'L1', 'L3', 'L4'],
    hexRotations: {
      H1: 0, H2: 60, H3: 0, H4: 180,
      K1: 0, K2: 60, K3: 120, K4: 0,
      L1: 0, L2: 0, L3: 120, L4: 60
    },
    targetHexRotations: { K2: 60, L3: 120, H4: 180 },
    keyHeld: false,
    keyHeldAt: null,
  },

  // Asymmetric Cipher Token for Stage 3
  cipher: {
    tokenPrompt: 'Ω-DELTA-7',
    glyphSymbols: ['Ψ', 'Ω', 'Δ', 'Σ'],
    solutionCode: '7749',
    enteredCode: '',
    codeUnlocked: false
  },

  // Live Logs Stream
  logs: [
    { id: 1, time: '14:02:11', sender: 'P1', text: 'Harmonizing Sector Theta (+12.4 rad/s)', color: 'text-primary' },
    { id: 2, time: '14:02:14', sender: 'P2', text: 'Diverting Aux Flux to Gate 02 Conduits', color: 'text-secondary' },
    { id: 3, time: '14:02:17', sender: 'SYS', text: 'Phase synchronizer matched in 18ms delta', color: 'text-tertiary' },
    { id: 4, time: '14:02:19', sender: 'P1', text: 'Standby for simultaneous Packet Discharge', color: 'text-primary' }
  ]
};

// Evaluate Phase 1: Harmonic Resonance Alignment
export function checkPhase1Completion(alphaState, betaState) {
  // P1 must have energized exactly the required nodes: A1, B2, C3, C4
  const required = ['A1', 'B2', 'C3', 'C4'];
  const hasAllNodes = required.every(node => alphaState.activeNodes.includes(node));
  const isGateArmed = alphaState.gateTx === true;
  const isBetaBypassValid = betaState.bypassDeg === 45 && betaState.fluxDiv === true;

  if (hasAllNodes && isGateArmed && isBetaBypassValid) {
    return {
      success: true,
      message: 'HARMONIC LOCK ACHIEVED: Frequency conduit stabilized with Beta hydraulic loop.'
    };
  }

  const errors = [];
  if (!hasAllNodes) errors.push('Resonance nodes A1, B2, C3, C4 must be active');
  if (!isGateArmed) errors.push('Aux switch GATE_TX must be ARMED');
  if (!isBetaBypassValid) errors.push('Chamber Beta BYPASS_DEG must be 45° with FLUX_DIV engaged');

  return {
    success: false,
    message: `PHASE 1 DESYNC: ${errors.join(', ')}`
  };
}

// Evaluate Phase 2: Conduit Matrix & Hex Power Routing
export function checkPhase2Completion(alphaState, betaState) {
  const k2Rot = betaState.hexRotations['K2'] === 60;
  const l3Rot = betaState.hexRotations['L3'] === 120;
  const h4Rot = betaState.hexRotations['H4'] === 180;
  const rateInRange = betaState.packetInjectionRate >= 88 && betaState.packetInjectionRate <= 96;
  const p1Modulation = alphaState.modulation >= 65 && alphaState.modulation <= 85;

  if (k2Rot && l3Rot && h4Rot && rateInRange && p1Modulation) {
    return {
      success: true,
      message: 'FLUX COHERENCE CONFIRMED: Energy conduit redirected to Nexus Core Interlock.'
    };
  }

  const errors = [];
  if (!k2Rot || !l3Rot || !h4Rot) errors.push('Hex deflectors K2 (60°), L3 (120°), H4 (180°) misaligned');
  if (!rateInRange) errors.push('Packet Injection Rate must be ~92 kP/s');
  if (!p1Modulation) errors.push('Chamber Alpha Modulation Coef must be ~74%');

  return {
    success: false,
    message: `PHASE 2 FLUX REJECTED: ${errors.join(', ')}`
  };
}

// Format seconds into MM:SS.MS string
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}
