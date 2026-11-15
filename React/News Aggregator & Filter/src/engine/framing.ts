import {
  CoverageSpectrum,
  PerspectiveItem,
  RawArticle,
  SensationalismAnalysis,
  SourceProfile,
} from '../types/news';

export function computeCoverageSpectrum(
  articles: RawArticle[],
  sources: Record<string, SourceProfile>
): CoverageSpectrum {
  let marketCount = 0;
  let policyCount = 0;
  let techCount = 0;
  let localIntlCount = 0;

  const topHeadlineByLens: CoverageSpectrum['topHeadlineByLens'] = {};

  for (const article of articles) {
    const source = sources[article.sourceId];
    const lens = article.lens || source?.primaryLens || 'Policy';

    if (lens === 'Market') {
      marketCount += 1;
      if (!topHeadlineByLens.Market) {
        topHeadlineByLens.Market = {
          sourceName: source?.name ?? article.sourceId,
          headline: article.calmOverrideTitle || article.title,
        };
      }
    } else if (lens === 'Policy') {
      policyCount += 1;
      if (!topHeadlineByLens.Policy) {
        topHeadlineByLens.Policy = {
          sourceName: source?.name ?? article.sourceId,
          headline: article.calmOverrideTitle || article.title,
        };
      }
    } else if (lens === 'Technical') {
      techCount += 1;
      if (!topHeadlineByLens.Technical) {
        topHeadlineByLens.Technical = {
          sourceName: source?.name ?? article.sourceId,
          headline: article.calmOverrideTitle || article.title,
        };
      }
    } else {
      localIntlCount += 1;
      // Fold Local/International preview into Policy if no dedicated Policy outlet exists
      if (!topHeadlineByLens.Policy) {
        topHeadlineByLens.Policy = {
          sourceName: source?.name ?? article.sourceId,
          headline: article.calmOverrideTitle || article.title,
        };
      }
    }
  }

  const total = Math.max(1, marketCount + policyCount + techCount + localIntlCount);
  const marketPct = Math.round((marketCount / total) * 100);
  const policyPct = Math.round(((policyCount + localIntlCount) / total) * 100);
  const techPct = Math.max(0, 100 - marketPct - policyPct);

  return {
    marketCount,
    policyCount,
    techCount,
    localIntlCount,
    marketPct,
    policyPct,
    techPct,
    localIntlPct: Math.round((localIntlCount / total) * 100),
    topHeadlineByLens,
  };
}

export function analyzeBlindspot(
  articles: RawArticle[],
  sources: Record<string, SourceProfile>
): { isBlindspot: boolean; blindspotReason?: string; blindspotSphere?: string } {
  if (articles.length === 0) return { isBlindspot: false };

  let mainstreamCount = 0;
  let specialistOrRegionalCount = 0;
  const lensCounts: Record<string, number> = {};

  for (const article of articles) {
    const src = sources[article.sourceId];
    if (src?.isMainstream && !article.isWireSyndication) {
      mainstreamCount += 1;
    } else if (!src?.isMainstream) {
      specialistOrRegionalCount += 1;
    }
    const lens = article.lens || src?.primaryLens || 'Technical';
    lensCounts[lens] = (lensCounts[lens] || 0) + 1;
  }

  const total = articles.length;
  const specialistShare = specialistOrRegionalCount / total;
  const mainstreamShare = mainstreamCount / total;

  // Find dominant sphere
  const sortedLenses = Object.entries(lensCounts).sort((a, b) => b[1] - a[1]);
  const [topSphere, topCount] = sortedLenses[0] || ['Technical', 0];
  const topSphereShare = topCount / total;

  // Blindspot rule: >66% specialist/non-mainstream with <=10% non-wire mainstream pickup,
  // or >=85% concentrated in a single regional/local/international sphere with zero commercial/market press pickup
  if (
    (specialistShare >= 0.66 && mainstreamShare <= 0.1) ||
    (specialistShare >= 0.75 && mainstreamShare <= 0.25) ||
    (topSphereShare >= 0.8 && (mainstreamShare === 0 || topSphere === 'Local' || topSphere === 'International'))
  ) {
    const sphereLabel =
      topSphere === 'Local'
        ? 'Municipal & Civic Press'
        : topSphere === 'International'
          ? 'Global Trade & Emerging Markets Press'
          : `${topSphere} Specialist Press`;

    const concentrationPct = Math.round(Math.max(specialistShare, topSphereShare) * 100);
    return {
      isBlindspot: true,
      blindspotSphere: sphereLabel,
      blindspotReason: `${concentrationPct}% covered in ${sphereLabel} with <10% mainstream broadcast pickup`,
    };
  }

  return { isBlindspot: false };
}

export function buildPerspectives(
  articles: RawArticle[],
  sources: Record<string, SourceProfile>,
  sensationalismMap: Map<string, SensationalismAnalysis>
): PerspectiveItem[] {
  const ordered: RawArticle[] = [];
  const seenSource = new Set<string>();
  const desiredLensOrder = ['Market', 'Technical', 'Policy', 'Local', 'International'];

  for (const targetLens of desiredLensOrder) {
    const match = articles.find(
      (a) => a.lens === targetLens && !seenSource.has(a.sourceId) && !a.isWireSyndication
    );
    if (match) {
      ordered.push(match);
      seenSource.add(match.sourceId);
    }
  }

  // Fill up to 3 columns if needed from remaining non-duplicate outlets
  for (const article of articles) {
    if (ordered.length >= 3) break;
    if (!seenSource.has(article.sourceId)) {
      ordered.push(article);
      seenSource.add(article.sourceId);
    }
  }

  return ordered.slice(0, 3).map((article) => {
    const source = sources[article.sourceId];
    const sens = sensationalismMap.get(article.id);
    return {
      articleId: article.id,
      source,
      lens: article.lens,
      originalHeadline: article.title,
      calmHeadline: sens?.calmHeadline ?? article.calmOverrideTitle ?? article.title,
      excerpt: article.excerpt,
      loadedAdjectives: article.loadedAdjectives,
      publishedAtIso: article.publishedAtIso,
      url: article.url,
    };
  });
}
