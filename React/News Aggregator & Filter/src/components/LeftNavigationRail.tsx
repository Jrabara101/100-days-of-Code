import React from 'react';
import {
  CheckCircle2,
  Compass,
  Pin,
  Plus,
  ReceiptText,
  Trash2,
  VolumeX,
} from 'lucide-react';
import {
  EditionMode,
  InformationDietStats,
  SavedLens,
  SnoozedTopic,
  StoryCluster,
  TrackedPrediction,
} from '../types/news';

interface LeftNavigationRailProps {
  edition: EditionMode;
  editionClusters: StoryCluster[];
  readClusterIds: string[];
  lenses: SavedLens[];
  activeLensId: string;
  activeSnoozes: SnoozedTopic[];
  dietStats: InformationDietStats;
  predictions: TrackedPrediction[];
  onSelectLens: (lensId: string) => void;
  onDeleteLens: (lensId: string) => void;
  onOpenLensBuilder: () => void;
  onWakeSnooze: (snoozeId: string) => void;
  onOpenDietModal: () => void;
  onOpenLedgerModal: () => void;
  onMarkEditionComplete: () => void;
}

function formatRemainingTtl(snooze: SnoozedTopic): string {
  if (snooze.untilMajorResolution || !snooze.mutedUntilIso) {
    return 'Until resolution';
  }
  const refNow = new Date('2026-11-11T09:20:00Z').getTime();
  const diffHours = Math.max(
    1,
    Math.round((new Date(snooze.mutedUntilIso).getTime() - refNow) / 3_600_000)
  );
  if (diffHours < 48) return `${diffHours}h left`;
  return `${Math.round(diffHours / 24)}d left`;
}

