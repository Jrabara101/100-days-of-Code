import {
  EditionMode,
  FeedFilters,
  SavedLens,
  SnoozedTopic,
  StoryCluster,
} from '../types/news';

export const EDITION_LIMITS: Record<EditionMode, number> = {
  '5min': 6,
  '15min': 12,
  stream: Number.POSITIVE_INFINITY,
};

export function isSnoozeActive(snooze: SnoozedTopic, nowMs: number = Date.now()): boolean {
  if (snooze.untilMajorResolution || snooze.mutedUntilIso === null) {
    return true;
  }
  return new Date(snooze.mutedUntilIso).getTime() > nowMs;
}

export function clusterMatchesKeyword(cluster: StoryCluster, keyword: string): boolean {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return false;

  const haystack = [
    cluster.calmHeadline,
    cluster.originalHeadline,
    cluster.topicPillar,
    cluster.coreFact,
    cluster.whatsNewToday,
    ...cluster.tags,
    ...cluster.entities,
    ...cluster.allSources.map((s) => s.name),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
}

export function parseSearchQuery(query: string): { includeTerms: string[]; excludeTerms: string[] } {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const includeTerms: string[] = [];
  const excludeTerms: string[] = [];

  for (const token of tokens) {
    if (token.startsWith('-') && token.length > 1) {
      excludeTerms.push(token.slice(1).toLowerCase());
    } else if (token.startsWith('+') && token.length > 1) {
      includeTerms.push(token.slice(1).toLowerCase());
    } else {
      includeTerms.push(token.toLowerCase());
    }
  }

  return { includeTerms, excludeTerms };
}

export interface FilteredFeedResult {
  matchingClusters: StoryCluster[];
  editionClusters: StoryCluster[];
  hiddenOpinionCount: number;
  snoozedHiddenCount: number;
  dehypedVisibleCount: number;
  duplicatesBypassedInEdition: number;
  activeSnoozes: SnoozedTopic[];
}

export function applyFeedFilters(
  allClusters: StoryCluster[],
  filters: FeedFilters,
  snoozes: SnoozedTopic[],
  savedLenses: SavedLens[],
  nowMs: number = Date.now()
): FilteredFeedResult {
  const activeSnoozes = snoozes.filter((s) => isSnoozeActive(s, nowMs));
  const activeLens = savedLenses.find((l) => l.id === filters.activeLensId);
  const { includeTerms, excludeTerms } = parseSearchQuery(filters.searchQuery);

  let snoozedHiddenCount = 0;
  let hiddenOpinionCount = 0;

  const matchingClusters = allClusters.filter((cluster) => {
    // 1. Snoozed keyword TTL check
    const isSnoozed = activeSnoozes.some((s) => clusterMatchesKeyword(cluster, s.keyword));
    if (isSnoozed) {
      snoozedHiddenCount += 1;
      return false;
    }

    // 2. Opinion & punditry filter (global or active lens)
    const enforceHideOpinion = filters.hideOpinion || Boolean(activeLens?.hideOpinion);
    if (enforceHideOpinion && cluster.isOpinionCluster) {
      hiddenOpinionCount += 1;
      return false;
    }

    // 3. Primary reporting filter
    const enforcePrimaryOnly = filters.primaryReportingOnly || Boolean(activeLens?.primaryOnly);
    if (enforcePrimaryOnly && !cluster.isPrimaryReporting) {
      return false;
    }

    // 4. Blindspot radar filter
    if (filters.blindspotOnly && !cluster.isBlindspot) {
      return false;
    }

    // 5. New developments delta filter
    if (filters.newDevelopmentsOnly && !cluster.hasUnreadDelta) {
      return false;
    }

    // 6. Active Saved Lens rules
    if (activeLens) {
      if (cluster.signalScore < activeLens.minSignalScore) {
        return false;
      }
      if (
        activeLens.readerSupportedOnly &&
        !cluster.allSources.some(
          (s) => s.revenueModel === 'Reader-Supported' || s.revenueModel === 'Public Broadcast'
        )
      ) {
        return false;
      }
      if (activeLens.includeTopics.length > 0) {
        const matchesAnyInclude = activeLens.includeTopics.some((topic) =>
          clusterMatchesKeyword(cluster, topic)
        );
        if (!matchesAnyInclude) return false;
      }
      if (activeLens.excludeTopics.length > 0) {
        const matchesAnyExclude = activeLens.excludeTopics.some((topic) =>
          clusterMatchesKeyword(cluster, topic)
        );
        if (matchesAnyExclude) return false;
      }
    }

    // 7. Live search + `-keyword` exclusions
    for (const term of includeTerms) {
      if (!clusterMatchesKeyword(cluster, term)) {
        return false;
      }
    }
    for (const term of excludeTerms) {
      if (clusterMatchesKeyword(cluster, term)) {
        return false;
      }
    }

    return true;
  });

  // Also count opinion articles across raw clusters when opinion filter is enabled for clear feedback
  if (filters.hideOpinion && hiddenOpinionCount === 0) {
    hiddenOpinionCount = allClusters.filter((c) => c.isOpinionCluster).length;
  }

  const limit = EDITION_LIMITS[filters.edition];
  const editionClusters = Number.isFinite(limit)
    ? matchingClusters.slice(0, limit)
    : matchingClusters;

  const dehypedVisibleCount = editionClusters.filter((c) => c.wasDehyped).length;
  const duplicatesBypassedInEdition = editionClusters.reduce(
    (sum, c) => sum + Math.max(0, c.articles.length - 1),
    0
  );

  return {
    matchingClusters,
    editionClusters,
    hiddenOpinionCount,
    snoozedHiddenCount,
    dehypedVisibleCount,
    duplicatesBypassedInEdition,
    activeSnoozes,
  };
}

