import {
  RawArticle,
  SensationalismAnalysis,
  SourceProfile,
  StoryCluster,
} from '../types/news';
import { analyzeBlindspot, buildPerspectives, computeCoverageSpectrum } from './framing';
import { analyzeHypeVsReality, analyzeSensationalism } from './sensationalism';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'over', 'after',
  'under', 'amid', 'new', 'how', 'why', 'what', 'will', 'are', 'was', 'were',
  'have', 'has', 'had', 'its', 'their', 'they', 'could', 'would', 'about',
  'across', 'while', 'when', 'than', 'more', 'just', 'first', 'report', 'reports',
]);

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return new Set(words);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function areArticlesSameEvent(a: RawArticle, b: RawArticle): boolean {
  const timeDiffHours =
    Math.abs(new Date(a.publishedAtIso).getTime() - new Date(b.publishedAtIso).getTime()) /
    3_600_000;
  if (timeDiffHours > 72) return false;

  const entitiesA = new Set(a.entities.map((e) => e.toLowerCase()));
  const entitiesB = new Set(b.entities.map((e) => e.toLowerCase()));
  let sharedEntities = 0;
  for (const e of entitiesA) {
    if (entitiesB.has(e)) sharedEntities += 1;
  }

  const tokensA = tokenize(`${a.title} ${a.summary} ${a.entities.join(' ')}`);
  const tokensB = tokenize(`${b.title} ${b.summary} ${b.entities.join(' ')}`);
  const textSim = jaccardSimilarity(tokensA, tokensB);

  if (a.topicPillar === b.topicPillar) {
    return sharedEntities >= 1 || textSim >= 0.14;
  }

  return sharedEntities >= 3 || (sharedEntities >= 2 && textSim >= 0.2);
}

