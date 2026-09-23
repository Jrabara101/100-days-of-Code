import React from 'react';
import { useContactStore } from '../store/useContactStore';
import {
  Search,
  PlusCircle,
  Radio,
  Download,
  LayoutGrid,
  List,
  Zap,
} from 'lucide-react';
import { formatMs } from '../lib/utils';
import confetti from 'canvas-confetti';

interface ControlDeckBarProps {
  onOpenAddNode: () => void;
  onOpenExport: () => void;
}

export const ControlDeckBar: React.FC<ControlDeckBarProps> = ({
  onOpenAddNode,
  onOpenExport,
}) => {
  const searchQuery = useContactStore((state) => state.searchQuery);
  const setSearchQuery = useContactStore((state) => state.setSearchQuery);
  const queryLatencyMs = useContactStore((state) => state.queryLatencyMs);
  const filteredIds = useContactStore((state) => state.filteredIds);
  const allIds = useContactStore((state) => state.allIds);
  const domMountCount = useContactStore((state) => state.domMountCount);
  const viewMode = useContactStore((state) => state.viewMode);
  const setViewMode = useContactStore((state) => state.setViewMode);
  const triggerRollbackSimulation = useContactStore(
    (state) => state.triggerRollbackSimulation
  );
  const scaleDataset = useContactStore((state) => state.scaleDataset);

  const handleScale5k = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.2 },
      colors: ['#22d3ee', '#46d89d', '#c0c1ff'],
    });
    scaleDataset(allIds.length >= 5000 ? 1500 : 5000);
  };

  return (
    <section className="w-full bg-surface-container-low/95 border-b border-outline-variant/20 px-4 py-2.5 shadow-md select-none shrink-0">
      <div className="max-w-[1720px] mx-auto flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap lg:flex-nowrap">
          {/* Spatial Trie Search Input */}
          <div className="flex-1 min-w-[280px] relative">
            <div className="relative flex items-center bg-surface-container rounded-lg border border-outline-variant/30 focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container shadow-sm transition-all">
              <div className="pl-3 flex items-center pointer-events-none text-outline">
                <Search className="w-4 h-4 text-outline" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Query trie index by name, bitset tag (#kernel, #vip), role, or vector ID..."
                className="w-full bg-transparent py-1.5 px-3 font-sans text-xs text-on-surface placeholder:text-outline focus:outline-none"
              />
              <div className="pr-2 flex items-center gap-1.5">
                <span
                  className="font-mono text-[10px] text-primary px-1.5 py-0.5 bg-surface-container-highest rounded border border-outline-variant/20 shadow-inner"
                  title="Query execution latency"
                >
                  {formatMs(queryLatencyMs)}
                </span>
                <kbd className="hidden sm:inline-block font-mono text-[10px] text-on-surface-variant bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant/20">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Engine Telemetry Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-lg border border-outline-variant/20">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <span className="font-mono text-[10px] text-on-surface-variant">TRIE:</span>
              <span className="font-mono text-[10px] text-tertiary font-bold">
                {filteredIds.length.toLocaleString()} / {allIds.length.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-lg border border-outline-variant/20">
              <span className="font-mono text-[10px] text-on-surface-variant">DOM MOUNT:</span>
              <span className="font-mono text-[10px] text-primary font-bold">
                {domMountCount} / {filteredIds.length.toLocaleString()}
              </span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-lg border border-outline-variant/20">
              <span className="font-mono text-[10px] text-on-surface-variant">COMPOSITE:</span>
              <span className="font-mono text-[10px] text-on-surface">t3d(0, y, 0)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Add Node */}
            <button
              onClick={onOpenAddNode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container text-on-primary-container font-sans text-xs font-semibold rounded-lg shadow-[0_0_12px_rgba(34,211,238,0.3)] hover:bg-primary transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Node</span>
            </button>

            {/* Rollback Simulation */}
            <button
              onClick={triggerRollbackSimulation}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container text-error hover:bg-surface-container-high rounded-lg border border-error/30 transition-all text-xs font-mono active:scale-95"
              title="Simulate network packet loss & trigger optimistic state rollback"
            >
              <Radio className="w-3.5 h-3.5 text-error animate-pulse" />
              <span className="hidden sm:inline">Rollback Test</span>
            </button>

            {/* 5k Scale Stress */}
            <button
              onClick={handleScale5k}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container text-tertiary hover:bg-surface-container-high rounded-lg border border-tertiary/30 transition-all text-xs font-mono active:scale-95"
              title="Toggle scale between 1,500 and 5,000 nodes"
            >
              <Zap className="w-3.5 h-3.5 text-tertiary" />
              <span className="hidden md:inline">
                {allIds.length >= 5000 ? 'Reset 1.5k' : 'Scale 5k'}
              </span>
            </button>

            {/* Export */}
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container text-on-surface hover:bg-surface-container-high rounded-lg border border-outline-variant/30 transition-all text-xs font-mono"
              title="Export Bitset directory JSON / vCard"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Export</span>
            </button>

            {/* Layout Switcher */}
            <div className="flex items-center bg-surface-container p-0.5 rounded-lg border border-outline-variant/30">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${
                  viewMode === 'grid'
                    ? 'bg-surface-container-highest text-primary shadow-sm'
                    : 'text-outline hover:text-on-surface'
                }`}
                title="4-Column Virtual Deck"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded ${
                  viewMode === 'table'
                    ? 'bg-surface-container-highest text-primary shadow-sm'
                    : 'text-outline hover:text-on-surface'
                }`}
                title="High-Density Virtual Table"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
