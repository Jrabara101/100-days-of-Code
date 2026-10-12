export type ZombieArchetype = 'walker' | 'sprinter' | 'spitter' | 'brute' | 'screamer';
export type ElementalType = 'none' | 'incendiary' | 'cryo' | 'shock';

export interface WeaponEntity {
  id: string;
  name: string;
  baseDamage: number;
  fireRateRps: number;
  clipSize: number;
  currentAmmo: number;
  reloadTimeMs: number;
  piercingCount: number;
  elemental: ElementalType;
  tier: number;
  bulletSpeed: number;
  spreadAngle: number; // in radians
  pelletCount: number;
  kickback: number;
  range: number;
  description: string;
}

export interface ZombieEntity {
  id: string;
  type: ZombieArchetype;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  isFrozen?: boolean;
  frozenTimerMs?: number;
  burnDurationMs?: number;
  burnTickTimerMs?: number;
  shockChainTimerMs?: number;
  attackCooldownMs: number;
  hitFlashTimerMs?: number;
  angle: number;
}

export interface BarricadeEntity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
}

export interface FloodlightEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
  angle: number;
  fov: number; // in radians
  active: boolean;
}

export interface TripwireEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
  damage: number;
  elemental: ElementalType;
  armed: boolean;
}

export interface ScrapDropEntity {
  id: string;
  x: number;
  y: number;
  value: number;
  type: 'scrap' | 'biomass' | 'ammo';
  radius: number;
  lifeMs: number;
}

export interface ProjectileEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  penetrationRemaining: number;
  elemental: ElementalType;
  rangeRemaining: number;
  radius: number;
  color: string;
  isEnemy?: boolean;
}

export interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface BloodDecalEntity {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
}

export interface DamageNumberEntity {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  life: number;
}

export interface TelemetryEvent {
  timeMs: number;
  action: 'shot' | 'hit' | 'kill' | 'reload' | 'damage_taken' | 'wave_cleared';
  x: number;
  y: number;
  weaponId: string;
  hitCount: number;
  damageDealt?: number;
}

export interface RunSubmission {
  playerHandle: string;
  runSeed: string;
  durationMs: number;
  wavesCleared: number;
  scrapCollected: number;
  finalScore: number;
  favoriteWeapon?: string;
  telemetry: TelemetryEvent[];
}

export interface ActiveReloadState {
  isReloading: boolean;
  progress: number; // 0 to 1
  durationMs: number;
  startTime: number;
  sweetSpotStart: number; // e.g. 0.40
  sweetSpotEnd: number;   // e.g. 0.65
  success: boolean | null;
}

export interface ZombieSurvivalGameState {
  status: 'IDLE' | 'WAVE_ACTIVE' | 'WAVE_INTERMISSION' | 'PAUSED' | 'GAME_OVER';
  seed: string;
  currentWave: number;
  enemiesRemaining: number;
  totalEnemiesInWave: number;
  isBlackout: boolean;
  blackoutTimerMs: number;
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    hp: number;
    maxHp: number;
    armor: number;
    maxArmor: number;
    scrap: number;
    weapons: WeaponEntity[];
    activeWeaponIndex: number;
    isFiring: boolean;
    activeReload: ActiveReloadState;
  };
  barricades: BarricadeEntity[];
  floodlights: FloodlightEntity[];
  tripwires: TripwireEntity[];
  stats: {
    totalKills: number;
    killsByType: Record<ZombieArchetype, number>;
    shotsFired: number;
    shotsHit: number;
    timeSurvivedMs: number;
    causeOfDeath: string;
  };
}

export interface WaveConfig {
  waveNumber: number;
  zombieCount: number;
  composition: Record<ZombieArchetype, number>;
  spawnIntervalMs: number;
  hasBlackout: boolean;
}

export interface LeaderboardEntry {
  id: number;
  player_handle: string;
  run_seed: string;
  waves_cleared: number;
  duration_ms: number;
  scrap_collected: number;
  final_score: number;
  favorite_weapon: string;
  verified: number;
  created_at: string;
}
