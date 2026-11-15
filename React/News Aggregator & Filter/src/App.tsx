import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Undo2, X } from 'lucide-react';
import {
  BUILT_IN_LENSES,
  INITIAL_LAST_READ_MAP,
  INITIAL_READ_CLUSTER_IDS,
  INITIAL_SNOOZES,
  INITIAL_TRACKED_PREDICTIONS,
} from './data/initialState';
import { RAW_ARTICLES } from './data/rawArticles';
import { SOURCES } from './data/sources';
import { clusterAndRankArticles } from './engine/clustering';
import { computeInformationDietStats } from './engine/dietAndPredictions';
import { applyFeedFilters } from './engine/filtering';
import {
  FeedFilters,
  SavedLens,
  SnoozedTopic,
  StoryCluster,
  TrackedPrediction,
} from './types/news';
import { usePersistentState } from './hooks/usePersistentState';
import { AccountabilityLedgerModal } from './components/AccountabilityLedgerModal';
import { BriefingClipModal } from './components/BriefingClipModal';
import { CleanReaderDrawer } from './components/CleanReaderDrawer';
import { CustomLensBuilderModal } from './components/CustomLensBuilderModal';
import { EditionCompleteCard } from './components/EditionCompleteCard';
import { FilterRibbon } from './components/FilterRibbon';
import { InformationDietModal } from './components/InformationDietModal';
import { LeftNavigationRail } from './components/LeftNavigationRail';
import { RightContextRail } from './components/RightContextRail';
import { StoryClusterCard } from './components/StoryClusterCard';

const DEFAULT_FILTERS: FeedFilters = {
  edition: '5min',
  primaryReportingOnly: false,
  hideOpinion: true,
  calmHeadlines: true,
  blindspotOnly: false,
  newDevelopmentsOnly: false,
  searchQuery: '',
  activeLensId: 'lens-all',
};

interface ToastState {
  message: string;
  undoSnoozeId?: string;
}

