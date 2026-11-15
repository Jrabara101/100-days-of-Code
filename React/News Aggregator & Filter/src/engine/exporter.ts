import { StoryCluster } from '../types/news';

export type DigestExportFormat = 'markdown' | 'slack' | 'newsletter';

export function formatBriefingDigest(
  clusters: StoryCluster[],
  notesByClusterId: Record<string, string>,
  format: DigestExportFormat,
  editionDateLabel: string = 'Wednesday, Nov 11, 2026'
): string {
  if (clusters.length === 0) {
    return '# Meridian Signal Morning Brief\n\nNo stories selected for export.';
  }

  if (format === 'slack') {
    const lines = [
      `*Meridian Signal — Intelligence Briefing (${editionDateLabel})*`,
      `_${clusters.length} verified story clusters • Deduplicated & Calm-Translated_`,
      '',
    ];

    for (const cluster of clusters) {
      const note = notesByClusterId[cluster.storyClusterId]?.trim();
      lines.push(`• *${cluster.calmHeadline}* (\`${cluster.topicPillar}\` • Origin: ${cluster.primarySource.name} • Signal ${cluster.signalScore}%)`);
      lines.push(`  _Fact:_ ${cluster.coreFact}`);
      if (note) {
        lines.push(`  > *My Take:* ${note}`);
      }
      lines.push(`  <${cluster.primaryArticle.url}|Read Primary Source>`);
      lines.push('');
    }
    return lines.join('\n').trim();
  }

  if (format === 'newsletter') {
    const lines = [
      `## Morning Signal Dispatch — ${editionDateLabel}`,
      '',
      `Curated from ${clusters.reduce((s, c) => s + c.totalOutlets, 0)} primary and multi-lens sources with wire echoes removed.`,
      '',
      '---',
      '',
    ];

    clusters.forEach((cluster, idx) => {
      const note = notesByClusterId[cluster.storyClusterId]?.trim();
      lines.push(`### ${idx + 1}. ${cluster.calmHeadline}`);
      lines.push(`**Primary Reporting:** [${cluster.primarySource.name}](${cluster.primaryArticle.url}) • **Signal:** ${cluster.signalScore}% • **Pillar:** ${cluster.topicPillar}`);
      lines.push('');
      lines.push(`- **What Happened:** ${cluster.coreFact}`);
      lines.push(`- **Why It Matters:** ${cluster.keyTension}`);
      if (note) {
        lines.push(`- **Editor’s Note:** ${note}`);
      }
      lines.push('');
    });

    return lines.join('\n').trim();
  }

  // Default: clean Markdown digest
  const mdLines = [
    `# Meridian Signal Briefing — ${editionDateLabel}`,
    '',
    `> ${clusters.length} Signal-Verified Stories • ${clusters.reduce((s, c) => s + Math.max(0, c.articles.length - 1), 0)} Derivative Rewrites Filtered`,
    '',
  ];

  clusters.forEach((cluster, idx) => {
    const note = notesByClusterId[cluster.storyClusterId]?.trim();
    mdLines.push(`## ${idx + 1}. ${cluster.calmHeadline}`);
    mdLines.push(
      `**Topic:** ${cluster.topicPillar} | **Origin:** ${cluster.primarySource.name} (${cluster.primarySource.revenueModel}) | **Signal:** ${cluster.signalScore}%`
    );
    mdLines.push('');
    mdLines.push(`- **Core Fact:** ${cluster.coreFact}`);
    mdLines.push(`- **What’s New:** ${cluster.whatsNewToday}`);
    mdLines.push(`- **Key Tension:** ${cluster.keyTension}`);
    if (note) {
      mdLines.push(`- **Commentary:** *${note}*`);
    }
    mdLines.push(`- **Source Link:** ${cluster.primaryArticle.url}`);
    mdLines.push('');
  });

  return mdLines.join('\n').trim();
}

