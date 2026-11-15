import React, { useState } from 'react';
import { Award, Building2, CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import { SourceProfile } from '../types/news';

interface SourceBadgeProps {
  source: SourceProfile;
  isPrimaryOrigin?: boolean;
  dimmed?: boolean;
  compact?: boolean;
}

const REVENUE_COLORS: Record<SourceProfile['revenueModel'], string> = {
  'Reader-Supported': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  'Public Broadcast': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25',
  'Institutional Wire': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
  'Ad-Driven': 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/25',
};

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  source,
  isPrimaryOrigin = false,
  dimmed = false,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center transition-opacity duration-200 ${
        dimmed ? 'opacity-30' : 'opacity-100'
      }`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={`Source transparency info for ${source.name}`}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
          isPrimaryOrigin
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 hover:bg-amber-500/15'
            : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] text-ink-secondary hover:border-[var(--border-column-rule)] hover:text-ink-primary'
        }`}
      >
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-mono font-semibold text-white"
          style={{ backgroundColor: source.accentHex }}
        >
          {source.shortCode.slice(0, 2)}
        </span>
        <span className={compact ? 'max-w-[95px] truncate' : ''}>{source.name}</span>
        {isPrimaryOrigin && (
          <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            <Award className="h-3 w-3" />
            Origin
          </span>
        )}
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] p-3.5 text-left shadow-xl"
        >
          <div className="flex items-start justify-between gap-2 border-b border-[var(--border-editorial-hairline)] pb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-ink-primary">{source.name}</span>
                {isPrimaryOrigin && (
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                    PRIMARY ORIGIN
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] text-ink-muted">{source.domain}</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
              <ShieldCheck className="h-3 w-3" />
              {source.factualScore}%
            </span>
          </div>

          <div className="mt-2.5 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />
              <div>
                <span className="text-ink-muted">Ownership: </span>
                <span className="font-medium text-ink-primary">{source.ownership}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-muted flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Revenue:
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${REVENUE_COLORS[source.revenueModel]}`}
              >
                {source.revenueModel}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-muted flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Track Record:
              </span>
              <span className="font-medium text-ink-primary">
                {source.factualTrackRecord} ({source.stance})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

