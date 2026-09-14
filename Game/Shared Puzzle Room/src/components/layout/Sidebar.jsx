import React from 'react';
import { useGameState } from '../../context/GameStateContext';
import { soundSynth } from '../../utils/audioSynth';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { gameState } = useGameState();

  const stages = [
    {
      id: 'dual-sync-viewport',
      label: '01 // Viewport Sync',
      badge: gameState.phase > 1 ? 'SYNCED' : 'ACTIVE',
      badgeColor: gameState.phase > 1 ? 'text-tertiary' : 'text-primary'
    },
    {
      id: 'matrix-puzzle-conduit',
      label: '02 // Matrix Grid',
      badge: gameState.phase > 2 ? 'LOCKED' : gameState.phase === 2 ? 'ACTIVE' : 'STANDBY',
      badgeColor: gameState.phase > 2 ? 'text-tertiary' : gameState.phase === 2 ? 'text-secondary' : 'text-outline'
    },
    {
      id: 'tactical-sensor-feed',
      label: '03 // Biosensors',
      badge: gameState.phase > 3 ? 'PURGED' : gameState.phase === 3 ? 'ACTV' : 'IDLE',
      badgeColor: gameState.phase > 3 ? 'text-tertiary' : gameState.phase === 3 ? 'text-primary' : 'text-outline'
    },
    {
      id: 'security-logs',
      label: '04 // Event Cipher',
      badge: gameState.cipher.codeUnlocked ? 'VERIFIED' : 'CIPHER',
      badgeColor: gameState.cipher.codeUnlocked ? 'text-tertiary' : 'text-outline'
    }
  ];

  return (
    <aside className="fixed left-0 top-20 bottom-16 w-64 bg-surface-container-low/95 backdrop-blur-md z-40 flex flex-col border-r border-outline-variant/30">
      {/* Subsystem Telemetry */}
      <div className="p-space-md flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-outline uppercase">Subsystems Status</span>
          <span className="font-telemetry-sm text-telemetry-sm text-tertiary">ONLINE</span>
        </div>
        <div className="h-1 w-full bg-surface-container-highest rounded overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${gameState.syncLock}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] font-telemetry-sm text-outline mt-0.5">
          <span>PROGRESS</span>
          <span className="text-primary font-bold">{gameState.syncLock.toFixed(1)}%</span>
        </div>
      </div>

      {/* Nav Stages */}
      <nav className="flex-1 px-space-sm space-y-space-xs overflow-y-auto">
        {stages.map((stage) => {
          const isActive = activeTab === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => {
                setActiveTab(stage.id);
                soundSynth.playClick();
              }}
              className={`w-full flex items-center justify-between px-space-sm py-space-sm rounded transition-colors text-left ${
                isActive
                  ? 'bg-surface-container-high text-primary font-bold border-l-2 border-primary shadow-inner'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="font-label-caps text-label-caps uppercase">{stage.label}</span>
              <span className={`font-telemetry-sm text-telemetry-sm font-bold ${stage.badgeColor}`}>
                {stage.badge}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Audio Comms VOX Channel */}
      <div className="p-space-md border-t border-outline-variant/30 bg-surface-container-lowest/60">
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-label-caps text-label-caps text-outline">AUDIO COMMS [VOX]</span>
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
        </div>
        <div className="flex items-center gap-1 h-5">
          <div className="w-1 bg-primary h-2 animate-[pulse_1.2s_infinite]"></div>
          <div className="w-1 bg-primary h-4 animate-[pulse_0.8s_infinite]"></div>
          <div className="w-1 bg-primary h-5 animate-[pulse_1.5s_infinite]"></div>
          <div className="w-1 bg-primary h-3 animate-[pulse_0.9s_infinite]"></div>
          <div className="w-1 bg-primary h-1 animate-[pulse_1.1s_infinite]"></div>
          <div className="w-1 bg-secondary h-2 animate-[pulse_1.4s_infinite]"></div>
          <div className="w-1 bg-secondary h-4 animate-[pulse_0.7s_infinite]"></div>
          <div className="w-1 bg-secondary h-5 animate-[pulse_1.3s_infinite]"></div>
          <div className="w-1 bg-secondary h-3 animate-[pulse_1.0s_infinite]"></div>
        </div>
        <div className="text-[10px] font-telemetry-sm text-outline mt-1 truncate">
          TX: 432.8 MHz // SEC-04
        </div>
      </div>
    </aside>
  );
}
