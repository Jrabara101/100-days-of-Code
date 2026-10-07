import React, { useState } from 'react';
import { Button } from './ui/Button';
import { soundEngine } from '../engine/AudioEngine';
import { Volume2, VolumeX, Pause, Play, Rocket, Trophy, Settings, Radio } from 'lucide-react';

interface NavigationHeaderProps {
  onOpenHangar: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
  fps?: number;
  sectorName: string;
}

export function NavigationHeader({
  onOpenHangar,
  onOpenLeaderboard,
  onOpenSettings,
  onTogglePause,
  isPaused,
  fps = 60,
  sectorName,
}: NavigationHeaderProps) {
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      <div className="h-16 w-full px-4 sm:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Sector Status */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <div className="flex flex-col">
              <span className="font-mono text-xs uppercase text-primary font-extrabold tracking-wider">
                SYS.AEROSTRIKE // MK-IV
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant">
                {sectorName.toUpperCase()} // ACTIVE
              </span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 font-mono text-[11px] text-secondary bg-surface-container-low px-3 py-1 rounded border border-secondary/30">
            <Radio className="w-3.5 h-3.5 text-secondary animate-pulse" />
            <span>COMM-LINK: OPTIMAL</span>
          </div>
        </div>

        {/* Center: Tactical Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-2 font-mono text-xs uppercase font-semibold">
          <button
            onClick={() => {}}
            className="px-3.5 py-1.5 transition-colors bg-primary-container text-on-primary-container font-bold rounded shadow-[0_0_12px_rgba(6,182,212,0.35)]"
          >
            Tactical Combat HUD
          </button>
          <button
            onClick={onOpenHangar}
            className="px-3.5 py-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded flex items-center gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5 text-primary" />
            Hangar & Loadout
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="px-3.5 py-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Ace Leaderboard
          </button>
        </nav>

        {/* Right: Telemetry & Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-on-surface-variant bg-surface-container-low px-3 py-1 rounded border border-outline-variant/30">
            <span>FPS: {fps}</span>
            <span className="text-outline">|</span>
            <span>PING: 14ms</span>
          </div>

          <button
            aria-label="Sound Toggle"
            onClick={handleToggleSound}
            className="flex items-center justify-center p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
            type="button"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-error" /> : <Volume2 className="w-5 h-5 text-primary" />}
          </button>

          <button
            aria-label="Tactical Pause"
            onClick={onTogglePause}
            className={`flex items-center justify-center p-2 rounded transition-colors ${
              isPaused
                ? 'bg-secondary text-on-secondary shadow-[0_0_12px_rgba(78,222,163,0.5)]'
                : 'text-error hover:bg-error-container hover:text-on-error-container'
            }`}
            type="button"
          >
            {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
          </button>

          <button
            aria-label="Avionics Settings"
            onClick={onOpenSettings}
            className="flex items-center justify-center p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
            type="button"
          >
            <Settings className="w-5 h-5 text-primary" />
          </button>

          <div
            onClick={onOpenLeaderboard}
            title="Pilot Profile"
            className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors"
          >
            <span className="font-mono text-xs font-bold text-primary">09</span>
          </div>
        </div>
      </div>
    </header>
  );
}
