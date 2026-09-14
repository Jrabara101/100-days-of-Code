import React, { useState } from 'react';
import { useGameState } from '../../context/GameStateContext';
import { useNetwork } from '../../context/NetworkContext';
import { formatTime } from '../../utils/puzzleEngine';
import { soundSynth } from '../../utils/audioSynth';
import { Volume2, VolumeX, Copy, Check, Users } from 'lucide-react';

export default function Header({ onOpenRoomModal, activeTab, setActiveTab }) {
  const { gameState } = useGameState();
  const { roomId, playerRole, setPlayerRole, latency } = useNetwork();
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(soundSynth.isMuted());

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    soundSynth.playClick(1000);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    const nextMuted = !isMuted;
    soundSynth.setMuted(nextMuted);
    setIsMuted(nextMuted);
    if (!nextMuted) soundSynth.playClick();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.6)] border-b border-outline-variant/30">
      <div className="h-20 w-full px-margin-desktop flex items-center justify-between gap-gutter">
        {/* Left: Room Code & Telemetry Strip */}
        <div className="flex items-center gap-space-lg">
          <button
            onClick={onOpenRoomModal}
            className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-xs rounded border border-outline-variant/40 hover:border-primary transition-all text-left group"
            title="Configure Room & Peer Pairing"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-outline uppercase flex items-center gap-1">
                Room Code
                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity text-[9px]">
                  [CLICK TO MANAGE]
                </span>
              </span>
              <span className="font-telemetry-md text-telemetry-md text-primary font-bold tracking-wider flex items-center gap-2">
                {roomId} // SECTOR-IV
              </span>
            </div>
          </button>

          <div className="hidden xl:flex items-center gap-space-md bg-surface-container-low/70 px-space-md py-space-xs rounded border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-outline uppercase">Sync Countdown</span>
              <span
                className={`font-telemetry-lg text-telemetry-lg font-bold tracking-wider ${
                  gameState.countdownSeconds < 120 ? 'text-error animate-pulse' : 'text-tertiary'
                }`}
              >
                {formatTime(gameState.countdownSeconds)}
              </span>
            </div>
            <div className="h-6 w-px bg-outline-variant/40"></div>
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-outline uppercase">Link Latency</span>
              <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">
                {latency}ms (99.8%)
              </span>
            </div>
          </div>
        </div>

        {/* Center: Viewport Mode / Navigation */}
        <nav className="hidden lg:flex items-center gap-space-xs p-space-xs bg-surface-container-low rounded border border-outline-variant/30">
          <button
            onClick={() => {
              setActiveTab('dual-sync-viewport');
              soundSynth.playClick();
            }}
            className={`px-space-md py-space-xs rounded transition-all uppercase font-label-caps text-label-caps ${
              activeTab === 'dual-sync-viewport'
                ? 'bg-surface-variant text-on-surface border border-primary font-bold shadow-[inset_0_0_8px_rgba(162,201,255,0.2)]'
                : 'text-on-surface-variant hover:text-on-surface border border-transparent'
            }`}
          >
            Dual Sync Viewport
          </button>
          <button
            onClick={() => {
              setActiveTab('matrix-puzzle-conduit');
              soundSynth.playClick();
            }}
            className={`px-space-md py-space-xs rounded transition-all uppercase font-label-caps text-label-caps ${
              activeTab === 'matrix-puzzle-conduit'
                ? 'bg-surface-variant text-on-surface border border-primary font-bold shadow-[inset_0_0_8px_rgba(162,201,255,0.2)]'
                : 'text-on-surface-variant hover:text-on-surface border border-transparent'
            }`}
          >
            Matrix Puzzle Conduit
          </button>
          <button
            onClick={() => {
              setActiveTab('tactical-sensor-feed');
              soundSynth.playClick();
            }}
            className={`px-space-md py-space-xs rounded transition-all uppercase font-label-caps text-label-caps ${
              activeTab === 'tactical-sensor-feed'
                ? 'bg-surface-variant text-on-surface border border-primary font-bold shadow-[inset_0_0_8px_rgba(162,201,255,0.2)]'
                : 'text-on-surface-variant hover:text-on-surface border border-transparent'
            }`}
          >
            Tactical Sensor Feed
          </button>
          <button
            onClick={() => {
              setActiveTab('security-logs');
              soundSynth.playClick();
            }}
            className={`px-space-md py-space-xs rounded transition-all uppercase font-label-caps text-label-caps ${
              activeTab === 'security-logs'
                ? 'bg-surface-variant text-on-surface border border-primary font-bold shadow-[inset_0_0_8px_rgba(162,201,255,0.2)]'
                : 'text-on-surface-variant hover:text-on-surface border border-transparent'
            }`}
          >
            Security Logs
          </button>
        </nav>

        {/* Right: Player Roles & Audio controls */}
        <div className="flex items-center gap-space-md">
          {/* Quick Player Role Switcher */}
          <div className="flex items-center gap-space-xs bg-surface-container-low p-0.5 rounded border border-outline-variant/40">
            <button
              onClick={() => {
                setPlayerRole('p1');
                soundSynth.playClick(800);
              }}
              className={`flex items-center gap-1.5 px-space-xs py-1 rounded transition-all ${
                playerRole === 'p1'
                  ? 'bg-primary text-on-primary font-bold shadow-md'
                  : 'text-primary/70 hover:bg-primary/10'
              }`}
              title="Switch view to Player 1 (Cyan)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span className="font-label-caps text-label-caps">P1: CYAN</span>
            </button>
            <button
              onClick={() => {
                setPlayerRole('p2');
                soundSynth.playClick(600);
              }}
              className={`flex items-center gap-1.5 px-space-xs py-1 rounded transition-all ${
                playerRole === 'p2'
                  ? 'bg-secondary text-on-secondary font-bold shadow-md'
                  : 'text-secondary/70 hover:bg-secondary/10'
              }`}
              title="Switch view to Player 2 (Amber)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span className="font-label-caps text-label-caps">P2: AMBER</span>
            </button>
            <button
              onClick={() => {
                setPlayerRole('dual');
                soundSynth.playClick(700);
              }}
              className={`flex items-center gap-1 px-space-xs py-1 rounded transition-all text-[10px] font-label-caps uppercase ${
                playerRole === 'dual'
                  ? 'bg-surface-variant text-on-surface font-bold border border-outline-variant'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Dual split viewport (Solo/Local co-op)"
            >
              <Users size={12} />
              DUAL
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="w-8 h-8 rounded bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface border border-outline-variant/40 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={15} className="text-error" /> : <Volume2 size={15} className="text-tertiary" />}
          </button>

          {/* Sec Badge */}
          <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container-high border border-outline-variant/40">
            <span className="material-symbols-outlined text-tertiary text-body-lg">verified_user</span>
            <span className="font-label-caps text-label-caps text-tertiary font-bold tracking-widest">
              SEC_L5_CLR
            </span>
          </div>

          {/* Copy Share Link */}
          <button
            onClick={handleCopyRoom}
            className="w-8 h-8 rounded bg-surface-container-high hover:bg-primary/20 flex items-center justify-center text-primary border border-primary/40 transition-all shadow-[0_0_8px_rgba(162,201,255,0.2)]"
            title="Copy Invite Link"
          >
            {copied ? <Check size={16} className="text-tertiary" /> : <Copy size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
