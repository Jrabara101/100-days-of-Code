import React, { useMemo } from 'react';
import { Search, Check, Clock, X } from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ThreadRow } from './ThreadRow';
import { BundledThreadRow } from './BundledThreadRow';
import { InboxZeroHorizon } from './InboxZeroHorizon';

export function SplitInboxThreadList() {
  const {
    activeHorizon,
    setActiveHorizon,
    selectedThreadId,
    setSelectedThreadId,
    checkedThreadIds,
    toggleCheckedThread,
    clearCheckedThreads,
    selectAllThreads,
    keyboardIndex,
    densityMode,
    setSearchPaletteOpen,
    markDone,
    setSnoozePickerThreadId,
  } = useMailStore();

  const allThreads = useLiveQuery(() => db.threads.toArray()) || [];
  const allLabels = useLiveQuery(() => db.labels.toArray()) || [];

  const labelsMap = useMemo(() => {
    const map = {};
    for (const l of allLabels) {
      map[l.slug] = l;
    }
    return map;
  }, [allLabels]);

  // Filter threads based on active horizon/view
  const visibleThreads = useMemo(() => {
    return allThreads.filter((t) => {
      if (activeHorizon === 'trash') {
        return t.is_trash;
      }
      if (t.is_trash) return false;

      if (activeHorizon === 'archive') {
        return t.is_archived;
      }
      if (t.is_archived) return false;

      if (activeHorizon === 'starred') {
        return t.is_starred;
      }
      if (activeHorizon === 'snoozed') {
        return !!t.snoozed_until;
      }
      if (activeHorizon === 'waiting_reply') {
        return t.split_category === 'waiting_reply';
      }
      if (activeHorizon === 'sent') {
        return t.primary_sender?.email === 'alex@acme.dev';
      }
      if (activeHorizon === 'drafts') {
        return false; // Handled in drafts view
      }

      // Check for label view
      if (activeHorizon.startsWith('label:')) {
        const slug = activeHorizon.replace('label:', '');
        return t.labels?.includes(slug);
      }

      // Split lenses
      if (activeHorizon === 'focused') {
        return t.split_category === 'focused';
      }
      if (activeHorizon === 'vip') {
        return t.split_category === 'vip' || t.primary_sender?.is_vip;
      }
      if (activeHorizon === 'feed') {
        return t.split_category === 'feed';
      }
      if (activeHorizon === 'paper_trail') {
        return t.split_category === 'paper_trail';
      }
      if (activeHorizon === 'all') {
        return true;
      }

      return true;
    });
  }, [allThreads, activeHorizon]);

  // Counts for split horizon tabs
  const tabCounts = useMemo(() => {
    const unarchived = allThreads.filter(t => !t.is_archived && !t.is_trash);
    return {
      focused: unarchived.filter(t => t.split_category === 'focused' && t.is_unread).length,
      vip: unarchived.filter(t => (t.split_category === 'vip' || t.primary_sender?.is_vip) && t.is_unread).length,
      feed: unarchived.filter(t => t.split_category === 'feed' && t.is_unread).length,
      paper_trail: unarchived.filter(t => t.split_category === 'paper_trail' && t.is_unread).length,
      all: unarchived.filter(t => t.is_unread).length,
    };
  }, [allThreads]);

  // Check if there are bundled groups in this view (e.g. Finance & Invoices)
  const { bundledGroups, standaloneThreads } = useMemo(() => {
    const bundles = {};
    const standalone = [];

    // Only bundle when in inbox views (focused, paper_trail, or all)
    const canBundle = ['focused', 'paper_trail', 'all'].includes(activeHorizon);

    if (!canBundle) {
      return { bundledGroups: [], standaloneThreads: visibleThreads };
    }

    const bundleLabels = allLabels.filter(l => l.bundle_in_inbox);
    const bundleSlugs = new Set(bundleLabels.map(l => l.slug));

    for (const thread of visibleThreads) {
      const matchSlug = thread.labels?.find(s => bundleSlugs.has(s));
      if (matchSlug) {
        if (!bundles[matchSlug]) {
          bundles[matchSlug] = {
            label: labelsMap[matchSlug],
            threads: [],
          };
        }
        bundles[matchSlug].threads.push(thread);
      } else {
        standalone.push(thread);
      }
    }

    return {
      bundledGroups: Object.values(bundles),
      standaloneThreads: standalone,
    };
  }, [visibleThreads, allLabels, labelsMap, activeHorizon]);

  // Flattened visible IDs for keyboard and range selection
  const flatVisibleIds = useMemo(() => {
    const ids = [];
    for (const group of bundledGroups) {
      for (const t of group.threads) {
        ids.push(t.id);
      }
    }
    for (const t of standaloneThreads) {
      ids.push(t.id);
    }
    return ids;
  }, [bundledGroups, standaloneThreads]);

  const focusedThreadId = flatVisibleIds[keyboardIndex] || null;

  const isSplitHorizonView = ['focused', 'vip', 'feed', 'paper_trail', 'all'].includes(activeHorizon);

  return (
    <div className="w-[440px] flex-shrink-0 h-full border-r border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#0D0F14] flex flex-col justify-between overflow-hidden">
      {/* Top Search Bar & Horizon Lens Header */}
      <div className="border-b border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#0D0F14]">
        {/* Interactive Search Bar Trigger */}
        <div 
          onClick={() => setSearchPaletteOpen(true)}
          className="h-9 mx-3 mt-2.5 rounded-lg bg-slate-100 dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632] px-3 flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition group select-none"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Search className="w-3.5 h-3.5 group-hover:text-blue-500 transition-colors" />
            <span className="truncate">Search mail, labels, files, or from: ...</span>
          </div>

          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#1F2330] rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Split Horizon Tabs */}
        {isSplitHorizonView && (
          <div className="px-3 pt-2 flex items-center gap-4 text-xs font-medium select-none overflow-x-auto no-scrollbar">
            <TabButton
              label="Focused"
              count={tabCounts.focused}
              active={activeHorizon === 'focused'}
              onClick={() => setActiveHorizon('focused')}
            />
            <TabButton
              label="VIP"
              count={tabCounts.vip}
              active={activeHorizon === 'vip'}
              onClick={() => setActiveHorizon('vip')}
            />
            <TabButton
              label="Newsletters"
              count={tabCounts.feed}
              active={activeHorizon === 'feed'}
              onClick={() => setActiveHorizon('feed')}
            />
            <TabButton
              label="Receipts"
              count={tabCounts.paper_trail}
              active={activeHorizon === 'paper_trail'}
              onClick={() => setActiveHorizon('paper_trail')}
            />
            <TabButton
              label="All"
              count={tabCounts.all}
              active={activeHorizon === 'all'}
              onClick={() => setActiveHorizon('all')}
            />
          </div>
        )}

        {/* Custom view title if not in Split Horizon */}
        {!isSplitHorizonView && (
          <div className="px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <span>{activeHorizon.replace('label:', 'Label: ')}</span>
            <span className="text-[11px] font-mono font-normal text-slate-400">
              {visibleThreads.length} threads
            </span>
          </div>
        )}

        {/* Batch Selection Dock (Active when 1+ threads checked) */}
        {checkedThreadIds.size > 0 && (
          <div className="h-9 px-3 bg-blue-50 dark:bg-blue-950/40 border-t border-b border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-xs animate-slide-down">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
              <span>{checkedThreadIds.size} selected</span>
              <button
                onClick={() => selectAllThreads(flatVisibleIds)}
                className="text-[11px] underline hover:text-blue-800 dark:hover:text-blue-200"
              >
                Select all {flatVisibleIds.length}
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => markDone(Array.from(checkedThreadIds))}
                title="Mark Done / Archive (E)"
                className="p-1 px-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium flex items-center gap-1 shadow-xs transition"
              >
                <Check className="w-3 h-3" />
                <span>Done (E)</span>
              </button>
              <button
                onClick={() => setSnoozePickerThreadId(Array.from(checkedThreadIds)[0])}
                title="Snooze (H)"
                className="p-1 px-2 rounded border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-medium flex items-center gap-1 transition"
              >
                <Clock className="w-3 h-3" />
                <span>Snooze (H)</span>
              </button>
              <button
                onClick={() => clearCheckedThreads()}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Virtualized/Scrollable Thread List */}
      <div className="flex-1 overflow-y-auto">
        {visibleThreads.length === 0 ? (
          <InboxZeroHorizon horizonTitle={activeHorizon.toUpperCase()} />
        ) : (
          <div className="divide-y divide-transparent">
            {/* Bundled Roll-up Rows */}
            {bundledGroups.map((group) => (
              <BundledThreadRow
                key={group.label.slug}
                label={group.label}
                threads={group.threads}
                selectedThreadId={selectedThreadId}
                focusedThreadId={focusedThreadId}
                checkedThreadIds={checkedThreadIds}
                onSelectThread={(id) => setSelectedThreadId(id)}
                onToggleCheck={(id, shift) => toggleCheckedThread(id, shift, flatVisibleIds)}
                labelsMap={labelsMap}
                density={densityMode}
              />
            ))}

            {/* Standalone Thread Rows */}
            {standaloneThreads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                isSelected={selectedThreadId === thread.id}
                isFocusedCursor={focusedThreadId === thread.id}
                isChecked={checkedThreadIds.has(thread.id)}
                onSelect={() => setSelectedThreadId(thread.id)}
                onToggleCheck={(shift) => toggleCheckedThread(thread.id, shift, flatVisibleIds)}
                labelsMap={labelsMap}
                density={densityMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`pb-2 flex items-center gap-1.5 transition relative ${
        active 
          ? 'text-blue-600 dark:text-blue-400 font-semibold' 
          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium'
      }`}
    >
      <span>{label}</span>
      {count > 0 && (
        <span className={`text-[10px] font-mono px-1 rounded-full tabular-nums ${
          active ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-slate-400'
        }`}>
          {count}
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t" />
      )}
    </button>
  );
}

