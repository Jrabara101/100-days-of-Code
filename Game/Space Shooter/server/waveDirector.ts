import { createMulberry32, stringToSeed } from './prng.js';

export interface WaveEnemy {
  type: 'enemy_scout' | 'enemy_interceptor' | 'enemy_cruiser';
  spawnDelayMs: number;
  xRatio: number; // 0.1 to 0.9 of screen width
  flightPath: 'linear' | 'sine' | 'dive' | 'pincer_left' | 'pincer_right';
  hp: number;
  fireRateMs: number;
  speed: number;
}

export interface WaveAsteroid {
  spawnDelayMs: number;
  xRatio: number;
  size: 'small' | 'medium' | 'large';
  vx: number;
  vy: number;
  hp: number;
}

export interface BossPhase {
  name: string;
  maxHp: number;
  maxShield: number;
  attacks: ('spread' | 'homing_barrage' | 'laser_beam' | 'drone_spawn')[];
}

export interface WaveConfig {
  waveIndex: number;
  title: string;
  durationMs: number;
  asteroids: WaveAsteroid[];
  enemies: WaveEnemy[];
  boss?: {
    name: string;
    phases: BossPhase[];
  };
  hazard?: 'none' | 'asteroid_gale' | 'ion_storm' | 'solar_radiation';
}

export interface SectorConfig {
  sectorId: string;
  sectorName: string;
  seed: number;
  totalWaves: number;
  modifier: string;
  waves: WaveConfig[];
}

export function generateSectorWaves(sectorSeed: number, totalWaves: number = 10): SectorConfig {
  const rng = createMulberry32(sectorSeed);
  const modifiers = [
    'Dense Asteroid Belt (+30% Scrap Drops)',
    'Ionized Nebula (-20% Shield Decay)',
    'High-Threat Sector (+40% Interceptor Speed)',
    'Hyper-Velocity Flux (+15% Weapon Overcharge Rate)',
    'Titan Heavy Patrol (Boss Armor Boosted)',
  ];
  const chosenModifier = modifiers[Math.floor(rng() * modifiers.length)];

  const waves: WaveConfig[] = [];

  for (let w = 1; w <= totalWaves; w++) {
    const isBossWave = w === 5 || w === 10;
    const enemyCount = isBossWave ? (w === 5 ? 4 : 0) : 4 + Math.floor(w * 2.2);
    const asteroidCount = 3 + Math.floor(rng() * 4) + (w % 3 === 0 ? 6 : 0);

    const waveEnemies: WaveEnemy[] = [];
    for (let i = 0; i < enemyCount; i++) {
      const typeRoll = rng();
      let type: WaveEnemy['type'] = 'enemy_scout';
      let hp = 40 + w * 12;
      let speed = 2.2 + rng() * 1.5;
      let fireRateMs = 1800 - Math.min(800, w * 70);

      if (w >= 3 && typeRoll > 0.5) {
        type = 'enemy_interceptor';
        hp = 70 + w * 18;
        speed = 3.0 + rng() * 1.8;
        fireRateMs = 1300 - Math.min(500, w * 50);
      } else if (w >= 6 && typeRoll > 0.8) {
        type = 'enemy_cruiser';
        hp = 180 + w * 30;
        speed = 1.4;
        fireRateMs = 2200;
      }

      const paths: WaveEnemy['flightPath'][] = ['linear', 'sine', 'dive', 'pincer_left', 'pincer_right'];
      const path = paths[Math.floor(rng() * paths.length)];

      waveEnemies.push({
        type,
        spawnDelayMs: 800 + i * (1200 - Math.min(600, w * 40)),
        xRatio: 0.15 + rng() * 0.7,
        flightPath: path,
        hp,
        fireRateMs,
        speed,
      });
    }

    const waveAsteroids: WaveAsteroid[] = [];
    for (let j = 0; j < asteroidCount; j++) {
      const sizeRoll = rng();
      const size = sizeRoll < 0.5 ? 'small' : sizeRoll < 0.85 ? 'medium' : 'large';
      waveAsteroids.push({
        spawnDelayMs: 400 + j * 900 + rng() * 600,
        xRatio: 0.08 + rng() * 0.84,
        size,
        vx: (rng() - 0.5) * 1.2,
        vy: 1.2 + rng() * 2.0,
        hp: size === 'small' ? 25 : size === 'medium' ? 60 : 150,
      });
    }

    let bossConfig = undefined;
    if (isBossWave) {
      if (w === 5) {
        bossConfig = {
          name: 'Vanguard Battlecruiser Mk-II',
          phases: [
            {
              name: 'Phase 1: Plasma Battery Salvo',
              maxHp: 800,
              maxShield: 400,
              attacks: ['spread', 'homing_barrage'] as ('spread' | 'homing_barrage')[],
            },
            {
              name: 'Phase 2: Overcharge Core Rupture',
              maxHp: 1200,
              maxShield: 600,
              attacks: ['spread', 'laser_beam', 'drone_spawn'] as ('spread' | 'laser_beam' | 'drone_spawn')[],
            },
          ],
        };
      } else {
        bossConfig = {
          name: 'Goliath Star-Dreadnought Titan',
          phases: [
            {
              name: 'Phase 1: Kinetic Railgun Battery',
              maxHp: 1500,
              maxShield: 800,
              attacks: ['spread', 'laser_beam'] as ('spread' | 'laser_beam')[],
            },
            {
              name: 'Phase 2: Swarm Launch & EMP Array',
              maxHp: 2000,
              maxShield: 1000,
              attacks: ['homing_barrage', 'drone_spawn', 'spread'] as ('homing_barrage' | 'drone_spawn' | 'spread')[],
            },
            {
              name: 'Phase 3: Hypernova Void Collapse',
              maxHp: 2800,
              maxShield: 1400,
              attacks: ['spread', 'homing_barrage', 'laser_beam', 'drone_spawn'] as ('spread' | 'homing_barrage' | 'laser_beam' | 'drone_spawn')[],
            },
          ],
        };
      }
    }

    let hazard: WaveConfig['hazard'] = 'none';
    if (w === 4) hazard = 'asteroid_gale';
    if (w === 7) hazard = 'ion_storm';
    if (w === 9) hazard = 'solar_radiation';

    waves.push({
      waveIndex: w,
      title: isBossWave ? (w === 5 ? 'MID-SECTOR TITAN ENCOUNTER' : 'APEX SECTOR BOSS: GOLIATH') : `SECTOR ASSAULT // WAVE 0${w}`,
      durationMs: isBossWave ? 65000 : 25000 + w * 2000,
      asteroids: waveAsteroids,
      enemies: waveEnemies,
      boss: bossConfig,
      hazard,
    });
  }

  return {
    sectorId: `SEC-${sectorSeed.toString(16).toUpperCase()}`,
    sectorName: `Sector ${sectorSeed.toString(16).slice(0, 4).toUpperCase()}`,
    seed: sectorSeed,
    totalWaves,
    modifier: chosenModifier,
    waves,
  };
}
