export type SentimentTier = 
  | 'OVERWHELMINGLY_POSITIVE' 
  | 'VERY_POSITIVE' 
  | 'MIXED' 
  | 'MOSTLY_NEGATIVE';

export interface GameTag {
  name: string;
  weight: number; // 0.0 to 1.0
}

export interface MediaChapter {
  time: number; // in seconds
  title: string;
  label: string;
}

export interface PriceHistoryPoint {
  date: string;
  priceCents: number;
  discountPercent: number;
  isLowest?: boolean;
}

export interface PatchMilestone {
  version: string;
  releaseDate: string;
  title: string;
  description: string;
  isMajor: boolean;
}

export interface HardwareProfile {
  id: string;
  name: string;
  category: 'handheld' | 'laptop' | 'desktop' | 'integrated';
  resolution: string;
  badgeLabel: string;
}

export interface GameTitle {
  id: string;
  slug: string;
  title: string;
  developer: string;
  publisher: string;
  releaseDate: string;
  priceCents: number;
  discountPercent: number;
  historicalLowCents: number;
  concurrentPlayers: number;
  medianPlaytimeHours: number;
  mainStoryHours?: number;
  completionistHours?: number;
  costPerHourCents?: number;
  deckCompatibility: 'VERIFIED' | 'PLAYABLE' | 'UNSUPPORTED';
  batteryHours?: { [hardwareProfileId: string]: number };
  estimatedFps: { [hardwareProfileId: string]: number };
  tags: GameTag[];
  media: {
    capsuleUrl: string;
    heroBannerUrl: string;
    microTrailerWebmUrl: string;
    screenshots: string[];
    chapters?: MediaChapter[];
  };
  reviewSummary: {
    allTimeScore: number; // 0 - 100 percentage positive
    recentScore: number;
    totalReviews: number;
    tier: SentimentTier;
  };
  priceHistory?: PriceHistoryPoint[];
  patchNotes?: PatchMilestone[];
  anomalyDetected?: boolean;
  anomalyMessage?: string;
  demoType?: 'space-shooter' | 'dungeon-crawler' | 'orbital-builder';
}

export interface PlayerReview {
  id: string;
  gameId: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string;
    gamesOwned: number;
  };
  recommended: boolean;
  playtimeAtReviewHours: number;
  playtimeTotalHours: number;
  writtenDuringPatch: string; // e.g., "v1.4.2"
  content: string;
  helpfulCount: number;
  funnyCount: number;
  receivedForFree: boolean;
  createdAt: string;
}

export interface ReviewTimelineBucket {
  period: string; // e.g. "2026-01" or "Patch v1.2"
  positive: number;
  negative: number;
  ratio: number;
  total: number;
  associatedPatch?: PatchMilestone;
  isAnomaly?: boolean;
}

export interface ReviewsResponse {
  gameId: string;
  totalCount: number;
  filteredCount: number;
  anomalyDetected: boolean;
  anomalyMessage?: string;
  timelineBuckets: ReviewTimelineBucket[];
  reviews: PlayerReview[];
  patchVersions: string[];
}

export interface DiscoveryQueryParams {
  search?: string;
  alchemyTags?: { name: string; weight: number }[];
  excludeTags?: string[];
  maxPriceCents?: number;
  deckVerifiedOnly?: boolean;
  minScore?: number;
  hardwareProfileId?: string;
  sortBy?: 'alchemy' | 'popular' | 'topRated' | 'discount' | 'priceAsc';
  limit?: number;
  offset?: number;
}

export interface DiscoveryResponse {
  games: (GameTitle & { similarityScore?: number })[];
  total: number;
  appliedAlchemy: { name: string; weight: number }[];
  availableTags: string[];
}

export interface SquadRoom {
  code: string;
  members: string[];
  swipedYes: { [gameId: string]: string[] }; // gameId -> list of usernames
  overlapMatches: string[]; // gameIds everyone voted yes
}
