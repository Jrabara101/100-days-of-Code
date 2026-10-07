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
  gridCoordinates: { x: number; y: number }; // 2D layout coordinates in px (x, y)
  parentIds: string[];
  progress: {
    current: number;
    target: number;
    unit: string;
  };
  isUnlocked: boolean;
  unlockedAt: string | null;
  globalRarityPercent: number;
  // Extra visual and gameplay properties
  icon: string;
  reward?: AchievementReward;
  unlockToken?: string; // Cryptographic HMAC token minted by server
  blockTexture: string; // Biome material texture motif
}

export type StateMachineStage = 'IDLE' | 'INSPECTING_BLOCK' | 'CLAIMING_REWARD' | 'FILTERING';

export interface AchievementSystemState {
  nodes: Record<string, AchievementNode>;
  selectedNodeId: string | null;
  activeBiomeFilter: BlockBiome | 'all';
  viewport: { x: number; y: number; zoom: number };
  totalPoints: number;
  unlockedCount: number;
  recentUnlocks: string[];
}

export interface TelemetryEventPayload {
  event: string;
  count?: number;
  increment?: number;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface WebSocketMessage {
  type: 'INIT_STATE' | 'TELEMETRY_ACK' | 'ACHIEVEMENT_UNLOCKED' | 'ACHIEVEMENT_PROGRESS' | 'PULSE_CONDUIT';
  nodes?: Record<string, AchievementNode>;
  achievementId?: string;
  achievement?: AchievementNode;
  node?: AchievementNode;
  token?: string;
  message?: string;
  pulsePath?: string[]; // Chain of parent -> child IDs to pulse
  recentUnlocks?: string[];
  totalPoints?: number;
  unlockedCount?: number;
}

export interface PlinthState {
  size: 3 | 5; // 3x3 or 5x5
  slots: Record<number, string | null>; // slotIndex -> achievementId
  title: string;
  badgeStyle: 'cyber' | 'hologram' | 'obsidian' | 'gold';
}
