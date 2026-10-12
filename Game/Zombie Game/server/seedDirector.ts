import { ZombieArchetype, WaveConfig } from '../src/types/game.js';

/**
 * Deterministic Mulberry32 32-bit PRNG
 */
export function createMulberry32(seedNum: number) {
  let s = seedNum;
  return function nextFloat(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hashes string seed into numeric seed for PRNG
 */
export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 123456789;
}

/**
 * Returns today's UTC daily seed string, e.g. "2026-10-09-QUARANTINE"
 */
export function getDailySeedString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}-QUARANTINE`;
}

/**
 * Generates deterministic wave configuration for given seed and wave number
 */
export function generateWaveConfig(seed: string, waveNumber: number): WaveConfig {
  const seedNum = stringToSeed(`${seed}_WAVE_${waveNumber}`);
  const rng = createMulberry32(seedNum);

  // Scaled enemy count
  const baseCount = 10;
  const countGrowth = Math.floor(waveNumber * 6 + Math.pow(waveNumber, 1.25) * 2);
  const zombieCount = Math.min(baseCount + countGrowth, 180);

  // Archetype distribution shifts as waves advance
  const composition: Record<ZombieArchetype, number> = {
    walker: 0,
    sprinter: 0,
    spitter: 0,
    brute: 0,
    screamer: 0,
  };

  for (let i = 0; i < zombieCount; i++) {
    const roll = rng();

    if (waveNumber === 1) {
      // Wave 1: mostly walkers, few sprinters
      if (roll < 0.85) composition.walker++;
      else composition.sprinter++;
    } else if (waveNumber === 2) {
      if (roll < 0.65) composition.walker++;
      else if (roll < 0.90) composition.sprinter++;
      else composition.spitter++;
    } else if (waveNumber < 5) {
      if (roll < 0.45) composition.walker++;
      else if (roll < 0.70) composition.sprinter++;
      else if (roll < 0.85) composition.spitter++;
      else if (roll < 0.95) composition.brute++;
      else composition.screamer++;
    } else {
      // Wave 5+: heavy mutant incursions
      if (roll < 0.30) composition.walker++;
      else if (roll < 0.55) composition.sprinter++;
      else if (roll < 0.75) composition.spitter++;
      else if (roll < 0.90) composition.brute++;
      else composition.screamer++;
    }
  }

  // Blackout events occur on waves 4, 7, 10, 13, etc. or if RNG roll triggers
  const hasBlackout = waveNumber >= 3 && (waveNumber % 3 === 1 || rng() < 0.3);
  const spawnIntervalMs = Math.max(300, 1400 - waveNumber * 80);

  return {
    waveNumber,
    zombieCount,
    composition,
    spawnIntervalMs,
    hasBlackout,
  };
}
