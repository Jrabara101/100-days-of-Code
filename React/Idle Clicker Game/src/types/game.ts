export interface BigNumberValue {
  mantissa: number;
  exponent: number;
}

export type UpgradeTarget = 'CLICK' | 'GENERATOR' | 'GLOBAL' | 'ANOMALY';

export interface GeneratorConfig {
  id: string;
  name: string;
  category?: 'robotics' | 'nuclear' | 'cosmic' | 'exotic';
  description?: string;
  baseCost: string; // Serialized BigNumber
  baseProductionPerSec: string; // Serialized BigNumber
  costExponent: number; // typically 1.15
  owned: number;
  unlocked: boolean;
  flavor?: string;
}

export interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  cost: string;
  targetType: UpgradeTarget;
  targetId?: string; // id of generator if targeted
  multiplier: number;
  isPurchased: boolean;
  requiredGeneratorId?: string;
  requiredGeneratorCount?: number;
  tier: number;
  icon?: string;
}

export interface PrestigePerk {
  id: string;
  name: string;
  description: string;
  shardCost: number;
  level: number;
  maxLevel: number;
  effectMultiplier: number; // e.g. 0.05 (+5% per level)
  x?: number; // relative coordinate for Constellation Map (0-100)
  y?: number; // relative coordinate for Constellation Map (0-100)
  connections?: string[]; // IDs of connected perks for celestial constellation lines
}

export interface AnomalyCollectible {
  id: string;
  type: 'QUANTUM_RIFT' | 'SOLAR_FLARE' | 'VOID_SHARD' | 'TACHYON_BURST';
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  bonusMultiplier: number;
  durationSeconds: number;
  progress: number;
  spawnTime: number;
  lifetime: number;
}

export interface IdleGameState {
  currency: string;
  lifetimeCurrency: string;
  currencyPerSec: string;
  prestigeCurrency: number; // Singularity Shards
  lastSavedAt: number;
  activeFrenzy: {
    multiplier: number;
    expiresAt: number;
    durationTotal: number;
    label: string;
  } | null;
  generators: Record<string, GeneratorConfig>;
  upgrades: Record<string, UpgradeConfig>;
  prestigePerks: Record<string, PrestigePerk>;
  settings: {
    notation: 'scientific' | 'engineering' | 'standard';
    soundEnabled: boolean;
    floatingNumbers: boolean;
    particleIntensity: 'high' | 'low';
  };
  stats: {
    totalClicks: number;
    totalManualEarned: string;
    totalAnomaliesCaught: number;
    highestCps: string;
    totalPrestigeCount: number;
    gameStartTime: number;
  };
  playerHandle: string;
  playerId: string;
}

export type BuyMultiplier = 1 | 10 | 100 | 'MAX';
