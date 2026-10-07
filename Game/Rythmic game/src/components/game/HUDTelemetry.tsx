import React from 'react';
import { HitJudgement } from '../../types/game';
import { Flame, Heart, Zap, Pause, Play, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/button';

interface HUDTelemetryProps {
  score: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  health: number; // 0 - 100
  feverGauge: number; // 0 - 100
  isFeverActive: boolean;
  latestJudgement: { rating: HitJudgement; timestamp: number; deltaMs: number } | null;
  onTriggerFever: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
  zenMode: boolean;
  songProgress: number; // 0.0 - 1.0
  songTitle: string;
  opponentData?: {
    playerName: string;
    score: number;
    combo: number;
    fever: boolean;
  } | null;
}

export const HUDTelemetry: React.FC<HUDTelemetryProps> = ({
  score,
  combo,
  maxCombo,
  multiplier,
  health,
  feverGauge,
  isFeverActive,
  latestJudgement,
  onTriggerFever,
  onTogglePause,
  isPaused,
  zenMode,
  songProgress,
  songTitle,
  opponentData,
}) => {
  const isFeverReady = feverGauge >= 100 && !isFeverActive;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* ---------------- TOP HUD BAR ---------------- */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Song info & Health/Shield */}
        <div className="flex flex-col gap-2 max-w-[280px]">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm tracking-wide text-primary truncate">
              {songTitle}
            </span>
            {zenMode && (
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                ZEN MODE
              </span>
            )}
          </div>

          {/* Health Gauge */}
          {!zenMode && (
            <div className="flex items-center gap-2 bg-surface-low/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
              <Heart
                className={`w-4 h-4 transition-colors ${
                  health < 25 ? 'text-red-500 animate-bounce' : 'text-primary'
                }`}
              />
              <div className="relative h-2 w-36 overflow-hidden rounded-full bg-surface-high">
                <div
                  className={`h-full transition-all duration-150 ${
                    health < 25 ? 'bg-red-500' : health < 50 ? 'bg-amber-400' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.max(0, health)}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-gray-300 w-8 text-right">
                {Math.round(health)}%
              </span>
            </div>
          )}
        </div>

        {/* Center: Song Progress Timeline Bar */}
        <div className="hidden md:flex flex-col items-center gap-1">
          <div className="w-56 h-1.5 rounded-full bg-surface-high overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-200"
              style={{ width: `${Math.min(100, songProgress * 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-gray-400 tracking-wider">TRACK TIMELINE</span>
        </div>

        {/* Right: Dynamic Score & Pause Action */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase text-gray-400 tracking-widest">
              SCORE
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-wider text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              {score.toLocaleString().padStart(7, '0')}
            </div>
            <div className="text-[11px] font-mono font-bold text-accent-gold">
              {multiplier.toFixed(1)}x MULTIPLIER
            </div>
          </div>

          <button
            onClick={onTogglePause}
            className="pointer-events-auto h-10 w-10 flex items-center justify-center rounded-lg bg-surface-low/80 backdrop-blur-md border border-white/15 text-gray-300 hover:text-white hover:bg-surface-mid transition-all shadow-lg active:scale-95"
            aria-label="Pause"
          >
            {isPaused ? <Play className="w-5 h-5 text-primary" /> : <Pause className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ---------------- CENTER COMBO & JUDGEMENT ---------------- */}
      <div className="flex flex-col items-center justify-center pointer-events-none">
        {/* Dynamic Combo Counter */}
        {combo > 2 && (
          <div className="flex flex-col items-center animate-pulse">
            <div
              key={combo}
              className={`font-display text-5xl sm:text-6xl font-black tracking-tight drop-shadow-2xl transition-transform ${
                isFeverActive ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-pink-500 scale-110' : 'text-white'
              }`}
            >
              {combo}
            </div>
            <div className="text-xs font-mono font-black tracking-[0.3em] uppercase text-primary/80">
              COMBO
            </div>
          </div>
        )}

        {/* Opponent Duel Widget (if dual room active) */}
        {opponentData && (
          <div className="mt-2 flex items-center gap-3 bg-secondary/20 backdrop-blur-md px-3 py-1 rounded-full border border-secondary/40 text-xs font-mono">
            <span className="text-secondary font-bold">RIVAL: {opponentData.playerName}</span>
            <span className="text-white font-mono">{opponentData.score.toLocaleString()} PTS</span>
            <span className="text-amber-400">{opponentData.combo}x</span>
          </div>
        )}
      </div>

      {/* ---------------- BOTTOM FEVER & CONTROL LAYER ---------------- */}
      <div className="flex flex-col items-center gap-3">
        {/* "Fever Overdrive" Adrenaline Meter */}
        <div className="w-full max-w-md flex flex-col items-center gap-1.5">
          <div className="w-full flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <Flame
                className={`w-4 h-4 ${
                  isFeverActive
                    ? 'text-accent-fever animate-bounce'
                    : isFeverReady
                    ? 'text-amber-400 animate-pulse'
                    : 'text-gray-400'
                }`}
              />
              <span
                className={`font-bold tracking-wider ${
                  isFeverActive
                    ? 'text-accent-fever animate-pulse'
                    : isFeverReady
                    ? 'text-amber-300'
                    : 'text-gray-400'
                }`}
              >
                {isFeverActive ? 'OVERDRIVE ACTIVE (2X JUICE)' : isFeverReady ? 'FEVER READY! [SPACE]' : 'FEVER ADRENALINE'}
              </span>
            </div>
            <span className="text-gray-400 font-bold">{Math.round(feverGauge)}%</span>
          </div>

          <div
            className={`relative w-full h-3.5 rounded-full overflow-hidden bg-surface-high border transition-all ${
              isFeverReady
                ? 'border-amber-400 shadow-neon-gold cursor-pointer pointer-events-auto'
                : 'border-white/10'
            }`}
            onClick={() => {
              if (isFeverReady) onTriggerFever();
            }}
          >
            <div
              className={`h-full transition-all duration-150 ${
                isFeverActive
                  ? 'bg-gradient-to-r from-accent-fever via-amber-400 to-pink-600 animate-pulse'
                  : isFeverReady
                  ? 'bg-gradient-to-r from-amber-400 to-accent-gold'
                  : 'bg-gradient-to-r from-cyan-500 to-primary'
              }`}
              style={{ width: `${Math.min(100, feverGauge)}%` }}
            />
          </div>

          {/* Trigger Fever Button for Mobile/Touch */}
          {isFeverReady && (
            <button
              onClick={onTriggerFever}
              className="pointer-events-auto sm:hidden mt-1 px-4 py-1 rounded-full bg-accent-fever text-white font-mono font-bold text-xs uppercase shadow-fever active:scale-95"
            >
              ⚡ TAP TO TRIGGER OVERDRIVE ⚡
            </button>
          )}
        </div>

        {/* Touch zones hint */}
        <div className="sm:hidden text-[10px] font-mono text-gray-400 tracking-wider">
          TAP BOTTOM LANES (D • F • J • K)
        </div>
      </div>
    </div>
  );
};
