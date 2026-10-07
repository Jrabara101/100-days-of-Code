import React from 'react';
import { EndlessRunnerGameState, GhostData } from '../types/game';
import { getBiomeForDistance } from '../engine/procedural';
import { Zap, Shield, Magnet, Pause, Settings, Trophy, Flame } from 'lucide-react';

interface HudOverlayProps {
  state: EndlessRunnerGameState;
  ghostData: GhostData | null;
  onPause: () => void;
  onOpenSettings: () => void;
  onOpenDailyModal: () => void;
  onTriggerOverdrive: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  state,
  ghostData,
  onPause,
  onOpenSettings,
  onOpenDailyModal,
  onTriggerOverdrive,
}) => {
  const biome = getBiomeForDistance(state.distanceMeters);

  const biomeConfig = {
    neon_city: { label: 'NEON HIGHWAY', color: 'text-neon-cyan', border: 'border-neon-cyan/40' },
    sky_bridge: { label: 'ORBITAL SKYBRIDGE', color: 'text-blue-400', border: 'border-blue-400/40' },
    magma_vault: { label: 'MAGMA VAULT', color: 'text-neon-crimson', border: 'border-neon-crimson/40' },
  }[biome];

  // Ghost split calculation
  const ghostSplit = ghostData ? Math.round(state.distanceMeters - ghostData.finalDistance) : null;

  const isOverdriveReady = state.overdriveGauge >= 100 && !state.isOverdriveActive;

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between select-none">
      {/* Top Bar: Distance, Score, Biome, Action Buttons */}
      <div className="flex items-start justify-between gap-4">
        {/* Distance & Score Cards */}
        <div className="flex flex-col gap-2">
          {/* Main Distance Readout */}
          <div className="glass-panel px-4 py-2.5 rounded-xl flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">DIST</span>
            <span className="font-orbitron text-2xl md:text-3xl font-black text-white tracking-wider neon-glow-cyan">
              {Math.floor(state.distanceMeters).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-neon-cyan">M</span>
          </div>

          {/* Score & Near-Miss Counter */}
          <div className="flex items-center gap-2">
            <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm">
              <span className="text-slate-400 text-xs">PTS</span>
              <span className="font-orbitron font-bold text-yellow-300">
                {state.score.toLocaleString()}
              </span>
            </div>

            <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm">
              <Zap className="w-3.5 h-3.5 text-neon-cyan animate-pulse" />
              <span className="font-bold text-neon-cyan">{state.nearMissCount}</span>
              <span className="text-[10px] text-slate-400">MISS</span>
            </div>

            <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm">
              <span className="text-yellow-400 font-bold">🪙</span>
              <span className="font-bold text-white">{state.coinsCollected}</span>
            </div>
          </div>
        </div>

        {/* Center: Biome Tag & Speed Multiplier */}
        <div className="flex flex-col items-center gap-1.5">
          <div className={`glass-panel px-3.5 py-1 rounded-full border ${biomeConfig.border} flex items-center gap-2`}>
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
            <span className={`text-xs font-orbitron font-bold tracking-widest ${biomeConfig.color}`}>
              {biomeConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] font-orbitron px-2.5 py-0.5 rounded-md bg-purple-900/60 border border-purple-500/40 text-purple-200">
              {state.currentSpeed.toFixed(0)} M/S
            </div>
            {state.isOverdriveActive && (
              <div className="text-[11px] font-orbitron font-bold px-2 py-0.5 rounded-md bg-neon-magenta text-white animate-bounce shadow-lg shadow-neon-magenta/50">
                ⚡ OVERDRIVE
              </div>
            )}
          </div>

          {/* Ghost Delta Split Indicator */}
          {ghostData && ghostSplit !== null && (
            <div
              className={`glass-panel px-3 py-1 rounded-md text-xs font-orbitron font-bold flex items-center gap-1.5 ${
                ghostSplit >= 0 ? 'text-emerald-400 border-emerald-500/30' : 'text-neon-crimson border-red-500/30'
              }`}
            >
              <span>VS 👻 {ghostData.playerHandle}:</span>
              <span>
                {ghostSplit >= 0 ? `+${ghostSplit}m` : `${ghostSplit}m`}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onOpenDailyModal}
            title="Daily Gauntlet Challenge"
            className="glass-panel p-2.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-yellow-400 border-yellow-400/30"
          >
            <Trophy className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSettings}
            title="Settings & Keybindings"
            className="glass-panel p-2.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-slate-300"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onPause}
            title="Pause Run (Esc)"
            className="glass-panel p-2.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-slate-300"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Overdrive Energy Gauge & Active Powerups */}
      <div className="flex flex-col items-center gap-3">
        {/* Active Powerup Badges */}
        {state.activePowerUps.length > 0 && (
          <div className="flex items-center gap-2">
            {state.activePowerUps.map((p, idx) => (
              <div
                key={idx}
                className="glass-panel px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold text-white border-neon-cyan/40 animate-pulse"
              >
                {p.type === 'shield' && <Shield className="w-3.5 h-3.5 text-emerald-400" />}
                {p.type === 'coin_magnet' && <Magnet className="w-3.5 h-3.5 text-neon-magenta" />}
                {p.type === 'multiplier_2x' && <span className="text-yellow-400 font-orbitron">2X</span>}
                <span className="uppercase text-[10px] tracking-wider">{p.type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Slipstream Overdrive Energy Gauge */}
        <div className="w-full max-w-md pointer-events-auto">
          <div className="flex items-center justify-between text-xs font-orbitron font-bold mb-1 px-1">
            <span className="flex items-center gap-1 text-slate-300">
              <Flame className="w-3.5 h-3.5 text-neon-magenta" />
              SLIPSTREAM OVERDRIVE
            </span>
            <span className={isOverdriveReady ? 'text-neon-cyan animate-pulse font-black' : 'text-slate-400'}>
              {state.isOverdriveActive
                ? 'OVERDRIVE ACTIVE!'
                : isOverdriveReady
                ? 'READY // PRESS SHIFT'
                : `${Math.round(state.overdriveGauge)}%`}
            </span>
          </div>

          <div
            onClick={() => {
              if (isOverdriveReady) onTriggerOverdrive();
            }}
            className={`h-4 w-full bg-slate-900/80 rounded-full p-0.5 border border-white/20 overflow-hidden relative ${
              isOverdriveReady ? 'cursor-pointer ring-2 ring-neon-cyan ring-offset-2 ring-offset-black animate-pulse' : ''
            }`}
          >
            {/* Segmented Overdrive Progress Bar */}
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                state.isOverdriveActive
                  ? 'bg-gradient-to-r from-neon-magenta via-neon-cyan to-yellow-300 animate-overdrive-bar'
                  : isOverdriveReady
                  ? 'bg-gradient-to-r from-neon-cyan to-neon-magenta'
                  : 'bg-gradient-to-r from-purple-600 to-neon-cyan'
              }`}
              style={{ width: `${Math.min(100, state.overdriveGauge)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
