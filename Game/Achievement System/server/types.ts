export type BlockTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type BlockBiome = 'overworld' | 'nether' | 'crystal_depths' | 'celestial';

export interface AchievementReward {
  title: string;
  type: 'title' | 'material' | 'cosmetic' | 'relic' | 'blueprint';
  icon: string;
  amount?: number;
}

export interface AchievementNode {
  id: string;
  title: string;
  description: string;
  secretDescription?: string;
  isSecret: boolean;
  tier: BlockTier;
  biome: BlockBiome;
  points: number;
  gridCoordinates: { x: number; y: number };
  parentIds: string[];
  progress: {
    current: number;
    target: number;
    unit: string;
  };
  isUnlocked: boolean;
  unlockedAt: string | null;
  globalRarityPercent: number;
  icon: string;
  reward?: AchievementReward;
  unlockToken?: string;
  blockTexture: string;
}

export interface TelemetryEvent {
  event: string; // e.g. 'BLOCKS_PLACED', 'SIPHON_EXTRACT', 'HARVEST_LOGS', 'DEFEAT_LEVIATHAN'
  count?: number;
  increment?: number;
  targetNode?: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}
