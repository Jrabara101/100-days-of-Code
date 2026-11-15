import React from 'react';
import {
  BookmarkCheck,
  FileDown,
  GitCompare,
  Radar,
  X,
  Zap,
} from 'lucide-react';
import { StoryCluster } from '../types/news';
import { FramingComparisonView } from './FramingComparisonView';

interface RightContextRailProps {
  allClusters: StoryCluster[];
  pinnedCluster: StoryCluster | null;
  clippedClusters: StoryCluster[];
  calmHeadlines: boolean;
  onClearPinned: () => void;
  onInspectCluster: (cluster: StoryCluster) => void;
  onOpenReader: (cluster: StoryCluster) => void;
  onFilterBlindspots: () => void;
  onOpenClipExporter: () => void;
}

export const RightContextRail: React.FC<RightContextRailProps> = ({
  allClusters,
  pinnedCluster,
  clippedClusters,
  calmHeadlines,
  onClearPinned,
  onInspectCluster,
  onOpenReader,
  onFilterBlindspots,
  onOpenClipExporter,
}) => {
  const blindspots = allClusters.filter((c) => c.isBlindspot);
  const deltaStories = allClusters.filter((c) => c.hasUnreadDelta);

  return (
    <aside className="space-y-4">
      {/* 1. Pinned Framing Comparison Inspector */}
      {pinnedCluster && (
        <section className="editorial-card p-4 border-[var(--border-signal-active)]">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[var(--border-editorial-hairline)]">
            <div>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                <GitCompare className="h-3 w-3" />
                Active Framing Inspector
              </span>
              <h3 className="mt-1 font-serif text-sm font-semibold leading-snug text-ink-primary">
                {calmHeadlines ? pinnedCluster.calmHeadline : pinnedCluster.originalHeadline}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClearPinned}
              className="rounded-md p-1 text-ink-muted hover:bg-[var(--surface-brief-inset)] hover:text-ink-primary"
              aria-label="Close framing inspector"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3">
            <FramingComparisonView
              perspectives={pinnedCluster.perspectives}
              primarySourceId={pinnedCluster.primarySource.id}
              calmHeadlines={calmHeadlines}
              stacked
            />
          </div>
        </section>
      )}

      {/* 2. Briefing Clip Exporter Tray */}
      <section className="editorial-card p-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-editorial-hairline)]">
          <div className="flex items-center gap-1.5">
            <BookmarkCheck className="h-3.5 w-3.5 text-ink-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
              Briefing Clip Tray
            </h3>
          </div>
          <span className="font-mono text-[11px] font-semibold text-ink-muted tabular-nums">
            {clippedClusters.length} clipped
          </span>
        </div>

        {clippedClusters.length === 0 ? (
          <p className="mt-2.5 text-xs leading-relaxed text-ink-muted">
            Click <strong>Clip</strong> on 3–5 morning stories to assemble a formatted Markdown or Slack briefing with your 1-line commentary.
          </p>
        ) : (
          <ul className="mt-2.5 space-y-1.5">
            {clippedClusters.map((c) => (
              <li
                key={c.storyClusterId}
                className="truncate rounded-md bg-[var(--surface-brief-inset)] px-2.5 py-1.5 text-xs font-medium text-ink-primary"
              >
                • {c.calmHeadline}
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onOpenClipExporter}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--border-signal-active)] px-3 py-2 text-xs font-semibold text-white dark:text-slate-950 transition hover:opacity-90"
        >
          <FileDown className="h-3.5 w-3.5" />
          Export Briefing Digest
        </button>
      </section>

      {/* 3. Daily Blindspot Radar */}
      <section className="editorial-card p-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-editorial-hairline)]">
          <div className="flex items-center gap-1.5">
            <Radar className="h-3.5 w-3.5 text-rose-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
              Daily Blindspot Radar
            </h3>
          </div>
          <button
            type="button"
            onClick={onFilterBlindspots}
            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            Filter Feed
          </button>
        </div>

        <p className="mt-2 text-[11px] text-ink-muted">
          Major developments (&gt;75% covered in one sphere) missed by mainstream feeds:
        </p>

        <div className="mt-2.5 space-y-2.5">
          {blindspots.map((b) => (
            <div
              key={b.storyClusterId}
              className="rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-semibold uppercase text-rose-700 dark:text-rose-300">
                  {b.blindspotSphere}
                </span>
                <span className="font-mono text-[10px] text-ink-muted tabular-nums">
                  {b.signalScore}% SIG
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenReader(b)}
                className="mt-1 text-left font-serif text-xs font-semibold leading-snug text-ink-primary hover:underline"
              >
                {b.calmHeadline}
              </button>
              <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-ink-muted">
                <span>Origin: {b.primarySource.name}</span>
                {b.perspectives.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => onInspectCluster(b)}
                    className="font-semibold text-ink-primary hover:underline"
                  >
                    Compare ↘
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. "What Changed Today" Live Delta Ticker */}
      <section className="editorial-card p-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-editorial-hairline)]">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-emerald-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
              What Changed Today
            </h3>
          </div>
          <span className="font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            {deltaStories.length} ACTIVE DELTAS
          </span>
        </div>

        {deltaStories.length === 0 ? (
          <p className="mt-2.5 text-xs text-ink-muted">
            All developing story updates have been reviewed.
          </p>
        ) : (
          <ul className="mt-2.5 space-y-2.5">
            {deltaStories.map((d) => (
              <li
                key={d.storyClusterId}
                className="border-l-2 border-emerald-600 pl-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    +{d.newDevelopmentsCount} UPDATE{d.newDevelopmentsCount > 1 ? 'S' : ''}
                  </span>
                  <span className="text-[10px] text-ink-muted">{d.topicPillar}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenReader(d)}
                  className="mt-0.5 text-left font-medium leading-snug text-ink-primary hover:underline"
                >
                  {d.whatsNewToday}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
};

