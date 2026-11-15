export type DomainLens = 'Market' | 'Policy' | 'Technical' | 'Local' | 'International';

export type RevenueModel =
  | 'Reader-Supported'
  | 'Ad-Driven'
  | 'Public Broadcast'
  | 'Institutional Wire';

export type EditorialStance = 'Center / Empirical' | 'Market-Focused' | 'Regulatory / Civic' | 'Builder / Technical' | 'Global Affairs';

export type EditionMode = '5min' | '15min' | 'stream';

export interface SourceProfile {
  id: string;
  name: string;
  shortCode: string;
  domain: string;
  ownership: string;
  revenueModel: RevenueModel;
  factualTrackRecord: 'Very High' | 'High' | 'Mixed';
  factualScore: number; // 0-100
  primaryLens: DomainLens;
  stance: EditorialStance;
  isMainstream: boolean;
  accentHex: string;
}

export interface RawArticle {
  id: string;
  seedEventKey: string; // Simulates shared event context in raw RSS ingestion before semantic clustering
  title: string;
  calmOverrideTitle?: string;
  sourceId: string;
  publishedAtIso: string;
  url: string;
  summary: string;
  excerpt: string;
  bodyNotes: string[];
  caveats: string[];
  entities: string[];
  topicPillar: string;
  tags: string[];
  isOpinion: boolean;
  isWireSyndication: boolean;
  outboundCitations: number;
  namedEntityDensity: number;
  originalQuotesCount: number;
  readingMinutes: number;
  loadedAdjectives: string[];
  lens: DomainLens;
  deltaBullet?: string;
  deltaTimestampIso?: string;
  forecastClaim?: {
    claim: string;
    targetDateIso: string;
    targetDateLabel: string;
    confidenceLabel: string;
  };
  timelineMilestones?: Array<{
    phase: 'How It Started' | 'The Turning Point' | 'Today’s News';
    dateLabel: string;
    summary: string;
  }>;
  synthesisHints?: {
    coreFact: string;
    whatsNew: string;
    keyTension: string;
    earlierContext: string;
  };
}

export interface SensationalismAnalysis {
  clickbaitScore: number; // 0-100
  calmHeadline: string;
  wasDehyped: boolean;
  triggers: string[];
}

export interface HypeRealityAnalysis {
  hasCaveatGap: boolean;
  divergenceLevel: 'Verified / Low Hype' | 'Moderate Caveat' | 'High Hype Gap';
  divergenceScore: number; // 0-100
  caveats: string[];
}

export interface PerspectiveItem {
  articleId: string;
  source: SourceProfile;
  lens: DomainLens;
  originalHeadline: string;
  calmHeadline: string;
  excerpt: string;
  loadedAdjectives: string[];
  publishedAtIso: string;
  url: string;
}

export interface CoverageSpectrum {
  marketCount: number;
  policyCount: number;
  techCount: number;
  localIntlCount: number;
  marketPct: number;
  policyPct: number;
  techPct: number;
  localIntlPct: number;
  topHeadlineByLens: Partial<Record<'Market' | 'Policy' | 'Technical', { sourceName: string; headline: string }>>;
}

export interface StoryCluster {
  storyClusterId: string;
  topicPillar: string;
  tags: string[];
  entities: string[];
  signalScore: number;
  isPrimaryReporting: boolean;
  isOpinionCluster: boolean;
  isBlindspot: boolean;
  blindspotReason?: string;
  blindspotSphere?: string;
  primarySource: SourceProfile;
  primaryArticle: RawArticle;
  derivativeCount: number;
  totalOutlets: number;
  allSources: SourceProfile[];
  articles: RawArticle[];
  latestPublishedAtIso: string;
  readingMinutes: number;
  // Headlines & Sensationalism
  originalHeadline: string;
  calmHeadline: string;
  clickbaitScore: number;
  wasDehyped: boolean;
  clickbaitTriggers: string[];
  // Hype vs Reality
  hypeReality: HypeRealityAnalysis;
  // Synthesis & Diff
  coreFact: string;
  whatsNewToday: string;
  keyTension: string;
  earlierContext: string;
  newDevelopmentsCount: number;
  hasUnreadDelta: boolean;
  // Spectrum & Comparison
  spectrum: CoverageSpectrum;
  perspectives: PerspectiveItem[];
  // Timeline & Reader Deep Dive
  historicalTimeline: Array<{
    phase: 'How It Started' | 'The Turning Point' | 'Today’s News';
    dateLabel: string;
    summary: string;
  }>;
  verifiableClaims: string[];
  forecast?: {
    id: string;
    claim: string;
    sourceName: string;
    targetDateIso: string;
    targetDateLabel: string;
    confidenceLabel: string;
  };
}

export interface SnoozedTopic {
  id: string;
  keyword: string;
  durationLabel: string;
  mutedUntilIso: string | null; // null means "Until Major Resolution"
  untilMajorResolution: boolean;
  createdAtIso: string;
  matchedCount?: number;
}

export interface SavedLens {
  id: string;
  name: string;
  description: string;
  includeTopics: string[];
  excludeTopics: string[];
  primaryOnly: boolean;
  hideOpinion: boolean;
  minSignalScore: number;
  readerSupportedOnly: boolean;
  isBuiltIn?: boolean;
}

export interface TrackedPrediction {
  id: string;
  storyClusterId: string;
  storyTitle: string;
  claim: string;
  sourceName: string;
  trackedAtIso: string;
  targetDateIso: string;
  targetDateLabel: string;
  status: 'Pending' | 'Due Today' | 'Confirmed' | 'Missed';
  note?: string;
}

export interface FeedFilters {
  edition: EditionMode;
  primaryReportingOnly: boolean;
  hideOpinion: boolean;
  calmHeadlines: boolean;
  blindspotOnly: boolean;
  newDevelopmentsOnly: boolean;
  searchQuery: string;
  activeLensId: string;
}

export interface InformationDietStats {
  articlesReadCount: number;
  primaryReportingPct: number;
  blindspotsUncovered: number;
  clickbaitFilteredCount: number;
  duplicatesBypassedCount: number;
  minutesSaved: number;
  lensBreakdown: {
    Market: number;
    Policy: number;
    Technical: number;
    LocalIntl: number;
  };
  revenueBreakdown: Record<RevenueModel, number>;
}