export function App() {
  const [darkMode, setDarkMode] = usePersistentState<boolean>('meridian-dark-mode', false);
  const [filters, setFilters] = usePersistentState<FeedFilters>('meridian-filters-v1', DEFAULT_FILTERS);
  const [customLenses, setCustomLenses] = usePersistentState<SavedLens[]>('meridian-custom-lenses-v1', []);
  const [snoozes, setSnoozes] = usePersistentState<SnoozedTopic[]>('meridian-snoozes-v1', INITIAL_SNOOZES);
  const [lastReadMap, setLastReadMap] = usePersistentState<Record<string, string>>(
    'meridian-last-read-v1',
    INITIAL_LAST_READ_MAP
  );
  const [readClusterIds, setReadClusterIds] = usePersistentState<string[]>(
    'meridian-read-ids-v1',
    INITIAL_READ_CLUSTER_IDS
  );
  const [clippedIds, setClippedIds] = usePersistentState<string[]>('meridian-clipped-ids-v1', []);
  const [predictions, setPredictions] = usePersistentState<TrackedPrediction[]>(
    'meridian-predictions-v1',
    INITIAL_TRACKED_PREDICTIONS
  );

  const [expandedCompareIds, setExpandedCompareIds] = useState<string[]>([]);
  const [pinnedInspectId, setPinnedInspectId] = useState<string | null>(null);
  const [readerClusterId, setReaderClusterId] = useState<string | null>(null);
  const [lensBuilderOpen, setLensBuilderOpen] = useState(false);
  const [clipModalOpen, setClipModalOpen] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [dietModalOpen, setDietModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // ⌘K / Ctrl+K focuses search input; Escape closes active overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setReaderClusterId(null);
        setLensBuilderOpen(false);
        setClipModalOpen(false);
        setLedgerModalOpen(false);
        setDietModalOpen(false);
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const allLenses = useMemo(() => [...BUILT_IN_LENSES, ...customLenses], [customLenses]);

  // Run Backend Aggregation, Clustering, Sensationalism & Framing Engine
  const allClusters = useMemo(
    () => clusterAndRankArticles(RAW_ARTICLES, SOURCES, lastReadMap),
    [lastReadMap]
  );

  const refNowMs = new Date('2026-11-11T09:20:00Z').getTime();

  const filtered = useMemo(
    () => applyFeedFilters(allClusters, filters, snoozes, allLenses, refNowMs),
    [allClusters, filters, snoozes, allLenses, refNowMs]
  );

  const dietStats = useMemo(
    () => computeInformationDietStats(readClusterIds, allClusters, filtered),
    [readClusterIds, allClusters, filtered]
  );

  const activeLens = useMemo(
    () => allLenses.find((l) => l.id === filters.activeLensId),
    [allLenses, filters.activeLensId]
  );

  const pinnedCluster = useMemo(
    () => allClusters.find((c) => c.storyClusterId === pinnedInspectId) || null,
    [allClusters, pinnedInspectId]
  );

  const readerCluster = useMemo(
    () => allClusters.find((c) => c.storyClusterId === readerClusterId) || null,
    [allClusters, readerClusterId]
  );

  const clippedClusters = useMemo(
    () => allClusters.filter((c) => clippedIds.includes(c.storyClusterId)),
    [allClusters, clippedIds]
  );

  const updateFilters = (patch: Partial<FeedFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleToggleRead = (cluster: StoryCluster) => {
    const id = cluster.storyClusterId;
    setReadClusterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setLastReadMap((prev) => ({
      ...prev,
      [id]: '2026-11-11T12:00:00Z',
    }));
  };

  const handleMarkReaderAbsorbed = (cluster: StoryCluster) => {
    const id = cluster.storyClusterId;
    setReadClusterIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setLastReadMap((prev) => ({
      ...prev,
      [id]: '2026-11-11T12:00:00Z',
    }));
  };

  const handleMarkEditionComplete = () => {
    const ids = filtered.editionClusters.map((c) => c.storyClusterId);
    setReadClusterIds((prev) => Array.from(new Set([...prev, ...ids])));
    setLastReadMap((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = '2026-11-11T12:00:00Z';
      });
      return next;
    });
    setToast({ message: `Marked all ${ids.length} edition stories caught up.` });
  };

  const handleToggleClip = (clusterId: string) => {
    setClippedIds((prev) =>
      prev.includes(clusterId) ? prev.filter((x) => x !== clusterId) : [...prev, clusterId]
    );
  };

  const handleToggleCompare = (cluster: StoryCluster) => {
    const id = cluster.storyClusterId;
    setExpandedCompareIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        if (pinnedInspectId === id) setPinnedInspectId(null);
        return prev.filter((x) => x !== id);
      }
      setPinnedInspectId(id);
      return [...prev, id];
    });
  };

  const handleSnooze = (keyword: string, durationLabel: string, hours: number | null) => {
    const id = `snooze-${Date.now()}`;
    const mutedUntilIso =
      hours === null
        ? null
        : new Date(refNowMs + hours * 3_600_000).toISOString();

    const nextSnooze: SnoozedTopic = {
      id,
      keyword,
      durationLabel,
      mutedUntilIso,
      untilMajorResolution: hours === null,
      createdAtIso: '2026-11-11T09:20:00Z',
    };

    setSnoozes((prev) => [nextSnooze, ...prev]);
    setToast({
      message: `Muted "${keyword}" (${durationLabel})`,
      undoSnoozeId: id,
    });
  };

  const handleWakeSnooze = (snoozeId: string) => {
    setSnoozes((prev) => prev.filter((s) => s.id !== snoozeId));
    setToast({ message: 'Topic restored to your feed.' });
  };

  const handleTrackForecast = (cluster: StoryCluster) => {
    if (!cluster.forecast) return;
    const exists = predictions.some((p) => p.id === cluster.forecast!.id);
    if (exists) {
      setLedgerModalOpen(true);
      return;
    }

    const nextPred: TrackedPrediction = {
      id: cluster.forecast.id,
      storyClusterId: cluster.storyClusterId,
      storyTitle: cluster.calmHeadline,
      claim: cluster.forecast.claim,
      sourceName: cluster.forecast.sourceName,
      trackedAtIso: '2026-11-11T09:20:00Z',
      targetDateIso: cluster.forecast.targetDateIso,
      targetDateLabel: cluster.forecast.targetDateLabel,
      status: 'Pending',
      note: cluster.forecast.confidenceLabel,
    };

    setPredictions((prev) => [nextPred, ...prev]);
    setToast({ message: `Pinned forecast to Accountability Ledger (${cluster.forecast.targetDateLabel})` });
  };

  const handleUpdatePredictionStatus = (id: string, status: TrackedPrediction['status']) => {
    setPredictions((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const handleRemovePrediction = (id: string) => {
    setPredictions((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveCustomLens = (lens: SavedLens) => {
    setCustomLenses((prev) => [...prev, lens]);
    updateFilters({ activeLensId: lens.id });
    setToast({ message: `Saved and activated lens "${lens.name}"` });
  };

  const handleDeleteCustomLens = (lensId: string) => {
    setCustomLenses((prev) => prev.filter((l) => l.id !== lensId));
    if (filters.activeLensId === lensId) {
      updateFilters({ activeLensId: 'lens-all' });
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const totalEditionMinutes = filtered.editionClusters.reduce(
    (sum, c) => sum + c.readingMinutes,
    0
  );

  return (
    <div className="min-h-screen bg-[var(--canvas-newsprint-base)] text-ink-primary">
      {/* Sticky Noise-Canceling Filter & Edition Bar */}
      <FilterRibbon
        filters={filters}
        darkMode={darkMode}
        hiddenOpinionCount={filtered.hiddenOpinionCount}
        dehypedCount={filtered.dehypedVisibleCount}
        totalMatchingCount={filtered.matchingClusters.length}
        searchInputRef={searchInputRef}
        onUpdateFilters={updateFilters}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onOpenMobileMenu={() => setMobileDrawerOpen(true)}
      />

      {/* Mobile Swipeable Lens Ribbon (< 1080px) */}
      <div className="mx-auto max-w-broadsheet px-4 pt-3 lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {allLenses.map((lens) => {
            const active = lens.id === filters.activeLensId;
            return (
              <button
                key={lens.id}
                type="button"
                onClick={() => updateFilters({ activeLensId: lens.id })}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  active
                    ? 'border-[var(--border-signal-active)] bg-[var(--border-signal-active)] text-white dark:text-slate-950'
                    : 'border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] text-ink-secondary'
                }`}
              >
                {lens.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Zone Swiss Broadsheet Workspace Grid */}
      <main className="mx-auto max-w-broadsheet px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)_310px] xl:grid-cols-[260px_minmax(0,1fr)_336px]">
          {/* Zone 1: Left Navigation & Custom Lens Rail */}
          <div className="hidden lg:block lg:pr-5 column-rule-right">
            <div className="sticky top-[132px] max-h-[calc(100vh-148px)] overflow-y-auto pr-1">
              <LeftNavigationRail
                edition={filters.edition}
                editionClusters={filtered.editionClusters}
                readClusterIds={readClusterIds}
                lenses={allLenses}
                activeLensId={filters.activeLensId}
                activeSnoozes={filtered.activeSnoozes}
                dietStats={dietStats}
                predictions={predictions}
                onSelectLens={(id) => updateFilters({ activeLensId: id })}
                onDeleteLens={handleDeleteCustomLens}
                onOpenLensBuilder={() => setLensBuilderOpen(true)}
                onWakeSnooze={handleWakeSnooze}
                onOpenDietModal={() => setDietModalOpen(true)}
                onOpenLedgerModal={() => setLedgerModalOpen(true)}
                onMarkEditionComplete={handleMarkEditionComplete}
              />
            </div>
          </div>

          {/* Zone 2: Center Primary Story Cluster Feed */}
          <section aria-label="Primary Story Cluster Feed" className="min-w-0">
            {/* Edition & Lens Sub-header */}
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-[var(--border-editorial-hairline)] pb-3">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                  {activeLens?.name || 'All Signal'} •{' '}
                  {filters.edition === '5min'
                    ? 'Bounded 6-Story Morning Edition'
                    : filters.edition === '15min'
                      ? '15-Minute Deep Catch-Up Edition'
                      : 'Full Deduplicated Wire Stream'}
                </p>
                <h1 className="mt-0.5 font-serif text-[clamp(1.6rem,2.4vw,2.25rem)] font-semibold leading-tight tracking-[-0.025em] text-ink-primary">
                  Verified Developments & Multi-Lens Synthesis
                </h1>
              </div>

              {(filters.primaryReportingOnly ||
                filters.blindspotOnly ||
                filters.newDevelopmentsOnly ||
                filters.searchQuery ||
                filters.activeLensId !== 'lens-all') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border-editorial-hairline)] bg-[var(--surface-cluster-card)] px-2.5 py-1 text-[11px] font-semibold text-ink-secondary hover:text-ink-primary"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Filters
                </button>
              )}
            </div>

            {/* Active Exclusion / Lens Pills Summary */}
            {activeLens &&
              (activeLens.includeTopics.length > 0 || activeLens.excludeTopics.length > 0) && (
                <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="font-semibold text-ink-muted">Lens rules:</span>
                  {activeLens.includeTopics.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300"
                    >
                      + {t}
                    </span>
                  ))}
                  {activeLens.excludeTopics.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-rose-500/10 px-2 py-0.5 font-medium text-rose-700 dark:text-rose-300"
                    >
                      - {t}
                    </span>
                  ))}
                </div>
              )}

            {/* Empty State or Story Cluster Cards */}
            {filtered.editionClusters.length === 0 ? (
              <div className="editorial-card p-10 text-center">
                <h2 className="font-serif text-xl font-semibold text-ink-primary">
                  No story clusters match your active signal filters
                </h2>
                <p className="mt-2 text-sm text-ink-secondary">
                  Try clearing your search exclusion, switching lenses, or waking a snoozed topic.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--border-signal-active)] px-4 py-2 text-xs font-semibold text-white dark:text-slate-950"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore Default Morning Brief
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {filtered.editionClusters.map((cluster, idx) => (
                  <StoryClusterCard
                    key={cluster.storyClusterId}
                    cluster={cluster}
                    isLead={idx === 0}
                    calmHeadlines={filters.calmHeadlines}
                    isRead={readClusterIds.includes(cluster.storyClusterId)}
                    isClipped={clippedIds.includes(cluster.storyClusterId)}
                    isForecastTracked={
                      cluster.forecast
                        ? predictions.some((p) => p.id === cluster.forecast!.id)
                        : false
                    }
                    isComparisonOpen={expandedCompareIds.includes(cluster.storyClusterId)}
                    onToggleRead={handleToggleRead}
                    onToggleClip={handleToggleClip}
                    onOpenReader={(c) => setReaderClusterId(c.storyClusterId)}
                    onToggleCompare={handleToggleCompare}
                    onSnooze={handleSnooze}
                    onTrackForecast={handleTrackForecast}
                  />
                ))}
              </div>
            )}

            {/* Finite Edition Completion Screen */}
            <EditionCompleteCard
              edition={filters.edition}
              storiesCount={filtered.editionClusters.length}
              duplicatesBypassed={filtered.duplicatesBypassedInEdition}
              dehypedCount={filtered.dehypedVisibleCount}
              totalMinutes={totalEditionMinutes}
              onExportDigest={() => setClipModalOpen(true)}
              onSwitchToFullStream={() => updateFilters({ edition: 'stream' })}
            />
          </section>

          {/* Zone 3: Right Contextual Inspection & Blindspot Rail */}
          <div className="lg:pl-5 lg:column-rule-left">
            <div className="lg:sticky lg:top-[132px]">
              <RightContextRail
                allClusters={allClusters}
                pinnedCluster={pinnedCluster}
                clippedClusters={clippedClusters}
                calmHeadlines={filters.calmHeadlines}
                onClearPinned={() => setPinnedInspectId(null)}
                onInspectCluster={(c) => {
                  setPinnedInspectId(c.storyClusterId);
                  if (!expandedCompareIds.includes(c.storyClusterId)) {
                    setExpandedCompareIds((prev) => [...prev, c.storyClusterId]);
                  }
                }}
                onOpenReader={(c) => setReaderClusterId(c.storyClusterId)}
                onFilterBlindspots={() =>
                  updateFilters({
                    blindspotOnly: !filters.blindspotOnly,
                    edition: 'stream',
                  })
                }
                onOpenClipExporter={() => setClipModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Left-Rail Sheet */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-black/45 lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full w-80 max-w-[85vw] overflow-y-auto bg-[var(--canvas-newsprint-base)] p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between border-b border-[var(--border-editorial-hairline)] pb-2">
              <span className="font-serif text-lg font-semibold text-ink-primary">
                Lenses & Reading Diet
              </span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-full p-1 text-ink-muted"
                aria-label="Close mobile menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <LeftNavigationRail
              edition={filters.edition}
              editionClusters={filtered.editionClusters}
              readClusterIds={readClusterIds}
              lenses={allLenses}
              activeLensId={filters.activeLensId}
              activeSnoozes={filtered.activeSnoozes}
              dietStats={dietStats}
              predictions={predictions}
              onSelectLens={(id) => {
                updateFilters({ activeLensId: id });
                setMobileDrawerOpen(false);
              }}
              onDeleteLens={handleDeleteCustomLens}
              onOpenLensBuilder={() => {
                setMobileDrawerOpen(false);
                setLensBuilderOpen(true);
              }}
              onWakeSnooze={handleWakeSnooze}
              onOpenDietModal={() => {
                setMobileDrawerOpen(false);
                setDietModalOpen(true);
              }}
              onOpenLedgerModal={() => {
                setMobileDrawerOpen(false);
                setLedgerModalOpen(true);
              }}
              onMarkEditionComplete={() => {
                handleMarkEditionComplete();
                setMobileDrawerOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Drawers & Modals */}
      <CleanReaderDrawer
        cluster={readerCluster}
        calmHeadlines={filters.calmHeadlines}
        isForecastTracked={
          readerCluster?.forecast
            ? predictions.some((p) => p.id === readerCluster.forecast!.id)
            : false
        }
        onClose={() => setReaderClusterId(null)}
        onMarkRead={handleMarkReaderAbsorbed}
        onTrackForecast={handleTrackForecast}
      />

      <CustomLensBuilderModal
        open={lensBuilderOpen}
        allClusters={allClusters}
        onClose={() => setLensBuilderOpen(false)}
        onSaveLens={handleSaveCustomLens}
      />

      <BriefingClipModal
        open={clipModalOpen}
        clippedClusters={clippedClusters}
        fallbackClusters={filtered.editionClusters}
        onClose={() => setClipModalOpen(false)}
        onRemoveClip={handleToggleClip}
      />

      <AccountabilityLedgerModal
        open={ledgerModalOpen}
        predictions={predictions}
        onClose={() => setLedgerModalOpen(false)}
        onUpdateStatus={handleUpdatePredictionStatus}
        onRemove={handleRemovePrediction}
      />

      <InformationDietModal
        open={dietModalOpen}
        stats={dietStats}
        onClose={() => setDietModalOpen(false)}
      />

      {/* Non-intrusive Bottom Glass Toast */}
      {toast && (
        <div
          role="status"
          className="glass-toast fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2.5 text-xs font-medium text-white shadow-2xl"
        >
          <span>{toast.message}</span>
          {toast.undoSnoozeId && (
            <button
              type="button"
              onClick={() => {
                handleWakeSnooze(toast.undoSnoozeId!);
                setToast(null);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 font-semibold text-emerald-300 hover:bg-white/25"
            >
              <Undo2 className="h-3 w-3" />
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="text-white/70 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