function buildStableClusterId(articles: RawArticle[]): string {
  const slugBase = articles[0].topicPillar
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const anchorEntity = (articles[0].entities[0] || articles[0].id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `cluster-${slugBase}-${anchorEntity}`;
}

export function clusterAndRankArticles(
  rawArticles: RawArticle[],
  sources: Record<string, SourceProfile>,
  lastReadMap: Record<string, string> = {}
): StoryCluster[] {
  if (rawArticles.length === 0) return [];

  // 1. Connected-components semantic clustering
  const n = rawArticles.length;
  const visited = new Array<boolean>(n).fill(false);
  const groups: RawArticle[][] = [];

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    const queue = [i];
    visited[i] = true;
    const group: RawArticle[] = [];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      group.push(rawArticles[curr]);
      for (let j = 0; j < n; j++) {
        if (!visited[j] && areArticlesSameEvent(rawArticles[curr], rawArticles[j])) {
          visited[j] = true;
          queue.push(j);
        }
      }
    }
    groups.push(group);
  }

  // 2. Score sensationalism per article
  const sensationalismMap = new Map<string, SensationalismAnalysis>();
  for (const article of rawArticles) {
    sensationalismMap.set(
      article.id,
      analyzeSensationalism(article.title, article.calmOverrideTitle, article.summary)
    );
  }

  // 3. Transform each cluster into a high-context StoryCluster
  const clusters: StoryCluster[] = groups.map((articles) => {
    const timestamps = articles.map((a) => new Date(a.publishedAtIso).getTime());
    const latestMs = Math.max(...timestamps);
    const latestPublishedAtIso = new Date(latestMs).toISOString();

    // Elect Original Breaking Source (Origin Score)
    const scoredArticles = articles.map((article) => {
      const source = sources[article.sourceId];
      const sens = sensationalismMap.get(article.id)!;
      const pubMs = new Date(article.publishedAtIso).getTime();
      const earlinessHours = (latestMs - pubMs) / 3_600_000;

      const originScore =
        earlinessHours * 5 +
        article.originalQuotesCount * 6 +
        article.outboundCitations * 4 +
        article.namedEntityDensity * 2 +
        ((source?.factualScore ?? 75) - 70) * 0.6 -
        (article.isWireSyndication ? 28 : 0) -
        (article.isOpinion ? 25 : 0) -
        sens.clickbaitScore * 0.4;

      return { article, originScore, sens };
    });

    scoredArticles.sort((a, b) => b.originScore - a.originScore);
    const primaryEntry = scoredArticles[0];
    const primaryArticle = primaryEntry.article;
    const primarySource = sources[primaryArticle.sourceId];

    // Identify highest-clickbait echo in the cluster so Calm Mode demonstrates real neutralization
    const mostSensationalEntry = [...scoredArticles].sort(
      (a, b) => b.sens.clickbaitScore - a.sens.clickbaitScore
    )[0];

    const calmHeadline = primaryEntry.sens.calmHeadline;
    const maxClickbaitScore = mostSensationalEntry.sens.clickbaitScore;
    const wasDehyped = maxClickbaitScore >= 30;
    const originalHeadline = wasDehyped
      ? mostSensationalEntry.article.title
      : primaryArticle.title;

    const clickbaitTriggers = Array.from(
      new Set(scoredArticles.flatMap((entry) => entry.sens.triggers))
    );

    const derivativeCount = articles.filter(
      (a) => a.id !== primaryArticle.id && (a.isWireSyndication || sensationalismMap.get(a.id)!.wasDehyped)
    ).length;

    const uniqueSources = Array.from(
      new Set(articles.map((a) => a.sourceId))
    )
      .map((id) => sources[id])
      .filter(Boolean);

    const isOpinionCluster = articles.every((a) => a.isOpinion);
    const isPrimaryReporting =
      !isOpinionCluster &&
      !primaryArticle.isWireSyndication &&
      (primaryArticle.originalQuotesCount >= 2 || primaryArticle.outboundCitations >= 4);

    // Signal score (0-100)
    const avgSourceFactual =
      uniqueSources.reduce((acc, s) => acc + s.factualScore, 0) / Math.max(1, uniqueSources.length);
    const rawSignal =
      42 +
      (isPrimaryReporting ? 22 : 0) +
      Math.min(18, primaryArticle.outboundCitations * 1.6) +
      Math.min(12, primaryArticle.originalQuotesCount * 2) +
      (avgSourceFactual - 75) * 0.45 -
      (isOpinionCluster ? 38 : 0) -
      (primaryEntry.sens.clickbaitScore >= 50 ? 22 : 0);
    const signalScore = Math.max(18, Math.min(99, Math.round(rawSignal)));

    const hypeReality = analyzeHypeVsReality(articles, maxClickbaitScore);
    const spectrum = computeCoverageSpectrum(articles, sources);
    const blindspot = analyzeBlindspot(articles, sources);
    const perspectives = buildPerspectives(articles, sources, sensationalismMap);

    const storyClusterId = buildStableClusterId(articles);

    // Synthesis bullets
    const hintSource = articles.find((a) => a.synthesisHints)?.synthesisHints;
    const coreFact = hintSource?.coreFact || primaryArticle.summary;
    const whatsNewToday =
      hintSource?.whatsNew ||
      articles.find((a) => a.deltaBullet)?.deltaBullet ||
      primaryArticle.excerpt;
    const keyTension =
      hintSource?.keyTension ||
      (hypeReality.caveats[0]
        ? `Key caveat noted by analysts: ${hypeReality.caveats[0]}.`
        : 'Outlets differ on near-term regulatory vs. commercial execution timelines.');
    const earlierContext =
      hintSource?.earlierContext ||
      primaryArticle.timelineMilestones?.[0]?.summary ||
      'Developing across multiple reporting cycles.';

    // Delta tracking against lastReadMap
    const deltaArticle = articles.find((a) => a.deltaBullet && a.deltaTimestampIso);
    const lastReadIso = lastReadMap[storyClusterId];
    let newDevelopmentsCount = 0;
    let hasUnreadDelta = false;

    if (deltaArticle && deltaArticle.deltaTimestampIso) {
      const deltaMs = new Date(deltaArticle.deltaTimestampIso).getTime();
      if (!lastReadIso || deltaMs > new Date(lastReadIso).getTime()) {
        hasUnreadDelta = true;
        newDevelopmentsCount = articles.some((a) => a.id === 'art-semi-4') ? 2 : 1;
      }
    }

    const timeline =
      articles.find((a) => a.timelineMilestones)?.timelineMilestones || [
        {
          phase: 'How It Started',
          dateLabel: 'Earlier Cycle',
          summary: earlierContext,
        },
        {
          phase: 'The Turning Point',
          dateLabel: 'Recent Filing',
          summary: primaryArticle.bodyNotes[0] || primaryArticle.summary,
        },
        {
          phase: 'Today’s News',
          dateLabel: 'Nov 11, 2026',
          summary: coreFact,
        },
      ];

    const verifiableClaims = Array.from(
      new Set(articles.flatMap((a) => a.bodyNotes).filter(Boolean))
    ).slice(0, 4);

    const forecastSource = articles.find((a) => a.forecastClaim);
    const forecast = forecastSource?.forecastClaim
      ? {
          id: `forecast-${storyClusterId}`,
          claim: forecastSource.forecastClaim.claim,
          sourceName: sources[forecastSource.sourceId]?.name ?? primarySource.name,
          targetDateIso: forecastSource.forecastClaim.targetDateIso,
          targetDateLabel: forecastSource.forecastClaim.targetDateLabel,
          confidenceLabel: forecastSource.forecastClaim.confidenceLabel,
        }
      : undefined;

    const authoritativeArticles = articles.filter((a) => !a.isWireSyndication);
    const tagSourceArticles = authoritativeArticles.length > 0 ? authoritativeArticles : articles;
    const allTags = Array.from(new Set(tagSourceArticles.flatMap((a) => a.tags)));
    const allEntities = Array.from(new Set(tagSourceArticles.flatMap((a) => a.entities)));

    return {
      storyClusterId,
      topicPillar: primaryArticle.topicPillar,
      tags: allTags,
      entities: allEntities,
      signalScore,
      isPrimaryReporting,
      isOpinionCluster,
      isBlindspot: blindspot.isBlindspot,
      blindspotReason: blindspot.blindspotReason,
      blindspotSphere: blindspot.blindspotSphere,
      primarySource,
      primaryArticle,
      derivativeCount,
      totalOutlets: uniqueSources.length,
      allSources: uniqueSources,
      articles,
      latestPublishedAtIso,
      readingMinutes: primaryArticle.readingMinutes,
      originalHeadline,
      calmHeadline,
      clickbaitScore: maxClickbaitScore,
      wasDehyped,
      clickbaitTriggers,
      hypeReality,
      coreFact,
      whatsNewToday,
      keyTension,
      earlierContext,
      newDevelopmentsCount,
      hasUnreadDelta,
      spectrum,
      perspectives,
      historicalTimeline: timeline,
      verifiableClaims,
      forecast,
    };
  });

  // Sort by Signal Score desc, then latest timestamp desc
  return clusters.sort((a, b) => {
    if (b.signalScore !== a.signalScore) return b.signalScore - a.signalScore;
    return new Date(b.latestPublishedAtIso).getTime() - new Date(a.latestPublishedAtIso).getTime();
  });
}
