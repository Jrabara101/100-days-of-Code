import React from 'react';
import { useGameState } from '../../context/GameStateContext';
import { useNetwork } from '../../context/NetworkContext';

export default function BottomBar() {
  const { gameState } = useGameState();
  const { latency } = useNetwork();

  return (
    <div className="bg-surface-container-low rounded-xl p-space-md shadow-2xl space-y-space-sm border border-outline-variant/20">
      <div className="flex flex-wrap items-center justify-between gap-gutter border-none pb-space-xs">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-body-md">terminal</span>
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
              CONSOLE LOGS // ACTIVE SESSION
            </span>
          </div>
          <span className="font-telemetry-sm text-telemetry-sm text-tertiary bg-tertiary/10 px-space-xs rounded">
            ONLINE : 99.98%
          </span>
        </div>

        {/* Audio Comms & Hardware Status */}
        <div className="flex items-center gap-space-lg">
          <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-1 rounded shadow-inner">
            <span className="font-label-caps text-label-caps text-outline">VOX CHANNEL</span>
            {/* Dynamic audio wave visualizer */}
            <div className="flex items-center gap-0.5 h-4">
              <div className="w-1 bg-primary h-2 animate-[bounce_1s_infinite]"></div>
              <div className="w-1 bg-primary h-4 animate-[bounce_0.8s_infinite]"></div>
              <div className="w-1 bg-primary h-3 animate-[bounce_1.2s_infinite]"></div>
              <div className="w-1 bg-secondary h-4 animate-[bounce_0.9s_infinite]"></div>
              <div className="w-1 bg-secondary h-2 animate-[bounce_1.1s_infinite]"></div>
              <div className="w-1 bg-tertiary h-3 animate-[bounce_0.7s_infinite]"></div>
            </div>
            <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-bold">
              PTT: BROADCAST
            </span>
          </div>

          <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm text-outline">
            <span>LATENCY:</span>
            <span className="text-primary font-bold">{latency}ms</span>
            <span className="text-outline-variant">|</span>
            <span>DEV_ADDR:</span>
            <span className="text-secondary font-bold">0x7F-88</span>
          </div>
        </div>
      </div>

      {/* Live Telemetry Stream Ticker */}
      <div className="bg-surface-container-lowest p-space-sm rounded font-telemetry-sm text-telemetry-sm grid grid-cols-1 md:grid-cols-3 gap-space-md shadow-inner text-on-surface-variant">
        <div className="flex items-center gap-space-sm truncate">
          <span className="text-primary font-bold">TX_LOG:</span>
          <span className="text-outline truncate">
            SYNCHRON_HEARTBEAT_ACK received from CON_ALPHA (VEX-01)
          </span>
        </div>
        <div className="flex items-center gap-space-sm truncate">
          <span className="text-secondary font-bold">RX_LOG:</span>
          <span className="text-outline truncate">
            HYDRAULIC_BYPASS: Matrix loop pressurized to {gameState.beta.hydraulicPressure} BAR
          </span>
        </div>
        <div className="flex items-center gap-space-sm truncate">
          <span className="text-tertiary font-bold">SYNC_LOG:</span>
          <span className="text-outline truncate">
            Target locked. Mutual pulse window available for next {Math.max(0, Math.floor(gameState.countdownSeconds / 60))}:{(Math.floor(gameState.countdownSeconds % 60)).toString().padStart(2, '0')}m
          </span>
        </div>
      </div>
    </div>
  );
}
