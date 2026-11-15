import React, { useState } from 'react';
import { BarChart3, Globe2, Highlighter, Scale, Wrench } from 'lucide-react';
import { DomainLens, PerspectiveItem } from '../types/news';
import { SourceBadge } from './SourceBadge';
import { SpinHighlightedText } from './SpinHighlightedText';

interface FramingComparisonViewProps {
  perspectives: PerspectiveItem[];
  primarySourceId: string;
  calmHeadlines: boolean;
  stacked?: boolean;
}

function getLensMeta(lens: DomainLens) {
  switch (lens) {
    case 'Market':
      return {
        label: 'Market / Financial Lens',
        icon: BarChart3,
        badgeClass: 'text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/25',
      };
    case 'Technical':
      return {
        label: 'Technical / Domain Lens',
        icon: Wrench,
        badgeClass: 'text-violet-700 dark:text-violet-300 bg-violet-500/10 border-violet-500/25',
      };
    case 'Policy':
      return {
        label: 'Policy / Regulatory Lens',
        icon: Scale,
        badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
      };
    default:
      return {
        label: `${lens} / Global Lens`,
        icon: Globe2,
        badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
      };
  }
}

export const FramingComparisonView: React.FC<FramingComparisonViewProps> = ({
  perspectives,
  primarySourceId,
  calmHeadlines,
  stacked = false,
}) => {
  const [highlightSpin, setHighlightSpin] = useState(true);

  if (perspectives.length === 0) return null;

  return (
    <div className="editorial-inset border border-[var(--border-editorial-hairline)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-editorial-hairline)]">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
            Side-by-Side Framing Comparison ({perspectives.length} Outlets)
          </h4>
          <p className="text-[11px] text-ink-muted">
            How distinct lenses frame the exact same underlying event
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHighlightSpin((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            highlightSpin
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200'
              : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] text-ink-secondary'
          }`}
        >
          <Highlighter className="h-3 w-3" />
          Language & Spin Highlighter: {highlightSpin ? 'ON' : 'OFF'}
        </button>
      </div>

      <div
        className={`mt-3 grid gap-3 ${
          stacked ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
        }`}
      >
        {perspectives.map((item) => {
          const meta = getLensMeta(item.lens);
          const LensIcon = meta.icon;
          const headlineToDisplay = calmHeadlines ? item.calmHeadline : item.originalHeadline;

          return (
            <div
              key={item.articleId}
              className="flex flex-col justify-between rounded-[10px] border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] p-3.5"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badgeClass}`}
                  >
                    <LensIcon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </div>

                <div className="mt-2.5">
                  <SourceBadge
                    source={item.source}
                    isPrimaryOrigin={item.source.id === primarySourceId}
                  />
                </div>

                <h5 className="mt-2.5 font-serif text-sm font-semibold leading-snug text-ink-primary">
                  “{headlineToDisplay}”
                </h5>

                <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
                  <SpinHighlightedText
                    text={item.excerpt}
                    loadedWords={item.loadedAdjectives}
                    enabled={highlightSpin}
                  />
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[var(--border-editorial-hairline)] pt-2 text-[11px] text-ink-muted">
                <span>{item.source.revenueModel}</span>
                {item.loadedAdjectives.length > 0 ? (
                  <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300">
                    {item.loadedAdjectives.length} spin term
                    {item.loadedAdjectives.length > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                    Neutral prose
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

