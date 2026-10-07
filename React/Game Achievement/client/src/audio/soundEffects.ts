import confetti from 'canvas-confetti';
import { BadgeTier } from '../types/achievement';

// Lazy Web Audio Context
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a celebratory milestone unlock chime based on badge tier
 */
export function playAchievementChime(tier: BadgeTier = 'silver') {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.2, now);
  masterGain.connect(ctx.destination);

  let frequencies: number[] = [523.25, 659.25, 783.99]; // C5, E5, G5 default
  let stagger = 0.08;
  let decay = 1.2;

  if (tier === 'bronze') {
    frequencies = [440, 554.37, 659.25]; // A4, C#5, E5
    stagger = 0.1;
    decay = 0.9;
  } else if (tier === 'silver') {
    frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    stagger = 0.07;
    decay = 1.4;
  } else if (tier === 'gold') {
    frequencies = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    stagger = 0.06;
    decay = 1.8;
  } else if (tier === 'prismatic') {
    frequencies = [587.33, 739.99, 880.0, 1108.73, 1479.98, 1760.0]; // Radiant D Maj7 add9
    stagger = 0.05;
    decay = 2.4;
  }

  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = tier === 'prismatic' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now + index * stagger);

    // Subtle pitch rise
    osc.frequency.exponentialRampToValueAtTime(freq * 1.01, now + index * stagger + 0.15);

    noteGain.gain.setValueAtTime(0, now + index * stagger);
    noteGain.gain.linearRampToValueAtTime(0.4, now + index * stagger + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + index * stagger + decay);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(now + index * stagger);
    osc.stop(now + index * stagger + decay);
  });
}

/**
 * Synthesizes a physical chest crack & vault opening fanfare
 */
export function playChestOpenFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // 1. Mechanical clunk / sub-thud
  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thudOsc.type = 'triangle';
  thudOsc.frequency.setValueAtTime(140, now);
  thudOsc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
  thudGain.gain.setValueAtTime(0.4, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  thudOsc.connect(thudGain);
  thudGain.connect(ctx.destination);
  thudOsc.start(now);
  thudOsc.stop(now + 0.35);

  // 2. High-energy radiant beam burst
  const chord = [440, 554.37, 659.25, 880, 1108.73];
  chord.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + 0.18 + idx * 0.05;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 1.3);
  });
}

/**
 * Subtle tactile UI click tick
 */
export function playUiTick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

/**
 * Anti-tamper warning alert sound
 */
export function playTamperAlertSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.setValueAtTime(160, now + 0.12);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.36);
}

/**
 * Fires vibrant celebratory confetti particles tailored to badge tier or reward
 */
export function triggerUnlockConfetti(tier?: BadgeTier) {
  if (typeof window === 'undefined') return;

  let colors = ['#F59E0B', '#FBBF24', '#10B981', '#3B82F6'];

  if (tier === 'prismatic') {
    colors = ['#A855F7', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#FFFFFF'];
  } else if (tier === 'gold') {
    colors = ['#F59E0B', '#FCD34D', '#D97706', '#FFFFFF'];
  } else if (tier === 'bronze') {
    colors = ['#D97706', '#B45309', '#F59E0B'];
  }

  // Dual-burst confetti from sides
  confetti({
    particleCount: 50,
    angle: 60,
    spread: 65,
    origin: { x: 0.15, y: 0.75 },
    colors: colors,
    zIndex: 9999
  });

  confetti({
    particleCount: 50,
    angle: 120,
    spread: 65,
    origin: { x: 0.85, y: 0.75 },
    colors: colors,
    zIndex: 9999
  });
}
