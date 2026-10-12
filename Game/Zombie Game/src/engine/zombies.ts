import { ZombieEntity, ZombieArchetype } from '../types/game';

export interface ZombieArchetypeSpec {
  type: ZombieArchetype;
  name: string;
  baseHp: number;
  baseSpeed: number;
  baseDamage: number;
  radius: number;
  color: string;
  eyeColor: string;
  scoreValue: number;
  scrapDropChance: number;
}

export const ZOMBIE_SPECS: Record<ZombieArchetype, ZombieArchetypeSpec> = {
  walker: {
    type: 'walker',
    name: 'Quarantine Infected',
    baseHp: 55,
    baseSpeed: 75,
    baseDamage: 12,
    radius: 14,
    color: '#3F4E4F',
    eyeColor: '#EF4444',
    scoreValue: 100,
    scrapDropChance: 0.55,
  },
  sprinter: {
    type: 'sprinter',
    name: 'Rabid Sprinter',
    baseHp: 38,
    baseSpeed: 145,
    baseDamage: 16,
    radius: 12,
    color: '#7F1D1D',
    eyeColor: '#F87171',
    scoreValue: 150,
    scrapDropChance: 0.65,
  },
  spitter: {
    type: 'spitter',
    name: 'Acid Spitter',
    baseHp: 75,
    baseSpeed: 60,
    baseDamage: 18,
    radius: 16,
    color: '#065F46',
    eyeColor: '#10B981',
    scoreValue: 220,
    scrapDropChance: 0.75,
  },
  brute: {
    type: 'brute',
    name: 'Armored Juggernaut',
    baseHp: 240,
    baseSpeed: 45,
    baseDamage: 32,
    radius: 24,
    color: '#1E293B',
    eyeColor: '#F59E0B',
    scoreValue: 400,
    scrapDropChance: 1.0,
  },
  screamer: {
    type: 'screamer',
    name: 'Horde Screamer',
    baseHp: 90,
    baseSpeed: 85,
    baseDamage: 14,
    radius: 15,
    color: '#4C1D95',
    eyeColor: '#C084FC',
    scoreValue: 300,
    scrapDropChance: 0.85,
  },
};

export function createZombie(type: ZombieArchetype, x: number, y: number, waveNumber: number): ZombieEntity {
  const spec = ZOMBIE_SPECS[type];
  // Health and damage scale slightly with wave
  const scale = 1 + (waveNumber - 1) * 0.12;
  const hp = Math.round(spec.baseHp * scale);

  return {
    id: `zombie_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    x,
    y,
    vx: 0,
    vy: 0,
    hp,
    maxHp: hp,
    speed: spec.baseSpeed * (0.95 + Math.random() * 0.1),
    damage: Math.round(spec.baseDamage * scale),
    radius: spec.radius,
    attackCooldownMs: 0,
    angle: 0,
    hitFlashTimerMs: 0,
  };
}
