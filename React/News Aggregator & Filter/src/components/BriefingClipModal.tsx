import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, FileText, X } from 'lucide-react';
import { StoryCluster } from '../types/news';
import { DigestExportFormat, formatBriefingDigest } from '../engine/exporter';

interface BriefingClipModalProps {
  open: boolean;
  clippedClusters: StoryCluster[];
  fallbackClusters: StoryCluster[];
  onClose: () => void;
  onRemoveClip: (clusterId: string) => void;
}

export const BriefingClipModal: React.FC<BriefingClipModalProps> = ({
  open,
  clippedClusters,
  fallbackClusters,
  onClose,
  onRemoveClip,
}) => {
  const [format, setFormat] = useState<DigestExportFormat>('markdown');
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const exportClusters =
    clippedClusters.length > 0 ? clippedClusters : fallbackClusters.slice(0, 3);

  const output = useMemo(
    () => formatBriefingDigest(exportClusters, notesById, format),
    [exportClusters, notesById, format]
  );

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meridian-briefing-${format}-2026-11-11.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Briefing Clip Exporter"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-column-rule)] bg-[var(--surface-cluster-card)] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-editorial-hairline)] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <div>
              <h2 className="font-serif text-xl font-semibold text-ink-primary">
                1-Click Briefing Clip Exporter
              </h2>
              <p className="text-xs text-ink-muted">
                {clippedClusters.length > 0
                  ? `${clippedClusters.length} clipped stories ready to export`
                  : 'No clips selected yet — previewing top 3 edition stories'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close briefing exporter"
            className="rounded-full p-1 text-ink-muted hover:bg-[var(--surface-brief-inset)] hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Format Tabs */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-full border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] p-1">
            {(
              [
                { id: 'markdown', label: 'Markdown Digest' },
                { id: 'slack', label: 'Slack Brief' },
                { id: 'newsletter', label: 'Newsletter Draft' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFormat(tab.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  format === tab.id
                    ? 'bg-[var(--surface-cluster-card)] text-ink-primary shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-column-rule)] bg-[var(--surface-brief-inset)] px-3.5 py-1.5 text-xs font-semibold text-ink-primary hover:border-[var(--border-signal-active)]"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--border-signal-active)] px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-950"
            >
              <Download className="h-3.5 w-3.5" />
              Download .md
            </button>
          </div>
        </div>

        {/* Per-story 1-line commentary inputs */}
        <div className="mt-4 space-y-2.5">
          {exportClusters.map((c) => (
            <div
              key={c.storyClusterId}
              className="rounded-xl border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-serif text-sm font-semibold text-ink-primary">
                  {c.calmHeadline}
                </p>
                {clippedClusters.some((x) => x.storyClusterId === c.storyClusterId) && (
                  <button
                    type="button"
                    onClick={() => onRemoveClip(c.storyClusterId)}
                    className="text-[11px] font-medium text-ink-muted hover:text-rose-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="text"
                value={notesById[c.storyClusterId] || ''}
                onChange={(e) =>
                  setNotesById((prev) => ({ ...prev, [c.storyClusterId]: e.target.value }))
                }
                placeholder="Attach your 1-line commentary or team takeaway..."
                className="mt-2 w-full rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] px-2.5 py-1.5 text-xs text-ink-primary outline-none focus:border-[var(--border-signal-active)]"
              />
            </div>
          ))}
        </div>

        {/* Live Rendered Output Preview */}
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Formatted Export Preview
          </p>
          <pre className="mt-1.5 max-h-60 overflow-auto rounded-xl border border-[var(--border-editorial-hairline)] bg-[var(--canvas-newsprint-base)] p-3.5 font-mono text-[11.5px] leading-relaxed text-ink-secondary whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
};

