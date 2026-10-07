export type EntityType = 'player' | 'enemy_scout' | 'enemy_interceptor' | 'boss' | 'asteroid' | 'powerup';
export type WeaponType = 'plasma_repeater' | 'scatter_shot' | 'homing_missile' | 'emp_beam';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Projectile {
  id: string;
  source: 'player' | 'enemy';
  pos: Vector2D;
  velocity: Vector2D;
  damage: number;
  radius: number;
  color: string;
  isHoming?: boolean;
  targetId?: string;
  lifeMs?: number;
  spawnTime?: number;
  weaponType?: WeaponType;
}

export interface PowerUpItem {
  id: string;
  pos: Vector2D;
  type: 'health_restore' | 'shield_boost' | 'weapon_upgrade' | 'overcharge_cell';
  synergyTag: WeaponType;
  durationMs?: number;
  radius: number;
  velocity: Vector2D;
}

export interface SpaceShooterState {
  status: 'IDLE' | 'DEPLOYING' | 'PLAYING' | 'PAUSED' | 'SECTOR_CLEAR' | 'HULL_DESTROYED';
  sectorId: string;
  sectorName: string;
  score: number;
  multiplier: number;
  hull: number; // 0 - 100
  maxHull: number;
  shield: number; // 0 - 100
  maxShield: number;
  grazeMeter: number; // 0 - 100
  grazeStreak: number;
  activeSynergies: WeaponType[];
  currentWave: number;
  totalWaves: number;
  threatLevel: 'NOMINAL' | 'ELEVATED' | 'CRITICAL' | 'TITAN DETECTED';
  dashCooldown: number; // 0 to 1
  empReady: boolean;
  stats: {
    totalShots: number;
    hitsLanded: number;
    totalGrazes: number;
    enemiesDestroyed: number;
    asteroidsShattered: number;
    durationMs: number;
  };
  settings: {
    screenShake: boolean;
    autoFire: boolean;
    soundFxVolume: number;
    masterVolume: number;
    sensitivity: number;
  };
}

export interface ShipSpec {
  id: 'interceptor' | 'dreadnought' | 'scout';
  name: string;
  classTitle: string;
  description: string;
  hull: number;
  shield: number;
  speed: number;
  grazeRadius: number; // e.g. 24 - 36
  coreRadius: number;  // micro-hitbox: 4px
  primaryWeapon: WeaponType;
  specialAbility: string;
  stats: {
    firepower: number;
    defense: number;
    agility: number;
    grazeAffinity: number;
  };
}

export interface TelemetryEvent {
  timeMs: number;
  action: 'thrust' | 'fire' | 'graze' | 'hit' | 'dash' | 'emp' | 'powerup_collect';
  x: number;
  y: number;
  hitTargetId?: string;
  extra?: number;
}
