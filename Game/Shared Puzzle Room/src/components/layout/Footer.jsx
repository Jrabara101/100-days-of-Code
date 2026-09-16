import React from 'react';
import { useGameState } from '../../context/GameStateContext';
import { useNetwork } from '../../context/NetworkContext';
import { soundSynth } from '../../utils/audioSynth';
import { Radio, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export default function Footer({ onTriggerPingNode }) {
  const { gameState, addLog, pullHazardLatch } = useGameState();
  const { playerRole, sendEvent } = useNetwork();

  const handleQuickEmote = (emoteText, color = 'text-primary') => {
    const sender = playerRole === 'p2' ? 'P2' : 'P1';
    addLog(sender, emoteText, color);
    soundSynth.playClick(850);
    sendEvent('CHAT_MSG', { sender, text: emoteText, color });
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/40 px-margin-desktop flex items-center justify-between">
      {/* Left: Tactile Comms */}
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs">
          <span className="font-label-caps text-label-caps text-outline uppercase hidden sm:inline">
            Tactile Comm:
          </span>
          <button
            onClick={onTriggerPingNode}
            className="px-space-sm py-space-xs rounded bg-surface-container-high text-primary hover:bg-primary-container hover:text-on-primary-container font-label-caps text-label-caps uppercase transition-colors border border-primary/30 flex items-center gap-1.5 shadow-sm active:scale-95"
            type="button"
          >
            <Radio size={14} />
            Ping Node
          </button>
          <button
            onClick={() => handleQuickEmote('Shifting relay polarity to harmonic balance', 'text-secondary')}
            className="px-space-sm py-space-xs rounded bg-surface-container-high text-secondary hover:bg-secondary-container hover:text-on-secondary-container font-label-caps text-label-caps uppercase transition-colors border border-secondary/30 flex items-center gap-1.5 shadow-sm active:scale-95"
            type="button"
          >
            <Zap size={14} />
            Shift Relays
          </button>
        </div>

        {/* Quick Tactical Emotes */}
        <div className="hidden md:flex items-center gap-space-xs pl-space-md border-l border-outline-variant/30">
          <button
            onClick={() => handleQuickEmote('ACK // COHERENCE READY', 'text-tertiary')}
            className="px-space-sm py-space-xs rounded bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-caps text-label-caps uppercase transition-colors border border-outline-variant/20 flex items-center gap-1"
            type="button"
          >
            <CheckCircle size={12} className="text-tertiary" />
            ACK // READY
          </button>
          <button
            onClick={() => handleQuickEmote('HOLD TO INITIATE DUAL SYNC ENGAGE!', 'text-primary')}
            className="px-space-sm py-space-xs rounded bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-caps text-label-caps uppercase transition-colors border border-outline-variant/20"
            type="button"
          >
            SYNC ENGAGE
          </button>
        </div>
      </div>

      {/* Right: Channels & Hazard Override */}
      <div className="flex items-center gap-space-lg">
        <div className="hidden lg:flex items-center gap-space-sm font-telemetry-sm text-telemetry-sm text-outline-variant">
          <span className="text-primary font-bold">CHANNEL ALPHA: TX</span>
          <span className="text-outline">|</span>
          <span className="text-secondary font-bold">CHANNEL BETA: RX</span>
        </div>

        <button
          onClick={pullHazardLatch}
          className="px-space-md py-space-xs rounded bg-error-container text-on-error hover:bg-error hover:text-on-error font-label-caps text-label-caps uppercase font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(255,180,171,0.2)] flex items-center gap-1.5 active:scale-95"
          type="button"
          title="Emergency release of core overcharge (+60s countdown)"
        >
          <AlertTriangle size={14} />
          EMERGENCY VENT
        </button>
      </div>
    </footer>
  );
}
