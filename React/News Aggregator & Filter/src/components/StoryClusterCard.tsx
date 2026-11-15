import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  GitCompare,
  Pin,
  Radar,
  Sparkles,
  VolumeX,
  Zap,
} from 'lucide-react';
import { DomainLens, StoryCluster } from '../types/news';
import { FramingComparisonView } from './FramingComparisonView';
import { SnoozePopover } from './SnoozePopover';
import { SourceBadge } from './SourceBadge';

interface StoryClusterCardProps {
  cluster: StoryCluster;
  isLead?: boolean;
  calmHeadlines: boolean;
  isRead: boolean;
  isClipped: boolean;
  isForecastTracked: boolean;
  isComparisonOpen: boolean;
  onToggleRead: (cluster: StoryCluster) => void;
  onToggleClip: (clusterId: string) => void;
  onOpenReader: (cluster: StoryCluster) => void;
  onToggleCompare: (cluster: StoryCluster) => void;
  onSnooze: (keyword: string, durationLabel: string, hours: number | null) => void;
  onTrackForecast: (cluster: StoryCluster) => void;
}

type HoverLens = 'Market' | 'Policy' | 'Technical' | null;

function formatRelativeTime(iso: string): string {
  const refNow = new Date('2026-11-11T09:20:00Z').getTime();
  const diffMins = Math.max(5, Math.round((refNow - new Date(iso).getTime()) / 60_000));
  if (diffMins < 60) return `${diffMins}m ago`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function matchesLensBucket(sourceLens: DomainLens, hoverLens: HoverLens): boolean {
  if (!hoverLens) return true;
  if (hoverLens === 'Policy') {
    return sourceLens === 'Policy' || sourceLens === 'Local' || sourceLens === 'International';
  }
  return sourceLens === hoverLens;
}

export const StoryClusterCard: React.FC<StoryClusterCardProps> = ({
  cluster,
  isLead = false,
  calmHeadlines,
  isRead,
  isClipped,
  isForecastTracked,
  isComparisonOpen,
  onToggleRead,
  onToggleClip,
  onOpenReader,
  onToggleCompare,
  onSnooze,
  onTrackForecast,
}) => {
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [dehypedTooltip, setDehypedTooltip] = useState(false);
  const [showEarlierContext, setShowEarlierContext] = useState(false);
  const [hoveredLens, setHoveredLens] = useState<HoverLens>(null);

  const displayedHeadline = calmHeadlines ? cluster.calmHeadline : cluster.originalHeadline;
  const spotlightPreview = hoveredLens
    ? cluster.spectrum.topHeadlineByLens[hoveredLens]
    : undefined;

  return (
    <article
      id={`cluster-${cluster.storyClusterId}`}
      className={`editorial-card animate-cluster-in relative p-5 sm:p-6 transition-all duration-200 ${
        isRead ? 'opacity-80' : 'opacity-100'
      } ${
        isComparisonOpen
          ? 'ring-1 ring-[var(--border-signal-active)]'
          : 'hover:border-[var(--border-column-rule)]'
      }`}
    >
      {/* 1. Top Metadata & Signal Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-[var(--surface-brief-inset)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-secondary">
            {cluster.topicPillar}
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide tabular-nums ${
              cluster.isPrimaryReporting
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : cluster.isOpinionCluster
                  ? 'bg-stone-500/10 text-ink-muted'
                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
            }`}
          >
            ★ {cluster.signalScore}% SIGNAL
            {cluster.isPrimaryReporting
              ? ' • PRIMARY REPORTING'
              : cluster.isOpinionCluster
                ? ' • OPINION / NOISE'
                : ''}
          </span>

          {/* Original Source vs Echo Gold Badge */}
          <span
            className="inline-flex items-center gap-1 rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-200"
            title={`Primary reporting originated by ${cluster.primarySource.name}; ${cluster.derivativeCount} derivative echo/wire rewrites grouped`}
          >
            <Award className="h-3 w-3" />
            Origin: {cluster.primarySource.name}
            {cluster.derivativeCount > 0 && (
              <span className="font-mono text-[10px] opacity-80">
                (+{cluster.derivativeCount} echoes grouped)
              </span>
            )}
          </span>

          {/* Delta Badge */}
          {cluster.hasUnreadDelta && cluster.newDevelopmentsCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/12 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <Zap className="h-3 w-3" />+{cluster.newDevelopmentsCount} New Since Yesterday
            </span>
          )}

          {/* Blindspot Badge */}
          {cluster.isBlindspot && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-rose-500/12 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300"
              title={cluster.blindspotReason}
            >
              <Radar className="h-3 w-3" />
              Blindspot
            </span>
          )}
        </div>

        {/* Card Action Controls (Snooze, Clip, Read) */}
        <div className="relative flex items-center gap-1">
          <span className="mr-1 hidden font-mono text-[11px] text-ink-muted sm:inline tabular-nums">
            {formatRelativeTime(cluster.latestPublishedAtIso)} • {cluster.readingMinutes}m
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setSnoozeOpen((prev) => !prev)}
              aria-label={`Snooze topic for ${cluster.topicPillar}`}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border-editorial-hairline)] px-2.5 py-1 text-[11px] font-medium text-ink-secondary transition hover:border-[var(--border-column-rule)] hover:bg-[var(--surface-brief-inset)] hover:text-ink-primary"
            >
              <VolumeX className="h-3 w-3" />
              <span className="hidden sm:inline">Snooze</span>
            </button>
            {snoozeOpen && (
              <SnoozePopover
                cluster={cluster}
                onSnooze={onSnooze}
                onClose={() => setSnoozeOpen(false)}
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => onToggleClip(cluster.storyClusterId)}
            aria-label={isClipped ? 'Remove from digest clips' : 'Save to briefing digest'}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              isClipped
                ? 'border-[var(--border-signal-active)] bg-[var(--border-signal-active)] text-white dark:text-slate-950'
                : 'border-[var(--border-editorial-hairline)] text-ink-secondary hover:border-[var(--border-column-rule)] hover:bg-[var(--surface-brief-inset)] hover:text-ink-primary'
            }`}
          >
            <Bookmark className="h-3 w-3" />
            <span className="hidden sm:inline">{isClipped ? 'Clipped' : 'Clip'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleRead(cluster)}
            aria-label={isRead ? 'Mark as unread' : 'Mark story read'}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              isRead
                ? 'border-emerald-600/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'border-[var(--border-editorial-hairline)] text-ink-secondary hover:border-emerald-600/40 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            <Check className="h-3 w-3" />
            <span>{isRead ? 'Read' : 'Done'}</span>
          </button>
        </div>
      </div>

      {/* 2. Headline Zone with Calm Morphing & Clickbait Diff Tooltip */}
      <div className="mt-3.5">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h2
            key={`${cluster.storyClusterId}-${calmHeadlines ? 'calm' : 'orig'}`}
            onClick={() => onOpenReader(cluster)}
            className={`animate-calm-morph cursor-pointer font-serif font-semibold text-ink-primary hover:underline decoration-[var(--border-column-rule)] underline-offset-4 ${
              isLead
                ? 'text-[1.45rem] sm:text-[1.55rem] leading-[1.22] tracking-[-0.015em]'
                : 'text-[1.2rem] sm:text-[1.28rem] leading-[1.28] tracking-[-0.01em]'
            }`}
          >
            {displayedHeadline}
          </h2>

          {cluster.wasDehyped && calmHeadlines && (
            <div
              className="relative inline-flex"
              onMouseEnter={() => setDehypedTooltip(true)}
              onMouseLeave={() => setDehypedTooltip(false)}
            >
              <button
                type="button"
                onClick={() => setDehypedTooltip((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
              >
                <Sparkles className="h-3 w-3" />
                De-hyped
              </button>

              {dehypedTooltip && (
                <div
                  role="tooltip"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 z-40 mb-2 w-72 sm:w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-[var(--border-column-rule)] bg-[var(--surface-cluster-card)] p-3 text-left shadow-xl"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    <span>Clickbait Neutralized</span>
                    <span>Score: {cluster.clickbaitScore}/100</span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium italic text-ink-secondary">
                    “{cluster.originalHeadline}”
                  </p>
                  {cluster.clickbaitTriggers.length > 0 && (
                    <p className="mt-1.5 text-[11px] text-ink-muted">
                      Triggers removed: {cluster.clickbaitTriggers.slice(0, 3).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {cluster.wasDehyped && !calmHeadlines && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-600 dark:text-rose-300">
              RAW CLICKBAIT ({cluster.clickbaitScore}/100)
            </span>
          )}
        </div>

        {/* Hype vs Reality Meter */}
        {cluster.hypeReality.hasCaveatGap && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                cluster.hypeReality.divergenceLevel === 'High Hype Gap'
                  ? 'border-rose-500/35 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  : 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              Hype vs. Reality: {cluster.hypeReality.divergenceLevel}
            </span>
            {cluster.hypeReality.caveats.slice(0, 2).map((caveat) => (
              <span
                key={caveat}
                className="rounded-md bg-[var(--surface-brief-inset)] px-2 py-0.5 text-[11px] text-ink-secondary"
              >
                {caveat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. Inset "3-Bullet Synthesis & Delta" Box */}
      <div className="editorial-inset mt-4 p-4">
        <ul className="space-y-2.5 text-[14.5px] leading-[1.58] text-ink-primary">
          <li className="flex items-start gap-2.5 max-w-[65ch]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-primary" />
            <span>
              <strong className="font-semibold">The Core Fact:</strong>{' '}
              <span className="text-ink-secondary">{cluster.coreFact}</span>
            </span>
          </li>

          <li
            className={`flex items-start gap-2.5 max-w-[65ch] rounded-lg transition-colors ${
              cluster.hasUnreadDelta
                ? 'bg-emerald-500/10 px-2.5 py-1.5 -mx-2.5 border border-emerald-500/20'
                : ''
            }`}
          >
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                cluster.hasUnreadDelta ? 'bg-emerald-600' : 'bg-ink-muted'
              }`}
            />
            <span>
              <strong
                className={`font-semibold ${
                  cluster.hasUnreadDelta ? 'text-emerald-800 dark:text-emerald-300' : ''
                }`}
              >
                What’s New Today:
              </strong>{' '}
              <span className="text-ink-secondary">{cluster.whatsNewToday}</span>
            </span>
          </li>

          <li className="flex items-start gap-2.5 max-w-[65ch]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
            <span>
              <strong className="font-semibold">The Key Tension:</strong>{' '}
              <span className="text-ink-secondary">{cluster.keyTension}</span>
            </span>
          </li>
        </ul>

        <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border-editorial-hairline)] pt-2">
          <button
            type="button"
            onClick={() => setShowEarlierContext((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-ink-primary"
          >
            {showEarlierContext ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {showEarlierContext
              ? 'Hide prior background context'
              : 'Show prior background context'}
          </button>

          {cluster.isBlindspot && cluster.blindspotReason && (
            <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
              {cluster.blindspotReason}
            </span>
          )}
        </div>

        {showEarlierContext && (
          <p className="mt-2 rounded-md bg-[var(--surface-cluster-card)] p-2.5 text-xs leading-relaxed text-ink-secondary">
            <strong className="font-semibold text-ink-primary">Earlier Background:</strong>{' '}
            {cluster.earlierContext}
          </p>
        )}
      </div>

      {/* 4. Bottom Coverage Spectrum Bar & Source Strip */}
      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium">
          <div className="flex flex-wrap items-center gap-2">
            {cluster.spectrum.marketCount > 0 && (
              <button
                type="button"
                onMouseEnter={() => setHoveredLens('Market')}
                onMouseLeave={() => setHoveredLens(null)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                  hoveredLens && hoveredLens !== 'Market' ? 'opacity-40' : 'opacity-100'
                } bg-blue-500/10 text-blue-700 dark:text-blue-300`}
              >
                <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                Market Impact ({cluster.spectrum.marketCount})
              </button>
            )}

            {cluster.spectrum.policyCount + cluster.spectrum.localIntlCount > 0 && (
              <button
                type="button"
                onMouseEnter={() => setHoveredLens('Policy')}
                onMouseLeave={() => setHoveredLens(null)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                  hoveredLens && hoveredLens !== 'Policy' ? 'opacity-40' : 'opacity-100'
                } bg-amber-500/10 text-amber-800 dark:text-amber-300`}
              >
                <span className="h-2 w-2 rounded-full bg-[#D97706]" />
                Policy & Regional ({cluster.spectrum.policyCount + cluster.spectrum.localIntlCount})
              </button>
            )}

            {cluster.spectrum.techCount > 0 && (
              <button
                type="button"
                onMouseEnter={() => setHoveredLens('Technical')}
                onMouseLeave={() => setHoveredLens(null)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                  hoveredLens && hoveredLens !== 'Technical' ? 'opacity-40' : 'opacity-100'
                } bg-violet-500/10 text-violet-700 dark:text-violet-300`}
              >
                <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
                Technical Reality ({cluster.spectrum.techCount})
              </button>
            )}
          </div>

          <span className="font-mono text-[11px] text-ink-muted tabular-nums">
            {cluster.totalOutlets} OUTLET{cluster.totalOutlets > 1 ? 'S' : ''} •{' '}
            {cluster.articles.length} ARTICLES MERGED
          </span>
        </div>

        {/* Segmented 6px Spectrum Bar */}
        <div
          className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-brief-inset)]"
          aria-label="Coverage perspective spectrum"
        >
          {cluster.spectrum.marketPct > 0 && (
            <div
              onMouseEnter={() => setHoveredLens('Market')}
              onMouseLeave={() => setHoveredLens(null)}
              style={{ width: `${cluster.spectrum.marketPct}%` }}
              className="h-full bg-[#2563EB] transition-opacity cursor-pointer"
              title={`Market Impact: ${cluster.spectrum.marketPct}%`}
            />
          )}
          {cluster.spectrum.policyPct > 0 && (
            <div
              onMouseEnter={() => setHoveredLens('Policy')}
              onMouseLeave={() => setHoveredLens(null)}
              style={{ width: `${cluster.spectrum.policyPct}%` }}
              className="h-full bg-[#D97706] transition-opacity cursor-pointer"
              title={`Policy & Regional: ${cluster.spectrum.policyPct}%`}
            />
          )}
          {cluster.spectrum.techPct > 0 && (
            <div
              onMouseEnter={() => setHoveredLens('Technical')}
              onMouseLeave={() => setHoveredLens(null)}
              style={{ width: `${cluster.spectrum.techPct}%` }}
              className="h-full bg-[#7C3AED] transition-opacity cursor-pointer"
              title={`Technical Reality: ${cluster.spectrum.techPct}%`}
            />
          )}
        </div>

        {/* Hover Spotlight Preview */}
        {spotlightPreview && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] px-3 py-1.5 text-xs">
            <Eye className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
            <span className="font-semibold text-ink-primary">
              {spotlightPreview.sourceName}:
            </span>
            <span className="truncate text-ink-secondary">“{spotlightPreview.headline}”</span>
          </div>
        )}

        {/* Source Pills + Drawer Actions */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {cluster.allSources.map((src) => {
              const matchingArticle = cluster.articles.find((a) => a.sourceId === src.id);
              const lensForSrc = matchingArticle?.lens || src.primaryLens;
              const dimmed = hoveredLens !== null && !matchesLensBucket(lensForSrc, hoveredLens);
              return (
                <SourceBadge
                  key={src.id}
                  source={src}
                  isPrimaryOrigin={src.id === cluster.primarySource.id}
                  dimmed={dimmed}
                  compact
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {cluster.forecast && (
              <button
                type="button"
                onClick={() => onTrackForecast(cluster)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  isForecastTracked
                    ? 'border-emerald-600/40 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                    : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] text-ink-primary hover:border-[var(--border-signal-active)]'
                }`}
                title={`Forecast: "${cluster.forecast.claim}" (${cluster.forecast.targetDateLabel})`}
              >
                <Pin className="h-3.5 w-3.5" />
                {isForecastTracked ? 'Outcome Tracked' : 'Track Outcome'}
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenReader(cluster)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:border-[var(--border-column-rule)] hover:bg-[var(--surface-brief-inset)]"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Clean Reader & Timeline
            </button>

            {cluster.perspectives.length >= 2 && (
              <button
                type="button"
                onClick={() => onToggleCompare(cluster)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  isComparisonOpen
                    ? 'border-[var(--border-signal-active)] bg-[var(--border-signal-active)] text-white dark:text-slate-950'
                    : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] text-ink-primary hover:border-[var(--border-signal-active)]'
                }`}
              >
                <GitCompare className="h-3.5 w-3.5" />
                {isComparisonOpen
                  ? 'Hide Perspectives'
                  : `Compare ${cluster.perspectives.length} Perspectives`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Expandable Side-by-Side Framing Comparison Drawer */}
      {isComparisonOpen && (
        <div className="mt-4">
          <FramingComparisonView
            perspectives={cluster.perspectives}
            primarySourceId={cluster.primarySource.id}
            calmHeadlines={calmHeadlines}
          />
        </div>
      )}
    </article>
  );
};

