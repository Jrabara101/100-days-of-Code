import React from 'react';
import { SpaceShooterState } from '../../types/game';
import { WeaponSynergyTray } from './WeaponSynergyTray';
import { Progress } from '../ui/Progress';
import { formatScore, formatTime } from '../../lib/utils';
import { Shield, Heart, Zap, FastForward, Activity } from 'lucide-react';

interface CockpitHUDProps {
  state: SpaceShooterState;
  onDash: () => void;
  onEMP: () => void;
}

export function CockpitHUD({ state, onDash, onEMP }: CockpitHUDProps) {
  const isHullCritical = state.hull <= 25;
  const isShieldCritical = state.shield <= 0;
  const isOverchargeReady = state.grazeMeter >= 100 || state.empReady;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
      {/* LAYER 2: TOP FLOATING HUD BAR */}
      <header className="w-full flex flex-col lg:flex-row items-stretch lg:items-start justify-between gap-3 pointer-events-auto">
        {/* TOP LEFT: Dual Shield & Hull Monitors */}
        <div
          className={`flex flex-col gap-1.5 bg-surface-container-lowest/85 backdrop-blur-xl p-3 rounded-lg border ${
            isHullCritical
              ? 'border-error animate-pulse shadow-[0_0_20px_rgba(255,180,171,0.4)]'
              : 'border-outline-variant/40 shadow-xl'
          } min-w-[260px]`}
        >
          {/* Shield Harmonics Segment */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-primary font-mono text-xs font-bold">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                SHIELD HARMONICS
              </span>
              <span>
                {Math.round(state.shield)} / {state.maxShield}
              </span>
            </div>
            <Progress
              value={state.shield}
              max={state.maxShield}
              segments={10}
              color={isShieldCritical ? 'error' : 'primary'}
            />
          </div>

          {/* Hull Integrity Segment */}
          <div className="flex flex-col gap-0.5">
            <div
              className={`flex items-center justify-between font-mono text-xs font-bold ${
                isHullCritical ? 'text-error' : 'text-secondary'
              }`}
            >
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                HULL INTEGRITY
              </span>
              <span>
                {Math.round(state.hull)} / {state.maxHull}
              </span>
            </div>
            <Progress
              value={state.hull}
              max={state.maxHull}
              segments={10}
              color={isHullCritical ? 'error' : 'secondary'}
            />
          </div>
        </div>

        {/* TOP CENTER: Wave Progress, Mission Threat & Combat Chronometer */}
        <div className="flex flex-col items-center gap-1.5 bg-surface-container-lowest/85 backdrop-blur-xl px-4 py-2 rounded-lg border border-outline-variant/40 shadow-xl self-center">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-primary/20 rounded border border-primary/50 text-primary font-mono text-[11px] tracking-widest font-bold">
              WAVE 0{state.currentWave} / {state.totalWaves}
            </div>

            <div
              className={`flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded border ${
                state.threatLevel === 'TITAN DETECTED'
                  ? 'bg-error-container/60 text-error border-error animate-pulse'
                  : state.threatLevel === 'CRITICAL'
                  ? 'bg-error-container/40 text-error border-error/50'
                  : state.threatLevel === 'ELEVATED'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-secondary/20 text-secondary border-secondary/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
              <span>THREAT: {state.threatLevel}</span>
            </div>

            <div className="font-mono text-xs text-primary font-bold tracking-widest">
              {formatTime(state.stats.durationMs)}
            </div>
          </div>

          {/* Linear Wave Progression Dots */}
          <div className="w-64 sm:w-72 flex items-center gap-1 pt-0.5">
            {Array.from({ length: state.totalWaves }).map((_, i) => {
              const waveNum = i + 1;
              const isPassed = waveNum < state.currentWave;
              const isCurrent = waveNum === state.currentWave;
              const isBoss = waveNum === 5 || waveNum === 10;

              return (
                <React.Fragment key={waveNum}>
                  <div
                    className={`rounded-full transition-all ${
                      isCurrent
                        ? 'w-3.5 h-3.5 bg-primary-fixed border-2 border-primary shadow-[0_0_12px_#4cd7f6] animate-pulse'
                        : isPassed
                        ? 'w-2.5 h-2.5 bg-secondary shadow-[0_0_6px_#4edea3]'
                        : isBoss
                        ? 'w-2.5 h-2.5 border border-error/60 bg-error/20 rotate-45'
                        : 'w-2 h-2 bg-surface-container-highest'
                    }`}
                  />
                  {i < state.totalWaves - 1 && (
                    <div
                      className={`flex-1 h-0.5 ${
                        isPassed ? 'bg-secondary' : isCurrent ? 'bg-primary' : 'bg-surface-container-highest'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* TOP RIGHT: Score Tally & Overcharge Multiplier */}
        <div className="flex flex-col items-end gap-1 bg-surface-container-lowest/85 backdrop-blur-xl px-4 py-2 rounded-lg border border-outline-variant/40 shadow-xl min-w-[220px]">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">SCORE</span>
            <span className="font-mono text-lg text-primary tracking-tight font-extrabold drop-shadow-[0_0_12px_rgba(76,215,246,0.6)]">
              {formatScore(state.score)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-tertiary-container/30 border border-tertiary text-tertiary-fixed font-mono text-[11px] font-bold shadow-[0_0_10px_rgba(199,141,255,0.4)] animate-pulse">
              x{state.multiplier.toFixed(1)} MULTIPLIER
            </div>
            <div className="px-2 py-0.5 rounded bg-surface-container text-secondary font-mono text-[10px] font-semibold border border-secondary/40">
              GRAZES: {state.grazeStreak}
            </div>
          </div>
        </div>
      </header>

      {/* LAYER 3: BOTTOM COCKPIT DOCK */}
      <footer className="w-full flex flex-col md:flex-row items-end justify-between gap-3 pointer-events-auto">
        {/* BOTTOM LEFT: Modular Weapon Synergy Array */}
        <WeaponSynergyTray
          activeSynergies={state.activeSynergies}
          overchargeRatio={state.grazeMeter / 100}
        />

        {/* BOTTOM CENTER: Tactical Graze Overcharge Surge Conduit Gauge */}
        <div className="flex flex-col gap-1.5 bg-surface-container-lowest/90 backdrop-blur-xl px-4 py-3 rounded-lg border border-outline-variant/40 shadow-2xl min-w-[260px] flex-1 max-w-sm">
          <div className="flex items-center justify-between font-mono text-xs text-tertiary">
            <span className="flex items-center gap-1 font-bold">
              <Zap className="w-3.5 h-3.5 text-tertiary-fixed animate-pulse" />
              OVERCHARGE SYSTEM
            </span>
            <span className="font-mono font-bold text-tertiary-fixed">{state.grazeMeter}%</span>
          </div>

          {/* Pulsing Luminous Purple/Cyan Overcharge Bar */}
          <div className="w-full h-3.5 bg-surface-container-high rounded p-0.5 flex relative overflow-hidden border border-tertiary/40">
            <div
              className="h-full bg-gradient-to-r from-primary via-tertiary to-tertiary-fixed rounded shadow-[0_0_16px_#c78dff] transition-all duration-150"
              style={{ width: `${state.grazeMeter}%` }}
            />
            {isOverchargeReady && (
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite]" />
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
            <span>BURST READINESS</span>
            <span
              className={`font-semibold uppercase ${
                isOverchargeReady ? 'text-tertiary-fixed animate-pulse' : 'text-outline'
              }`}
            >
              {isOverchargeReady ? 'GRAZE SURGE READY' : 'BUILDING CAPACITANCE'}
            </span>
          </div>
        </div>

        {/* BOTTOM RIGHT: Overdrive Trigger & Phase Dash Buttons */}
        <div className="flex items-center gap-2 min-w-[280px]">
          {/* Tactical Secondary Shift Dash */}
          <button
            onClick={onDash}
            disabled={state.dashCooldown > 0}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded border transition-all active:scale-95 select-none ${
              state.dashCooldown > 0
                ? 'bg-surface-container-high/40 border-outline-variant/30 text-outline opacity-60 cursor-not-allowed'
                : 'bg-surface-container-high/80 hover:bg-surface-container border-outline-variant hover:border-primary/50 text-on-surface'
            }`}
            type="button"
          >
            <div className="flex items-center gap-1 text-[10px] font-mono text-primary font-bold">
              <FastForward className="w-3.5 h-3.5" />
              <span>[SHIFT]</span>
            </div>
            <span className="font-mono text-xs font-semibold tracking-wider text-on-surface">
              {state.dashCooldown > 0 ? `DASH (${(state.dashCooldown * 1.8).toFixed(1)}s)` : 'PHASE DASH'}
            </span>
          </button>

          {/* Primary Overdrive Button (EMP Blast Trigger) */}
          <button
            onClick={onEMP}
            disabled={!isOverchargeReady}
            className={`flex-[1.5] relative overflow-hidden flex flex-col items-center justify-center py-2.5 px-4 rounded border-2 transition-all active:scale-95 select-none ${
              isOverchargeReady
                ? 'bg-primary-container/20 hover:bg-primary-container/40 border-primary shadow-[0_0_24px_rgba(6,182,212,0.6)] cursor-pointer animate-pulse'
                : 'bg-surface-container-high/40 border-outline-variant/30 text-outline opacity-50 cursor-not-allowed'
            }`}
            type="button"
          >
            <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono tracking-widest font-bold">
              <Zap className={`w-3.5 h-3.5 ${isOverchargeReady ? 'animate-bounce' : ''}`} />
              <span>[SPACE] DISCHARGE</span>
            </div>
            <span className="font-mono text-xs font-extrabold text-on-surface tracking-wider uppercase">
              OVERDRIVE EMP
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
}
