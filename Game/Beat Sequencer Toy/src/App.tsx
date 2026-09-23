import React, { useState, useEffect } from 'react';
import { useAudioClock } from './hooks/useAudioClock';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSequencerStore } from './store/useSequencerStore';
import { HardwareChassis } from './components/HardwareChassis';
import { ControlDeck } from './components/ControlDeck';
import { StepMatrix } from './components/StepMatrix';
import { PerformanceRibbon } from './components/PerformanceRibbon';
import { ExportModal } from './components/ExportModal';

export const App: React.FC = () => {
  // Initialize Web Audio lookahead clock and keyboard shortcuts
  useAudioClock();
  useKeyboardShortcuts();

  const loadFromUrlHash = useSequencerStore((s) => s.loadFromUrlHash);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isTapeStopped, setIsTapeStopped] = useState(false);

  // Load beat pattern from URL hash on mount if present
  useEffect(() => {
    if (window.location.hash) {
      loadFromUrlHash(window.location.hash);
    }
  }, [loadFromUrlHash]);

  return (
    <HardwareChassis
      onOpenExport={() => setExportModalOpen(true)}
      isTapeStopped={isTapeStopped}
    >
      <div className="flex flex-col gap-3">
        {/* Top Telemetry & Control Deck */}
        <ControlDeck />

        {/* 16x6 Tactile Pad Matrix */}
        <StepMatrix />

        {/* Bottom Performance FX Ribbon (Tape Stop, Filter, Stutter) */}
        <PerformanceRibbon onTapeStopStateChange={setIsTapeStopped} />

        {/* Share & Export Dialog */}
        <ExportModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
        />
      </div>
    </HardwareChassis>
  );
};

export default App;
