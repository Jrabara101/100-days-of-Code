import React from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitCommitHorizontal,
  Pin,
  ShieldCheck,
  X,
} from 'lucide-react';
import { StoryCluster } from '../types/news';
import { SourceBadge } from './SourceBadge';

interface CleanReaderDrawerProps {
  cluster: StoryCluster | null;
  calmHeadlines: boolean;
  isForecastTracked: boolean;
  onClose: () => void;
  onMarkRead: (cluster: StoryCluster) => void;
  onTrackForecast: (cluster: StoryCluster) => void;
}

export const CleanReaderDrawer: React.FC<CleanReaderDrawerProps> = ({
  cluster,
  calmHeadlines,
  isForecastTracked,
  onClose,
  onMarkRead,
  onTrackForecast,
}) => {
  if (!cluster) return null;

  const headline = calmHeadlines ? cluster.calmHeadline : cluster.originalHeadline;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Clean Reader and Fact Check"
        onClick={(e) => e.stopPropagation()}
        className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--border-column-rule)] bg-[var(--canvas-newsprint-base)] p-6 sm:p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-editorial-hairline)] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[var(--surface-brief-inset)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
              {cluster.topicPillar}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-muted tabular-nums">
              <Clock className="h-3.5 w-3.5" />
              {cluster.readingMinutes} min read
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
              <ShieldCheck className="h-3.5 w-3.5" />
              {cluster.signalScore}% Signal
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close reader drawer"
            className="rounded-full border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] p-1.5 text-ink-secondary hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Headline & Primary Attribution */}
        <div className="mt-5">
          <h2 className="font-serif text-2xl sm:text-[1.75rem] font-semibold leading-tight text-ink-primary">
            {headline}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SourceBadge source={cluster.primarySource} isPrimaryOrigin />
            <span className="text-xs text-ink-muted">
              Primary source verified from {cluster.totalOutlets} outlets covering this story
            </span>
          </div>
        </div>

        {/* Hype vs. Reality Fact-Check Box */}
        <section className="editorial-card mt-5 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-primary">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Hype vs. Reality Fact Check
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                cluster.hypeReality.divergenceLevel === 'High Hype Gap'
                  ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300'
                  : cluster.hypeReality.divergenceLevel === 'Moderate Caveat'
                    ? 'bg-amber-500/12 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {cluster.hypeReality.divergenceLevel}
            </span>
          </div>

          <p className="mt-2.5 text-sm leading-relaxed text-ink-secondary">
            {cluster.primaryArticle.excerpt}
          </p>

          {cluster.hypeReality.caveats.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-[var(--border-editorial-hairline)] pt-2.5 text-xs text-ink-secondary">
              {cluster.hypeReality.caveats.map((cav) => (
                <li key={cav} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                  <span>
                    <strong className="text-ink-primary">Methodology / Scope Caveat:</strong> {cav}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* "Catch Me Up in 60 Seconds" Historical Timeline Strip */}
        <section className="editorial-inset mt-5 p-4 border border-[var(--border-editorial-hairline)]">
          <div className="flex items-center gap-1.5 pb-3 border-b border-[var(--border-editorial-hairline)]">
            <GitCommitHorizontal className="h-4 w-4 text-ink-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
              Historical Timeline — Catch Me Up in 60 Seconds
            </h3>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {cluster.historicalTimeline.map((step, i) => (
              <div
                key={step.phase}
                className="relative rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] p-3"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">
                    0{i + 1}. {step.phase}
                  </span>
                  <span className="font-mono text-[10px] text-ink-muted">{step.dateLabel}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                  {step.summary}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Verifiable Claims Checklist */}
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
            Verifiable Reporting Notes & Data Points
          </h3>
          <ul className="mt-2.5 space-y-2">
            {cluster.verifiableClaims.map((claim) => (
              <li
                key={claim}
                className="flex items-start gap-2.5 rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] p-3 text-sm text-ink-secondary"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{claim}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Key Entities Mentioned */}
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Key Entities & Topics
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cluster.entities.map((ent) => (
              <span
                key={ent}
                className="rounded-full border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] px-2.5 py-1 text-xs font-medium text-ink-primary"
              >
                {ent}
              </span>
            ))}
          </div>
        </section>

        {/* Embedded Forecast Tracker Card */}
        {cluster.forecast && (
          <section className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Forecast Detected • Target: {cluster.forecast.targetDateLabel}
                </span>
                <p className="mt-1 text-sm font-semibold text-ink-primary">
                  “{cluster.forecast.claim}”
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Attributed to {cluster.forecast.sourceName} ({cluster.forecast.confidenceLabel})
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTrackForecast(cluster)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  isForecastTracked
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[var(--surface-cluster-card)] text-ink-primary border border-[var(--border-column-rule)] hover:border-[var(--border-signal-active)]'
                }`}
              >
                <Pin className="h-3.5 w-3.5" />
                {isForecastTracked ? 'Tracked in Ledger' : 'Track Outcome'}
              </button>
            </div>
          </section>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-editorial-hairline)] pt-4">
          <button
            type="button"
            onClick={() => {
              onMarkRead(cluster);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            <Award className="h-3.5 w-3.5" />
            Mark Story Absorbed & Close
          </button>

          <a
            href={cluster.primaryArticle.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-column-rule)] bg-[var(--surface-cluster-card)] px-4 py-2 text-xs font-semibold text-ink-primary hover:bg-[var(--surface-brief-inset)]"
          >
            Open Primary Source ({cluster.primarySource.name})
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

