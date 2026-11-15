import React from 'react';
import { CheckCircle2, FileDown, Globe } from 'lucide-react';
import { EditionMode } from '../types/news';

interface EditionCompleteCardProps {
  edition: EditionMode;
  storiesCount: number;
  duplicatesBypassed: number;
  dehypedCount: number;
  totalMinutes: number;
  onExportDigest: () => void;
  onSwitchToFullStream: () => void;
}

export const EditionCompleteCard: React.FC<EditionCompleteCardProps> = ({
  edition,
  storiesCount,
  duplicatesBypassed,
  dehypedCount,
  totalMinutes,
  onExportDigest,
  onSwitchToFullStream,
}) => {
  if (edition === 'stream' || storiesCount === 0) return null;

  return (
    <section
      className="mt-6 rounded-2xl border border-emerald-600/25 p-7 text-center"
      style={{ backgroundColor: 'var(--surface-edition-complete)' }}
    >
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-6 w-6" />
      </div>

      <h3 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink-primary">
        You’re Caught Up
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-secondary">
        You absorbed <strong className="text-ink-primary">{storiesCount}</strong> high-signal
        developments in roughly{' '}
        <strong className="font-mono text-ink-primary tabular-nums">{totalMinutes} minutes</strong>{' '}
        while bypassing{' '}
        <strong className="font-mono text-ink-primary tabular-nums">{duplicatesBypassed}</strong>{' '}
        derivative wire rewrites and{' '}
        <strong className="font-mono text-ink-primary tabular-nums">{dehypedCount}</strong>{' '}
        sensationalized clickbait frames.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onExportDigest}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--border-signal-active)] px-4 py-2 text-xs font-semibold text-white dark:text-slate-950 transition hover:opacity-90"
        >
          <FileDown className="h-3.5 w-3.5" />
          Export Morning Digest
        </button>

        <button
          type="button"
          onClick={onSwitchToFullStream}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-column-rule)] bg-[var(--surface-cluster-card)] px-4 py-2 text-xs font-semibold text-ink-primary transition hover:bg-[var(--surface-brief-inset)]"
        >
          <Globe className="h-3.5 w-3.5" />
          Browse Live Wire Stream
        </button>
      </div>
    </section>
  );
};

