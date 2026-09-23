import React, { useState } from 'react';
import { useContactStore } from '../store/useContactStore';
import { CLUSTERS } from '../data/seedContacts';
import {
  Layers,
  Filter,
  Network,
  Activity,
  FolderOpen,
  Sliders,
  Sparkles
} from 'lucide-react';

interface SidebarPartitionsProps {
  onOpenMutationLog: () => void;
}

export const SidebarPartitions: React.FC<SidebarPartitionsProps> = ({
  onOpenMutationLog,
}) => {
  const contacts = useContactStore((state) => state.contacts);
  const allIds = useContactStore((state) => state.allIds);
  const activeCluster = useContactStore((state) => state.activeCluster);
  const setActiveCluster = useContactStore((state) => state.setActiveCluster);
  const assignGroupOptimistic = useContactStore((state) => state.assignGroupOptimistic);
  const trieNodeCount = useContactStore((state) => state.trieNodeCount);

  const [dragOverCluster, setDragOverCluster] = useState<string | null>(null);

  // Compute live counts per cluster
  const clusterCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of CLUSTERS) {
      counts[c.id] = 0;
    }
    for (const id of allIds) {
      const contact = contacts[id];
      if (contact && contact.cluster) {
        counts[contact.cluster] = (counts[contact.cluster] || 0) + 1;
      }
    }
    return counts;
  }, [contacts, allIds]);

  // Drag and Drop handlers for Cluster drop targets
  const handleDragOver = (e: React.DragEvent, clusterId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCluster !== clusterId) {
      setDragOverCluster(clusterId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCluster(null);
  };

  const handleDrop = (e: React.DragEvent, clusterId: string) => {
    e.preventDefault();
    setDragOverCluster(null);
    const contactId = e.dataTransfer.getData('text/plain');
    if (contactId) {
      assignGroupOptimistic(contactId, clusterId);
    }
  };

  return (
    <aside className="w-72 bg-surface-container-lowest/80 backdrop-blur-md border-r border-outline-variant/20 flex flex-col justify-between p-4 shrink-0 select-none overflow-y-auto">
      <div className="flex flex-col gap-4">
        {/* Partition Header */}
        <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
          <span className="font-mono text-[11px] uppercase tracking-wider text-outline font-semibold">
            INDEX PARTITIONS
          </span>
          <Sliders className="w-3.5 h-3.5 text-outline cursor-pointer hover:text-on-surface transition-colors" />
        </div>

        {/* Partition Navigation */}
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => setActiveCluster(null)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all text-left ${
              activeCluster === null
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="font-sans flex-1">All Entities</span>
            <span className="font-mono text-[10px] opacity-80">{allIds.length}</span>
          </button>

          <button
            onClick={() => setActiveCluster('Engineering Core')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all text-left ${
              activeCluster === 'Engineering Core'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Filter className="w-4 h-4 shrink-0" />
            <span className="font-sans flex-1">Bitset Query Matrix</span>
          </button>

          <button
            onClick={() => setActiveCluster('High Priority Nodes')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all text-left ${
              activeCluster === 'High Priority Nodes'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Network className="w-4 h-4 shrink-0" />
            <span className="font-sans flex-1">Cluster Topology</span>
          </button>

          <button
            onClick={onOpenMutationLog}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all text-left text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          >
            <Activity className="w-4 h-4 shrink-0 text-tertiary" />
            <span className="font-sans flex-1">Mutation Pipeline</span>
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
          </button>
        </nav>

        {/* Cluster Drop Targets & Folders */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-outline font-semibold">
                CLUSTER DIRECTORY
              </span>
            </div>
            <span className="font-mono text-[10px] text-primary bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/20">
              DRAG TARGETS
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {CLUSTERS.map((cluster) => {
              const isSelected = activeCluster === cluster.id;
              const isOver = dragOverCluster === cluster.id;
              const count = clusterCounts[cluster.id] || 0;

              return (
                <div
                  key={cluster.id}
                  onDragOver={(e) => handleDragOver(e, cluster.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, cluster.id)}
                  onClick={() => setActiveCluster(isSelected ? null : cluster.id)}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                    isOver
                      ? 'border-primary-container bg-primary-container/20 scale-[1.02] shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                      : isSelected
                      ? 'border-primary/50 bg-surface-container-high text-on-surface shadow-sm'
                      : 'border-outline-variant/20 bg-surface-container/60 hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`w-2 h-2 rounded-full ${cluster.dotColor} shrink-0`} />
                    <span className="font-sans text-xs font-medium truncate">
                      {cluster.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isOver && (
                      <span className="font-mono text-[10px] text-primary animate-pulse font-bold">
                        DROP TO ASSIGN
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-outline px-1.5 py-0.5 rounded bg-surface-container-lowest">
                      {count.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Tag Zone Shortcuts */}
        <div className="flex flex-col gap-1.5 pt-2">
          <div className="flex items-center gap-1.5 pb-1">
            <Sparkles className="w-3.5 h-3.5 text-tertiary" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-outline font-semibold">
              TACTILE TAG FILTER
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {['#Kernel', '#ZeroAlloc', '#VIP', '#Distributed', '#Rust', '#LatencySensitive'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  useContactStore.getState().setSearchQuery(tag);
                }}
                className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-mono text-outline hover:text-primary hover:bg-surface-container-high border border-outline-variant/20 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Engine Status & Trie Depth */}
      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col gap-2 mt-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-outline uppercase">
            TRIE GRAPH NODES
          </span>
          <span className="font-mono text-[11px] text-primary font-bold">
            {trieNodeCount.toLocaleString()}
          </span>
        </div>

        <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (trieNodeCount / 15000) * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-outline">
          <span>ALLOC: 0-COPY</span>
          <span className="text-tertiary">BALANCED L8</span>
        </div>
      </div>
    </aside>
  );
};
