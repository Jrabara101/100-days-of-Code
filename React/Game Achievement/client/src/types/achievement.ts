export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'prismatic';
export type AchievementCategory = 'combat' | 'exploration' | 'mastery' | 'secrets';
export type RewardType = 'cosmetic_title' | 'profile_banner' | 'in_game_currency';

export interface MilestoneStep {
  id: string;
  label: string;
  current: number;
  target: number;
  isCompleted: boolean;
}

export interface AchievementReward {
  id: string;
  type: RewardType;
  title: string;
  value: string;
  isClaimed: boolean;
  unlockToken?: string;
  claimedAt?: string;
}

export interface UnlockReceipt {
  achievementId: string;
  unlockedAt: string;
  signature: string;
  sequenceNumber: number;
  verificationHash: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  secretHint?: string;
  isSecret: boolean;
  category: AchievementCategory;
  tier: BadgeTier;
  points: number;
  globalRarityPercent: number; // e.g. 3.4 for 3.4% of players
  steps: MilestoneStep[];
  reward?: AchievementReward;
  isUnlocked: boolean;
  unlockedAt: string | null;
  isPinned: boolean;
  receipt?: UnlockReceipt | null;
}

export interface AchievementTrackerState {
  achievements: Record<string, AchievementItem>;
  activeCategory: AchievementCategory | 'all';
  searchQuery: string;
  selectedAchievementId: string | null;
  totalPoints: number;
  unlockedCount: number;
  pinnedIds: string[];
}

export interface PassportData {
  playerId: string;
  handle: string;
  rankTitle: string;
  totalPoints: number;
  totalAchievements: number;
  unlockedCount: number;
  completionPercentage: number;
  topRarityPercent: number;
  verifiedReceiptsCount: number;
  passportHash: string;
  issuedAt: string;
}
