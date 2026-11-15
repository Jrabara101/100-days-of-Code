import React from 'react';
import { ReceiptText, X } from 'lucide-react';
import { InformationDietStats } from '../types/news';

interface InformationDietModalProps {
  open: boolean;
  stats: InformationDietStats;
  onClose: () => void;
}

export const InformationDietModal: React.FC<InformationDietModalProps> = ({
  open,
  stats,
  onClose,
}) => {
  if (!open) return null;

  const totalLens = Math.max(
    1,
    stats.lensBreakdown.Market +
      stats.lensBreakdown.Policy +
      stats.lensBreakdown.Technical +
      stats.lensBreakdown.LocalIntl
  );

  const marketPct = Math.round((stats.lensBreakdown.Market / totalLens) * 100);
  const policyPct = Math.round((stats.lensBreakdown.Policy / totalLens) * 100);
  const techPct = Math.round((stats.lensBreakdown.Technical / totalLens) * 100);
  const localPct = Math.max(0, 100 - marketPct - policyPct - techPct);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Weekly Information Diet Receipt"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-[var(--border-column-rule)] bg-[var(--surface-cluster-card)] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-editorial-hairline)] pb-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-emerald-600" />
            <div>
              <h2 className="font-serif text-xl font-semibold text-ink-primary">
                Information Diet Receipt
              </h2>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                WEDNESDAY EDITION • ECHO-CHAMBER & NOISE AUDIT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close diet receipt"
            className="rounded-full p-1 text-ink-muted hover:bg-[var(--surface-brief-inset)] hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="editorial-inset p-3.5">
            <p className="font-mono text-[10px] uppercase text-ink-muted">
              Original Reporting Ratio
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
              {stats.primaryReportingPct}%
            </p>
          </div>
          <div className="editorial-inset p-3.5">
            <p className="font-mono text-[10px] uppercase text-ink-muted">
              Blindspots Uncovered
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-rose-700 dark:text-rose-300 tabular-nums">
              {stats.blindspotsUncovered}
            </p>
          </div>
          <div className="editorial-inset p-3.5">
            <p className="font-mono text-[10px] uppercase text-ink-muted">
              Clickbait Articles Filtered
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-ink-primary tabular-nums">
              {stats.clickbaitFilteredCount}
            </p>
          </div>
          <div className="editorial-inset p-3.5">
            <p className="font-mono text-[10px] uppercase text-ink-muted">
              Rewrites Deduplicated
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-ink-primary tabular-nums">
              {stats.duplicatesBypassedCount}{' '}
              <span className="text-xs font-normal text-ink-muted">
                (~{stats.minutesSaved}m saved)
              </span>
            </p>
          </div>
        </div>

        {/* Lens Balance Bar */}
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
            Perspective Lens Balance (Spot Echo-Chamber Drift)
          </p>
          <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-[var(--surface-brief-inset)]">
            <div style={{ width: `${marketPct}%` }} className="bg-[#2563EB]" title="Market" />
            <div style={{ width: `${policyPct}%` }} className="bg-[#D97706]" title="Policy" />
            <div style={{ width: `${techPct}%` }} className="bg-[#7C3AED]" title="Technical" />
            <div style={{ width: `${localPct}%` }} className="bg-[#059669]" title="Local & Intl" />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs text-ink-secondary">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" /> Market: {marketPct}%
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]" /> Policy: {policyPct}%
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7C3AED]" /> Technical: {techPct}%
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#059669]" /> Local / Global: {localPct}%
            </div>
          </div>
        </div>

        {/* Revenue Model Transparency Mix */}
        <div className="mt-5 border-t border-[var(--border-editorial-hairline)] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
            Source Revenue Model Mix
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {Object.entries(stats.revenueBreakdown).map(([model, count]) => (
              <span
                key={model}
                className="rounded-full border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] px-2.5 py-1 font-medium text-ink-secondary"
              >
                {model}: <strong className="font-mono text-ink-primary">{count}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

