import { describe, expect, it } from 'vitest';
import { RAW_ARTICLES } from '../../data/rawArticles';
import { SOURCES } from '../../data/sources';
import {
  BUILT_IN_LENSES,
  INITIAL_LAST_READ_MAP,
  INITIAL_SNOOZES,
} from '../../data/initialState';
import { clusterAndRankArticles } from '../clustering';
import { applyFeedFilters } from '../filtering';
import { formatBriefingDigest } from '../exporter';
import { computeInformationDietStats } from '../dietAndPredictions';
import { analyzeSensationalism } from '../sensationalism';
import { FeedFilters, SavedLens, SnoozedTopic } from '../../types/news';

const BASE_FILTERS: FeedFilters = {
  edition: 'stream',
  primaryReportingOnly: false,
  hideOpinion: false,
  calmHeadlines: true,
  blindspotOnly: false,
  newDevelopmentsOnly: false,
  searchQuery: '',
  activeLensId: 'lens-all',
};

describe('Smart Aggregation, Deduplication & Framing Engine', () => {
  it('clusters raw ungrouped RSS articles into 14 distinct semantic event clusters matching ground-truth events', () => {
    const clusters = clusterAndRankArticles(RAW_ARTICLES, SOURCES, INITIAL_LAST_READ_MAP);
    expect(clusters.length).toBe(14);

    // Each computed cluster should correspond cleanly to exactly 1 underlying seedEventKey
    for (const cluster of clusters) {
      const distinctSeedKeys = new Set(cluster.articles.map((a) => a.seedEventKey));
      expect(distinctSeedKeys.size).toBe(1);
    }
  });

  it('elects the true Original Breaking Source over derivative wire rewrites and clickbait echoes', () => {
    const clusters = clusterAndRankArticles(RAW_ARTICLES, SOURCES, INITIAL_LAST_READ_MAP);

    const semiCluster = clusters.find((c) => c.topicPillar === 'Semiconductors & Trade')!;
    expect(semiCluster.primarySource.id).toBe('ft');
    expect(semiCluster.derivativeCount).toBeGreaterThanOrEqual(2);
    expect(semiCluster.wasDehyped).toBe(true);
    expect(semiCluster.originalHeadline).toContain('SHOCKING');
    expect(semiCluster.calmHeadline).not.toContain('SHOCKING');

    const alsCluster = clusters.find((c) => c.topicPillar === 'Biotech & Medicine')!;
    expect(alsCluster.primarySource.id).toBe('nature');
    expect(alsCluster.hypeReality.hasCaveatGap).toBe(true);
    expect(alsCluster.hypeReality.divergenceLevel).toBe('High Hype Gap');
  });

  it('scores sensationalism accurately and leaves neutral reporting calm', () => {
    const noisy = analyzeSensationalism(
      'TERRIFYING Cyber Flaw Leaves Power Grids DEFENSELESS — Could Your City Go Dark Tomorrow?'
    );
    expect(noisy.clickbaitScore).toBeGreaterThanOrEqual(65);
    expect(noisy.wasDehyped).toBe(true);
    expect(noisy.calmHeadline).not.toMatch(/TERRIFYING|DEFENSELESS/);

    const calm = analyzeSensationalism(
      'TSMC, ASE and EU Envoys Finalize Binding Dresden–Phoenix Packaging Corridor'
    );
    expect(calm.clickbaitScore).toBeLessThan(25);
    expect(calm.wasDehyped).toBe(false);
  });

  it('flags lopsided specialist/regional coverage as Blindspot Stories', () => {
    const clusters = clusterAndRankArticles(RAW_ARTICLES, SOURCES, INITIAL_LAST_READ_MAP);
    const blindspots = clusters.filter((c) => c.isBlindspot);
    const pillars = blindspots.map((b) => b.topicPillar);

    expect(pillars).toContain('Energy & Climate Grid');
    expect(pillars).toContain('Global Trade & Logistics');
    expect(pillars).toContain('Urban Transit & Civic');
  });

  it('tracks multi-day story deltas against lastReadTimestamp', () => {
    const clusters = clusterAndRankArticles(RAW_ARTICLES, SOURCES, INITIAL_LAST_READ_MAP);
    const semiCluster = clusters.find((c) => c.topicPillar === 'Semiconductors & Trade')!;
    expect(semiCluster.hasUnreadDelta).toBe(true);
    expect(semiCluster.newDevelopmentsCount).toBe(2);

    // Once user marks today read, delta clears
    const updated = clusterAndRankArticles(RAW_ARTICLES, SOURCES, {
      ...INITIAL_LAST_READ_MAP,
      [semiCluster.storyClusterId]: '2026-11-11T12:00:00Z',
    });
    const semiUpdated = updated.find((c) => c.topicPillar === 'Semiconductors & Trade')!;
    expect(semiUpdated.hasUnreadDelta).toBe(false);
    expect(semiUpdated.newDevelopmentsCount).toBe(0);
  });

  it('enforces TTL snooze expiration, Hide Opinion, -keyword exclusions, and Finite Edition bounds', () => {
    const clusters = clusterAndRankArticles(RAW_ARTICLES, SOURCES, INITIAL_LAST_READ_MAP);

    const snoozes: SnoozedTopic[] = [
      ...INITIAL_SNOOZES,
      {
        id: 'snooze-expired',
        keyword: 'TSMC',
        durationLabel: '24 Hours',
        mutedUntilIso: '2026-11-10T00:00:00Z', // Already expired
        untilMajorResolution: false,
        createdAtIso: '2026-11-09T00:00:00Z',
      },
      {
        id: 'snooze-active-als',
        keyword: 'ALS',
        durationLabel: '7 Days',
        mutedUntilIso: '2026-11-18T00:00:00Z',
        untilMajorResolution: false,
        createdAtIso: '2026-11-11T00:00:00Z',
      },
    ];

    const nowMs = new Date('2026-11-11T09:00:00Z').getTime();
    const res = applyFeedFilters(
      clusters,
      { ...BASE_FILTERS, edition: '5min', hideOpinion: true, searchQuery: '-QuantumFake' },
      snoozes,
      BUILT_IN_LENSES,
      nowMs
    );

    // Expired TSMC snooze should NOT hide Semiconductors
    expect(res.matchingClusters.some((c) => c.topicPillar === 'Semiconductors & Trade')).toBe(true);
    // Active ALS snooze MUST hide Biotech & Medicine
    expect(res.matchingClusters.some((c) => c.topicPillar === 'Biotech & Medicine')).toBe(false);
    // Hide opinion removes opinion clusters
    expect(res.matchingClusters.every((c) => !c.isOpinionCluster)).toBe(true);
    // 5-min edition caps at 6 stories
    expect(res.editionClusters.length).toBe(6);

    // Negative search operator `-Dresden` excludes Semiconductors cluster
    const excludeRes = applyFeedFilters(
      clusters,
      { ...BASE_FILTERS, searchQuery: '-Dresden' },
      [],
      BUILT_IN_LENSES,
      nowMs
    );
    expect(excludeRes.matchingClusters.some((c) => c.topicPillar === 'Semiconductors & Trade')).toBe(false);
  });

  it('exports Markdown and Slack digests with 1-line reader commentary attached', () => {
    const clusters = clusterAndRankArticles(RAW_ARTICLES, SOURCES, INITIAL_LAST_READ_MAP).slice(0, 2);
    const notes = {
      [clusters[0].storyClusterId]: 'Key watch item for Q1 EU packaging subsidies.',
    };

    const md = formatBriefingDigest(clusters, notes, 'markdown');
    expect(md).toContain('# Meridian Signal Briefing');
    expect(md).toContain('Key watch item for Q1 EU packaging subsidies.');

    const slack = formatBriefingDigest(clusters, notes, 'slack');
    expect(slack).toContain('*Meridian Signal');
    expect(slack).toContain('My Take:');

    const newsletter = formatBriefingDigest(clusters, notes, 'newsletter');
    expect(newsletter).toContain('## Morning Signal Dispatch');
    expect(newsletter).toContain('Editor’s Note:');
  });

  it('evaluates custom Saved Lens positive/negative rules and computes Information Diet stats', () => {
    const clusters = clusterAndRankArticles(RAW_ARTICLES, SOURCES, INITIAL_LAST_READ_MAP);
    const customLens: SavedLens = {
      id: 'lens-custom-test',
      name: 'Clean Grid Only',
      description: 'Clean energy minus lithium speculation',
      includeTopics: ['Clean Energy'],
      excludeTopics: ['Atacama'],
      primaryOnly: true,
      hideOpinion: true,
      minSignalScore: 70,
      readerSupportedOnly: true,
    };

    const filtered = applyFeedFilters(
      clusters,
      { ...BASE_FILTERS, activeLensId: customLens.id },
      [],
      [...BUILT_IN_LENSES, customLens]
    );

    expect(filtered.matchingClusters.some((c) => c.topicPillar === 'Energy & Climate Grid')).toBe(true);
    expect(filtered.matchingClusters.some((c) => c.topicPillar === 'Clean Energy Supply Chain')).toBe(false);

    const blindspotCluster = clusters.find((c) => c.isBlindspot)!;
    const diet = computeInformationDietStats([blindspotCluster.storyClusterId], clusters, filtered);
    expect(diet.articlesReadCount).toBe(1);
    expect(diet.blindspotsUncovered).toBe(1);
    expect(diet.primaryReportingPct).toBe(100);
    expect(diet.minutesSaved).toBeGreaterThanOrEqual(12);
  });
});

