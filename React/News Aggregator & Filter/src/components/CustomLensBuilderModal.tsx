import React, { useMemo, useState } from 'react';
import { MinusCircle, Plus, PlusCircle, Sliders, X } from 'lucide-react';
import { SavedLens, StoryCluster } from '../types/news';
import { applyFeedFilters } from '../engine/filtering';

interface CustomLensBuilderModalProps {
  open: boolean;
  allClusters: StoryCluster[];
  onClose: () => void;
  onSaveLens: (lens: SavedLens) => void;
}

const SUGGESTED_INCLUDE = [
  'Semiconductor Supply Chain',
  'Clean Energy',
  'AI Governance',
  'Central Banking',
  'Public Health',
  'Local Civic',
  'Cybersecurity',
  'Cloud Infrastructure',
];

const SUGGESTED_EXCLUDE = [
  'Celebrity Gossip',
  'Stock Price Speculation',
  'Opinion',
  'Social Media Rumors',
];

export const CustomLensBuilderModal: React.FC<CustomLensBuilderModalProps> = ({
  open,
  allClusters,
  onClose,
  onSaveLens,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [includeTopics, setIncludeTopics] = useState<string[]>(['Semiconductor Supply Chain']);
  const [excludeTopics, setExcludeTopics] = useState<string[]>(['Celebrity Gossip', 'Stock Price Speculation']);
  const [customInclude, setCustomInclude] = useState('');
  const [customExclude, setCustomExclude] = useState('');
  const [primaryOnly, setPrimaryOnly] = useState(true);
  const [hideOpinion, setHideOpinion] = useState(true);
  const [readerSupportedOnly, setReaderSupportedOnly] = useState(false);
  const [minSignalScore, setMinSignalScore] = useState(60);

  const draftLens: SavedLens = useMemo(
    () => ({
      id: 'draft-preview',
      name: name.trim() || 'Custom Signal Lens',
      description: description.trim() || 'Custom topic and source-tier lens',
      includeTopics,
      excludeTopics,
      primaryOnly,
      hideOpinion,
      minSignalScore,
      readerSupportedOnly,
    }),
    [
      name,
      description,
      includeTopics,
      excludeTopics,
      primaryOnly,
      hideOpinion,
      minSignalScore,
      readerSupportedOnly,
    ]
  );

  const previewCount = useMemo(() => {
    const res = applyFeedFilters(
      allClusters,
      {
        edition: 'stream',
        primaryReportingOnly: false,
        hideOpinion: false,
        calmHeadlines: true,
        blindspotOnly: false,
        newDevelopmentsOnly: false,
        searchQuery: '',
        activeLensId: 'draft-preview',
      },
      [],
      [draftLens]
    );
    return res.matchingClusters.length;
  }, [allClusters, draftLens]);

  if (!open) return null;

  const toggleTopic = (list: string[], setter: (v: string[]) => void, topic: string) => {
    if (list.includes(topic)) {
      setter(list.filter((t) => t !== topic));
    } else {
      setter([...list, topic]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLens({
      ...draftLens,
      id: `lens-custom-${Date.now()}`,
      isBuiltIn: false,
    });
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-label="Custom Saved Lens Builder"
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-column-rule)] bg-[var(--surface-cluster-card)] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-editorial-hairline)] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <h2 className="font-serif text-xl font-semibold text-ink-primary">
              Custom Saved Lens Builder
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-ink-muted hover:bg-[var(--surface-brief-inset)] hover:text-ink-primary"
            aria-label="Close lens builder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink-primary">Lens Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grid & Silicon Signal"
                required
                className="mt-1 w-full rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--canvas-newsprint-base)] px-3 py-2 text-xs text-ink-primary outline-none focus:border-[var(--border-signal-active)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-primary">Short Purpose</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Primary supply chain & clean energy"
                className="mt-1 w-full rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--canvas-newsprint-base)] px-3 py-2 text-xs text-ink-primary outline-none focus:border-[var(--border-signal-active)]"
              />
            </div>
          </div>

          {/* Positive Topic Pills */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <PlusCircle className="h-3.5 w-3.5" />
              Positive Topic Pills (Match any)
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from(new Set([...SUGGESTED_INCLUDE, ...includeTopics])).map((topic) => {
                const active = includeTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(includeTopics, setIncludeTopics, topic)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      active
                        ? 'border-emerald-600/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                        : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] text-ink-secondary'
                    }`}
                  >
                    + {topic}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={customInclude}
                onChange={(e) => setCustomInclude(e.target.value)}
                placeholder="Add custom +topic..."
                className="flex-1 rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--canvas-newsprint-base)] px-2.5 py-1.5 text-xs text-ink-primary outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customInclude.trim()) {
                    setIncludeTopics([...includeTopics, customInclude.trim()]);
                    setCustomInclude('');
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] px-2.5 py-1.5 text-xs font-semibold text-ink-primary"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
          </div>

          {/* Negative Exclusion Pills */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <MinusCircle className="h-3.5 w-3.5" />
              Negative Exclusion Pills (Always filter out)
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from(new Set([...SUGGESTED_EXCLUDE, ...excludeTopics])).map((topic) => {
                const active = excludeTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(excludeTopics, setExcludeTopics, topic)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      active
                        ? 'border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-200'
                        : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] text-ink-secondary'
                    }`}
                  >
                    - {topic}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={customExclude}
                onChange={(e) => setCustomExclude(e.target.value)}
                placeholder="Add custom -exclusion..."
                className="flex-1 rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--canvas-newsprint-base)] px-2.5 py-1.5 text-xs text-ink-primary outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customExclude.trim()) {
                    setExcludeTopics([...excludeTopics, customExclude.trim()]);
                    setCustomExclude('');
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] px-2.5 py-1.5 text-xs font-semibold text-ink-primary"
              >
                <Plus className="h-3 w-3" /> Exclude
              </button>
            </div>
          </div>

          {/* Source-Tier & Signal Threshold Rules */}
          <div className="editorial-inset p-3.5 space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Source-Tier Rules
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={primaryOnly}
                  onChange={(e) => setPrimaryOnly(e.target.checked)}
                  className="accent-emerald-600"
                />
                <span>Primary Reporting Only</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideOpinion}
                  onChange={(e) => setHideOpinion(e.target.checked)}
                  className="accent-emerald-600"
                />
                <span>Hide Opinion & Punditry</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readerSupportedOnly}
                  onChange={(e) => setReaderSupportedOnly(e.target.checked)}
                  className="accent-emerald-600"
                />
                <span>Reader-Supported / Public Broadcast</span>
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink-secondary">Minimum Signal Score</span>
                <span className="font-mono font-semibold text-ink-primary tabular-nums">
                  {minSignalScore}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={minSignalScore}
                onChange={(e) => setMinSignalScore(Number(e.target.value))}
                className="mt-1 w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--border-editorial-hairline)] pt-4">
          <span className="font-mono text-xs text-ink-secondary tabular-nums">
            Matches <strong>{previewCount}</strong> active cluster{previewCount === 1 ? '' : 's'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[var(--border-editorial-hairline)] px-4 py-1.5 text-xs font-semibold text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-[var(--border-signal-active)] px-4 py-1.5 text-xs font-semibold text-white dark:text-slate-950 transition hover:opacity-90"
            >
              Save 1-Click Lens
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

