import React from 'react';
import { useGameState } from '../../context/GameStateContext';

export default function TopStrip() {
  const { gameState } = useGameState();
  const { phase, syncLock } = gameState;

  return (
    <div className="flex flex-wrap items-center justify-between gap-gutter bg-surface-container-low p-space-md rounded-lg shadow-xl border border-outline-variant/20">
      <div className="flex items-center gap-space-lg">
        <div className="flex items-center gap-space-sm">
          <span className="w-3 h-3 rounded-full bg-tertiary animate-ping"></span>
          <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
            PROTOCOL: SIGMA-SYNCHRON
          </span>
        </div>
        <div className="h-4 w-px bg-outline-variant/30"></div>
        <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm text-on-surface-variant">
          <span className="text-outline">POLARITY RATIO:</span>
          <span className="text-primary font-bold">ALPHA: 51.2%</span>
          <span className="text-outline">/</span>
          <span className="text-secondary font-bold">BETA: 48.8%</span>
        </div>
      </div>

      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded bg-surface-container-high">
          <span className="font-label-caps text-label-caps text-tertiary">PHASE INTEGRITY:</span>
          <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-bold">
            OPTIMAL // LOCK_STAGE_0{phase}
          </span>
        </div>
        <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded bg-surface-container-high font-telemetry-sm text-telemetry-sm text-primary">
          <span className="material-symbols-outlined text-body-sm animate-spin">cyclone</span>
          <span>QUANTUM BUS: {syncLock >= 100 ? 'VENTING COMPLETE' : 'ENGAGED'}</span>
        </div>
      </div>
    </div>
  );
}
