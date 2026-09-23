import React, { useState, useEffect, useCallback } from 'react';
import { TopTelemetryHeader } from './components/TopTelemetryHeader';
import { SidebarPartitions } from './components/SidebarPartitions';
import { ControlDeckBar } from './components/ControlDeckBar';
import { VirtualizedContactDeck } from './components/VirtualizedContactDeck';
import { ContactInspectorSheet } from './components/ContactInspectorSheet';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { AddNodeDialog } from './components/AddNodeDialog';
import { ExportDialog } from './components/ExportDialog';
import { MutationPipelineDrawer } from './components/MutationPipelineDrawer';
import { RubberBandAlert } from './components/react-bits/RubberBandAlert';
import { useContactStore } from './store/useContactStore';

interface ToastItem {
  id: string;
  message: string;
}

export const App: React.FC = () => {
  const [isCommandOpen, setCommandOpen] = useState(false);
  const [isAddNodeOpen, setAddNodeOpen] = useState(false);
  const [isExportOpen, setExportOpen] = useState(false);
  const [isActivityOpen, setActivityOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const filteredIds = useContactStore((state) => state.filteredIds);
  const allIds = useContactStore((state) => state.allIds);

  const showToast = useCallback((message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background font-sans text-on-surface">
      {/* 1. TOP TELEMETRY HEADER */}
      <TopTelemetryHeader
        onOpenCommand={() => setCommandOpen(true)}
        onToggleActivity={() => setActivityOpen((prev) => !prev)}
        isActivityOpen={isActivityOpen}
      />

      {/* 2. MAIN LAYOUT */}
      <div className="flex flex-1 pt-12 pb-8 overflow-hidden w-full relative">
        {/* SIDEBAR PARTITIONS & CLUSTER DROP TARGETS */}
        <SidebarPartitions
          onOpenMutationLog={() => setActivityOpen(true)}
        />

        {/* WORKSPACE & VIRTUALIZED VIEWPORT */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-lowest/40 relative">
          {/* NETCODE RUBBER-BAND DESYNC ALERT */}
          <RubberBandAlert />

          {/* CONTROL DECK & SEARCH */}
          <ControlDeckBar
            onOpenAddNode={() => setAddNodeOpen(true)}
            onOpenExport={() => setExportOpen(true)}
          />

          {/* VIRTUALIZED 60FPS CONTACT DECK */}
          <VirtualizedContactDeck onShowToast={showToast} />
        </main>
      </div>

      {/* 3. ENGINE BOTTOM STATUS FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 h-8 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/20 flex items-center justify-between px-4 select-none shadow-[0_-1px_6px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-outline">
              BITSET INTERSECT:
            </span>
            <span className="font-mono text-[10px] text-tertiary font-semibold">
              0x8F04B1 • {filteredIds.length.toLocaleString()} MATCHES
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-outline">GRAPH:</span>
            <span className="font-mono text-[10px] text-on-surface">
              {allIds.length.toLocaleString()} ACTIVE NODES
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse" />
            <span className="font-mono text-[10px] text-on-surface-variant hidden sm:inline">
              OPTIMISTIC ENGINE ACTIVE
            </span>
            <span className="font-mono text-[10px] text-tertiary sm:hidden">
              ENGINE ACTIVE
            </span>
          </div>

          <span className="font-mono text-[10px] text-outline hidden md:inline">
            UPTIME 99.998%
          </span>
        </div>
      </footer>

      {/* 4. MODALS & DRAWERS */}
      <ContactInspectorSheet onShowToast={showToast} />

      <CommandPaletteModal
        open={isCommandOpen}
        onOpenChange={setCommandOpen}
        onOpenAddNode={() => setAddNodeOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onShowToast={showToast}
      />

      <AddNodeDialog
        open={isAddNodeOpen}
        onOpenChange={setAddNodeOpen}
        onShowToast={showToast}
      />

      <ExportDialog
        open={isExportOpen}
        onOpenChange={setExportOpen}
        onShowToast={showToast}
      />

      <MutationPipelineDrawer
        open={isActivityOpen}
        onOpenChange={setActivityOpen}
      />

      {/* 5. TACTILE TOAST NOTIFICATIONS */}
      <div className="fixed top-16 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-lg bg-surface-container-high border border-primary/30 text-on-surface shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-2"
          >
            <span className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
            <span className="font-mono text-xs">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
