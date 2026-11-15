import React, { useState } from 'react';
import { Clock, VolumeX, X } from 'lucide-react';
import { StoryCluster } from '../types/news';

interface SnoozePopoverProps {
  cluster: StoryCluster;
  onSnooze: (keyword: string, durationLabel: string, hours: number | null) => void;
  onClose: () => void;
}

const DURATIONS: Array<{ label: string; hours: number | null }> = [
  { label: '24 Hours', hours: 24 },
  { label: '7 Days', hours: 24 * 7 },
  { label: '30 Days', hours: 24 * 30 },
  { label: 'Until Major Resolution', hours: null },
];

export const SnoozePopover: React.FC<SnoozePopoverProps> = ({
  cluster,
  onSnooze,
  onClose,
}) => {
  const keywordCandidates = Array.from(
    new Set([cluster.topicPillar, ...cluster.entities.slice(0, 3), ...cluster.tags.slice(0, 2)])
  );
  const [selectedKeyword, setSelectedKeyword] = useState<string>(keywordCandidates[0] || cluster.topicPillar);

  return (
    <div
      role="dialog"
      aria-label="Snooze topic"
      className="absolute left-0 sm:left-auto sm:right-0 top-full z-40 mt-2 w-[272px] max-w-[calc(100vw-2.5rem)] rounded-xl border border-[var(--border-column-rule)] bg-[var(--surface-cluster-card)] p-3.5 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-editorial-hairline)]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-primary">
          <VolumeX className="h-3.5 w-3.5 text-ink-muted" />
          <span>Snooze Topic Temporarily</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-0.5 text-ink-muted hover:bg-[var(--surface-brief-inset)] hover:text-ink-primary"
          aria-label="Close snooze menu"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mt-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
        Pause stories matching:
      </p>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {keywordCandidates.map((kw) => {
          const active = selectedKeyword === kw;
          return (
            <button
              key={kw}
              type="button"
              onClick={() => setSelectedKeyword(kw)}
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                active
                  ? 'border-[var(--border-signal-active)] bg-[var(--border-signal-active)] text-white dark:text-slate-950'
                  : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {kw}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        value={selectedKeyword}
        onChange={(e) => setSelectedKeyword(e.target.value)}
        placeholder="Or type custom keyword..."
        className="mt-2 w-full rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--canvas-newsprint-base)] px-2.5 py-1.5 text-xs text-ink-primary outline-none focus:border-[var(--border-signal-active)]"
      />

      <p className="mt-3 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
        <Clock className="h-3 w-3" />
        Mute window:
      </p>

      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {DURATIONS.map((d) => (
          <button
            key={d.label}
            type="button"
            disabled={!selectedKeyword.trim()}
            onClick={() => {
              onSnooze(selectedKeyword.trim(), d.label, d.hours);
              onClose();
            }}
            className={`rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] px-2 py-1.5 text-left text-[11px] font-semibold text-ink-primary transition hover:border-[var(--border-signal-active)] hover:bg-[var(--surface-cluster-card)] disabled:opacity-40 ${
              d.hours === null ? 'col-span-2 text-center' : ''
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
};

