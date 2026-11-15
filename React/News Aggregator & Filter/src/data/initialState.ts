import { SavedLens, SnoozedTopic, TrackedPrediction } from '../types/news';

export const BUILT_IN_LENSES: SavedLens[] = [
  {
    id: 'lens-all',
    name: 'All Signal',
    description: 'Balanced multi-lens feed controlled by the signal-to-noise ribbon',
    includeTopics: [],
    excludeTopics: [],
    primaryOnly: false,
    hideOpinion: false,
    minSignalScore: 0,
    readerSupportedOnly: false,
    isBuiltIn: true,
  },
  {
    id: 'lens-macro',
    name: 'Macro & Markets',
    description: 'Central banking, trade corridors, capital flows, and commodities',
    includeTopics: ['Macro & Markets', 'Central Banking', 'Trade Policy', 'Semiconductor Supply Chain'],
    excludeTopics: ['Stock Price Speculation', 'Celebrity Gossip'],
    primaryOnly: false,
    hideOpinion: true,
    minSignalScore: 60,
    readerSupportedOnly: false,
    isBuiltIn: true,
  },
  {
    id: 'lens-silicon',
    name: 'AI & Silicon',
    description: 'Chip packaging, cloud infrastructure, cybersecurity, and AI governance',
    includeTopics: ['Semiconductor Supply Chain', 'Cloud Infrastructure', 'AI Governance', 'Cybersecurity'],
    excludeTopics: ['Celebrity Gossip'],
    primaryOnly: false,
    hideOpinion: true,
    minSignalScore: 60,
    readerSupportedOnly: false,
    isBuiltIn: true,
  },
  {
    id: 'lens-energy',
    name: 'Clean Energy & Policy',
    description: 'Grid storage, direct lithium extraction, climate telemetry, and EU/US rules',
    includeTopics: ['Clean Energy', 'Grid Storage', 'Climate Data', 'Battery Metals'],
    excludeTopics: [],
    primaryOnly: false,
    hideOpinion: true,
    minSignalScore: 60,
    readerSupportedOnly: false,
    isBuiltIn: true,
  },
  {
    id: 'lens-civic',
    name: 'Local Civic & Health',
    description: 'Municipal transit, public health surveillance, and reader-funded reporting',
    includeTopics: ['Local Civic', 'Urban Transit', 'Public Health', 'Civic Tech'],
    excludeTopics: [],
    primaryOnly: true,
    hideOpinion: true,
    minSignalScore: 65,
    readerSupportedOnly: false,
    isBuiltIn: true,
  },
];

export const INITIAL_SNOOZES: SnoozedTopic[] = [
  {
    id: 'snooze-gossip-default',
    keyword: 'Celebrity Gossip',
    durationLabel: '7 Days',
    mutedUntilIso: '2026-11-18T09:00:00Z',
    untilMajorResolution: false,
    createdAtIso: '2026-11-11T08:30:00Z',
  },
];

// Simulates stories the reader checked yesterday evening so multi-day updates surface clean delta badges today
export const INITIAL_LAST_READ_MAP: Record<string, string> = {
  'cluster-semiconductors-trade-tsmc': '2026-11-10T20:00:00Z',
  'cluster-labor-ai-governance-propublica': '2026-11-10T21:15:00Z',
  'cluster-clean-energy-supply-chain-direct-lithium-extraction': '2026-11-10T19:30:00Z',
};

export const INITIAL_READ_CLUSTER_IDS: string[] = [
  'cluster-global-trade-logistics-asean',
];

export const INITIAL_TRACKED_PREDICTIONS: TrackedPrediction[] = [
  {
    id: 'pred-cbam-nov2026',
    storyClusterId: 'prior-eu-cbam-registry',
    storyTitle: 'EU Carbon Border Registry Phase-In Compliance Audit',
    claim: 'Over 80% of Tier-1 industrial steel importers submit verified quarterly emissions filings by Nov 11, 2026',
    sourceName: 'Financial Times',
    trackedAtIso: '2026-08-14T10:00:00Z',
    targetDateIso: '2026-11-11T00:00:00Z',
    targetDateLabel: 'Nov 11, 2026',
    status: 'Due Today',
    note: 'Check European Commission DG TAXUD compliance bulletin today.',
  },
  {
    id: 'pred-grid-interconnect-oct2026',
    storyClusterId: 'prior-ferc-queue-reform',
    storyTitle: 'Grid Interconnection Queue Streamlining Milestone',
    claim: 'PJM and MISO clear 35 GW of cluster-study backlog ahead of Q4 2026 window',
    sourceName: 'Ars Technica',
    trackedAtIso: '2026-06-02T09:00:00Z',
    targetDateIso: '2026-10-31T00:00:00Z',
    targetDateLabel: 'Oct 31, 2026',
    status: 'Confirmed',
    note: 'Verified: 38.4 GW cleared across Q3/Q4 cluster studies.',
  },
];
