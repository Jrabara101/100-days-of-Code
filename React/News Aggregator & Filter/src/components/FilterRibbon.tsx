import React from 'react';
import {
  Coffee,
  Crosshair,
  Globe,
  Moon,
  Radar,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Train,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { EditionMode, FeedFilters } from '../types/news';

interface FilterRibbonProps {
  filters: FeedFilters;
  darkMode: boolean;
  hiddenOpinionCount: number;
  dehypedCount: number;
  totalMatchingCount: number;
  searchInputRef: React.RefObject<HTMLInputElement>;
  onUpdateFilters: (patch: Partial<FeedFilters>) => void;
  onToggleDarkMode: () => void;
  onOpenMobileMenu: () => void;
}

const EDITIONS: Array<{
  id: EditionMode;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: '5min', label: '5-Min Morning Brief • 6 Stories', shortLabel: '5-Min Brief (6)', icon: Coffee },
  { id: '15min', label: '15-Min Deep Catch-Up', shortLabel: '15-Min Catch-Up', icon: Train },
  { id: 'stream', label: 'Live Wire Stream', shortLabel: 'Live Stream', icon: Globe },
];

export const FilterRibbon: React.FC<FilterRibbonProps> = ({
  filters,
  darkMode,
  hiddenOpinionCount,
  dehypedCount,
  totalMatchingCount,
  searchInputRef,
  onUpdateFilters,
  onToggleDarkMode,
  onOpenMobileMenu,
}) => {
  return (
    <header className="glass-filter-bar sticky top-0 z-30">
      <div className="mx-auto max-w-broadsheet px-4 sm:px-8 py-3">
        {/* Top Row: Masthead Edition Kicker, Edition Selector & Semantic Search */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenMobileMenu}
                className="inline-flex lg:hidden items-center gap-1.5 rounded-lg border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] px-2.5 py-1.5 text-xs font-semibold text-ink-primary"
                aria-label="Open lenses and reading diet"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Lenses
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-ink-primary">
                    Meridian Signal
                  </span>
                  <span className="hidden sm:inline-block h-3.5 w-px bg-[var(--border-column-rule)]" />
                  <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                    WEDNESDAY MORNING BRIEF • NOV 11
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Switch to Daylight Newsprint Mode' : 'Switch to OLED Dark Mode'}
              className="inline-flex lg:hidden items-center gap-1.5 rounded-full border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] p-2 text-ink-secondary hover:text-ink-primary"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Time-Boxed Edition Selector */}
            <div
              className="inline-flex rounded-full border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] p-1"
              role="group"
              aria-label="Time-Boxed Edition Mode"
            >
              {EDITIONS.map((ed) => {
                const Icon = ed.icon;
                const active = filters.edition === ed.id;
                return (
                  <button
                    key={ed.id}
                    type="button"
                    onClick={() => onUpdateFilters({ edition: ed.id })}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      active
                        ? 'bg-[var(--surface-cluster-card)] text-ink-primary shadow-sm ring-1 ring-[var(--border-editorial-hairline)]'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline">{ed.label}</span>
                    <span className="xl:hidden">{ed.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Semantic Search with -keyword Exclusion */}
            <div className="relative flex-1 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={filters.searchQuery}
                onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
                placeholder="Topic, company, or -exclude..."
                aria-label="Filter stories by topic or exclude with minus keyword"
                className="w-full rounded-full border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] py-1.5 pl-8 pr-14 text-xs text-ink-primary placeholder:text-ink-muted outline-none transition focus:border-[var(--border-signal-active)]"
              />
              {filters.searchQuery ? (
                <button
                  type="button"
                  onClick={() => onUpdateFilters({ searchQuery: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-muted hover:text-ink-primary"
                  aria-label="Clear search filter"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[var(--border-editorial-hairline)] px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                  ⌘K
                </kbd>
              )}
            </div>

            {/* Desktop Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              title={darkMode ? 'Daylight Newsprint Mode' : 'OLED Terminal Dark Mode'}
              aria-label={darkMode ? 'Switch to Daylight Newsprint Mode' : 'Switch to OLED Dark Mode'}
              className="hidden lg:inline-flex items-center justify-center rounded-full border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] p-2 text-ink-secondary transition hover:border-[var(--border-column-rule)] hover:text-ink-primary"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Bottom Row: Signal-to-Noise Filter Toggles */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-editorial-hairline)]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateFilters({ calmHeadlines: !filters.calmHeadlines })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filters.calmHeadlines
                  ? 'border-emerald-600/40 bg-emerald-600/12 text-emerald-800 dark:text-emerald-300'
                  : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Calm Headlines: {filters.calmHeadlines ? 'ON' : 'OFF'}
              {filters.calmHeadlines && dehypedCount > 0 && (
                <span className="font-mono text-[10px] opacity-80">({dehypedCount} de-hyped)</span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdateFilters({ primaryReportingOnly: !filters.primaryReportingOnly })
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filters.primaryReportingOnly
                  ? 'border-[var(--border-signal-active)] bg-[var(--border-signal-active)] text-white dark:text-slate-950'
                  : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <Crosshair className="h-3.5 w-3.5" />
              Primary Sources Only
            </button>

            <button
              type="button"
              onClick={() => onUpdateFilters({ hideOpinion: !filters.hideOpinion })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filters.hideOpinion
                  ? 'border-[var(--border-signal-active)] bg-[var(--border-signal-active)] text-white dark:text-slate-950'
                  : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <VolumeX className="h-3.5 w-3.5" />
              Hide Opinion & Punditry
              {filters.hideOpinion && hiddenOpinionCount > 0 && (
                <span className="font-mono text-[10px] opacity-80">
                  ({hiddenOpinionCount} hidden)
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onUpdateFilters({ blindspotOnly: !filters.blindspotOnly })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filters.blindspotOnly
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-300'
                  : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <Radar className="h-3.5 w-3.5" />
              Blindspot Radar
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdateFilters({ newDevelopmentsOnly: !filters.newDevelopmentsOnly })
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filters.newDevelopmentsOnly
                  ? 'border-emerald-600/40 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300'
                  : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              New Developments Only
            </button>
          </div>

          <span className="font-mono text-[11px] text-ink-muted tabular-nums">
            {totalMatchingCount} CLUSTER{totalMatchingCount === 1 ? '' : 'S'} MATCHING
          </span>
        </div>
      </div>
    </header>
  );
};

