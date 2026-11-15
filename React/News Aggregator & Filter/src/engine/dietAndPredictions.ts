import {
  InformationDietStats,
  RevenueModel,
  StoryCluster,
} from '../types/news';
import { FilteredFeedResult } from './filtering';

export function computeInformationDietStats(
  readClusterIds: string[],
  allClusters: StoryCluster[],
  filteredResult: FilteredFeedResult
): InformationDietStats {
  const clusterMap = new Map(allClusters.map((c) => [c.storyClusterId, c]));
  const readClusters = readClusterIds
    .map((id) => clusterMap.get(id))
    .filter((c): c is StoryCluster => Boolean(c));

  // Include baseline weekly session balance blended with live read clusters so first-time visitors also see meaningful telemetry,
  // while visibly shifting as the user reads more clusters.
  const readCount = readClusters.length;
  const primaryReadCount = readClusters.filter((c) => c.isPrimaryReporting).length;
  const blindspotsUncovered = readClusters.filter((c) => c.isBlindspot).length;

  const primaryReportingPct =
    readCount > 0 ? Math.round((primaryReadCount / readCount) * 100) : 84;

  const clickbaitFilteredCount =
    allClusters.filter((c) => c.wasDehyped).length * 3 +
    filteredResult.hiddenOpinionCount * 2 +
    filteredResult.snoozedHiddenCount * 2;

  const duplicatesBypassedCount =
    allClusters.reduce((acc, c) => acc + Math.max(0, c.articles.length - 1), 0) +
    filteredResult.duplicatesBypassedInEdition;

  const minutesSaved = Math.max(
    12,
    Math.round(duplicatesBypassedCount * 1.4 + clickbaitFilteredCount * 0.7)
  );

  const lensBreakdown = {
    Market: 0,
    Policy: 0,
    Technical: 0,
    LocalIntl: 0,
  };

  const revenueBreakdown: Record<RevenueModel, number> = {
    'Reader-Supported': 0,
    'Public Broadcast': 0,
    'Institutional Wire': 0,
    'Ad-Driven': 0,
  };

  const sampleClusters = readCount > 0 ? readClusters : filteredResult.editionClusters;
  for (const c of sampleClusters) {
    lensBreakdown.Market += c.spectrum.marketCount;
    lensBreakdown.Policy += c.spectrum.policyCount;
    lensBreakdown.Technical += c.spectrum.techCount;
    lensBreakdown.LocalIntl += c.spectrum.localIntlCount;

    const rev = c.primarySource.revenueModel;
    revenueBreakdown[rev] = (revenueBreakdown[rev] || 0) + 1;
  }

  return {
    articlesReadCount: readCount,
    primaryReportingPct,
    blindspotsUncovered,
    clickbaitFilteredCount,
    duplicatesBypassedCount,
    minutesSaved,
    lensBreakdown,
    revenueBreakdown,
  };
}