export const LeftNavigationRail: React.FC<LeftNavigationRailProps> = ({
  edition,
  editionClusters,
  readClusterIds,
  lenses,
  activeLensId,
  activeSnoozes,
  dietStats,
  predictions,
  onSelectLens,
  onDeleteLens,
  onOpenLensBuilder,
  onWakeSnooze,
  onOpenDietModal,
  onOpenLedgerModal,
  onMarkEditionComplete,
}) => {
  const readSet = new Set(readClusterIds);
  const totalInEdition = editionClusters.length;
  const readInEdition = editionClusters.filter((c) => readSet.has(c.storyClusterId)).length;
  const pct = totalInEdition > 0 ? Math.round((readInEdition / totalInEdition) * 100) : 0;

  const remainingMinutes = editionClusters
    .filter((c) => !readSet.has(c.storyClusterId))
    .reduce((sum, c) => sum + c.readingMinutes, 0);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (pct / 100) * circumference;

  const dueCount = predictions.filter((p) => p.status === 'Due Today').length;

  return (
    <aside className="space-y-4">
      {/* 1. Finite Edition Progress Ring */}
      <section className="editorial-card p-4">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                stroke="var(--surface-brief-inset)"
                strokeWidth="5"
              />
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                stroke="#059669"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute font-mono text-[11px] font-semibold text-ink-primary tabular-nums">
              {readInEdition}/{totalInEdition}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              {edition === '5min'
                ? '5-Min Morning Brief'
                : edition === '15min'
                  ? '15-Min Deep Catch-Up'
                  : 'Live Wire Stream'}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-ink-primary">
              {readInEdition === totalInEdition && totalInEdition > 0
                ? 'You’re Caught Up'
                : `${remainingMinutes}m reading left`}
            </p>
            <p className="text-[11px] text-ink-muted tabular-nums">{pct}% edition absorbed</p>
          </div>
        </div>

        {totalInEdition > 0 && readInEdition < totalInEdition && (
          <button
            type="button"
            onClick={onMarkEditionComplete}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] px-2.5 py-1.5 text-xs font-semibold text-ink-primary transition hover:border-emerald-600/40 hover:text-emerald-700 dark:hover:text-emerald-300"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark Edition Caught Up
          </button>
        )}
      </section>

      {/* 2. Saved Custom Lenses */}
      <section className="editorial-card p-4">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border-editorial-hairline)]">
          <div className="flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-ink-muted" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
              Saved Lenses
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpenLensBuilder}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-brief-inset)] px-2 py-0.5 text-[11px] font-semibold text-ink-primary transition hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300"
          >
            <Plus className="h-3 w-3" />
            Build
          </button>
        </div>

        <nav className="mt-2.5 space-y-1" aria-label="Saved reading lenses">
          {lenses.map((lens) => {
            const active = lens.id === activeLensId;
            return (
              <div key={lens.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelectLens(lens.id)}
                  className={`flex-1 rounded-lg px-2.5 py-2 text-left transition ${
                    active
                      ? 'bg-[var(--border-signal-active)] text-white dark:text-slate-950 font-semibold'
                      : 'text-ink-secondary hover:bg-[var(--surface-brief-inset)] hover:text-ink-primary'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate text-xs">{lens.name}</span>
                    {!lens.isBuiltIn && (
                      <span
                        className={`rounded px-1 text-[9px] font-mono uppercase ${
                          active
                            ? 'bg-white/20 text-white dark:text-slate-950'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        Custom
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-0.5 truncate text-[10.5px] ${
                      active ? 'opacity-85' : 'text-ink-muted'
                    }`}
                  >
                    {lens.description}
                  </p>
                </button>

                {!lens.isBuiltIn && (
                  <button
                    type="button"
                    onClick={() => onDeleteLens(lens.id)}
                    aria-label={`Delete lens ${lens.name}`}
                    className="rounded-md p-1.5 text-ink-muted opacity-60 hover:bg-rose-500/10 hover:text-rose-600 hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </section>

      {/* 3. Active Snoozed Keywords Tray */}
      <section className="editorial-card p-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-editorial-hairline)]">
          <div className="flex items-center gap-1.5">
            <VolumeX className="h-3.5 w-3.5 text-ink-muted" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
              Snoozed Topics
            </h3>
          </div>
          <span className="font-mono text-[11px] font-semibold text-ink-muted tabular-nums">
            {activeSnoozes.length} muted
          </span>
        </div>

        {activeSnoozes.length === 0 ? (
          <p className="mt-2.5 text-xs text-ink-muted">
            No topics muted. Click <strong>Snooze</strong> on any card to temporarily pause fatigue.
          </p>
        ) : (
          <ul className="mt-2.5 space-y-2">
            {activeSnoozes.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-brief-inset)] px-2.5 py-1.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-primary">{s.keyword}</p>
                  <p className="font-mono text-[10px] text-ink-muted">
                    {formatRemainingTtl(s)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onWakeSnooze(s.id)}
                  className="shrink-0 rounded-full border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] px-2 py-0.5 text-[11px] font-semibold text-ink-secondary hover:text-ink-primary"
                >
                  Wake
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. Information Diet Receipt Summary Card */}
      <section className="editorial-card p-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-editorial-hairline)]">
          <div className="flex items-center gap-1.5">
            <ReceiptText className="h-3.5 w-3.5 text-emerald-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
              Information Diet
            </h3>
          </div>
          <span className="font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            RECEIPT
          </span>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-ink-secondary">
          <strong className="font-mono text-ink-primary tabular-nums">
            {dietStats.primaryReportingPct}%
          </strong>{' '}
          Original Reporting •{' '}
          <strong className="font-mono text-ink-primary tabular-nums">
            {dietStats.blindspotsUncovered}
          </strong>{' '}
          Blindspots Uncovered •{' '}
          <strong className="font-mono text-ink-primary tabular-nums">
            {dietStats.clickbaitFilteredCount}
          </strong>{' '}
          Clickbait Filtered
        </p>

        <button
          type="button"
          onClick={onOpenDietModal}
          className="mt-3 w-full rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] px-2.5 py-1.5 text-xs font-semibold text-ink-primary transition hover:border-[var(--border-signal-active)]"
        >
          View Weekly Diet Receipt
        </button>
      </section>

      {/* 5. Accountability Ledger Shortcut */}
      <section className="editorial-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Pin className="h-3.5 w-3.5 text-amber-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
              Outcome Ledger
            </h3>
          </div>
          {dueCount > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-800 dark:text-amber-300">
              {dueCount} DUE TODAY
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-ink-secondary">
          {predictions.length} forecast{predictions.length === 1 ? '' : 's'} tracked for follow-up accountability.
        </p>
        <button
          type="button"
          onClick={onOpenLedgerModal}
          className="mt-3 w-full rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] px-2.5 py-1.5 text-xs font-semibold text-ink-primary transition hover:border-[var(--border-signal-active)]"
        >
          Open Prediction Ledger
        </button>
      </section>
    </aside>
  );
};

