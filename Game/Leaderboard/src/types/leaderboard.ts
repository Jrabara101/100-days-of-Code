export type Tier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'master';

export type Timeframe = 'daily' | 'weekly' | 'alltime';

export type Category = 'global' | 'friends' | 'regional' | 'favorites';

export type Region = 'all' | 'na' | 'eu' | 'ap' | 'sa';

export interface MatchResult {
  id: string;
  outcome: 'victory' | 'defeat';
  score: string;
  map: string;
  agent: string;
  kda: string;
  date: string;
}

export interface PlayerBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LeaderboardItem {
  rank: number;
  previousRank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
  tier: Tier;
  winRate: number;
  country: string;
  // Extended competitive gaming profile fields
  tag: string;
  region: 'na' | 'eu' | 'ap' | 'sa';
  matches: number;
  kdRatio: number;
  headshotPct: number;
  favoriteAgent: string;
  streak: number;
  recentMatches: MatchResult[];
  badges: string[];
  isFriend?: boolean;
  isBookmarked?: boolean;
  timeframeScores: {
    daily: number;
    weekly: number;
    alltime: number;
  };
}

export interface LeaderboardFilters {
  searchQuery: string;
  timeframe: Timeframe;
  category: Category;
  region: Region;
  tier: 'all' | Tier;
  sortBy: 'rank' | 'username' | 'score' | 'winRate' | 'kdRatio';
  sortDirection: 'asc' | 'desc';
}

export interface SeasonInfo {
  id: number;
  name: string;
  title: string;
  badge: string;
  champion: {
    username: string;
    tag: string;
    avatarUrl: string;
    country: string;
    finalScore: number;
    winRate: number;
    favoriteAgent: string;
  };
  runnerUp: {
    username: string;
    tag: string;
    finalScore: number;
  };
  thirdPlace: {
    username: string;
    tag: string;
    finalScore: number;
  };
  endDate: string;
  totalParticipants: number;
}
