import React from 'react';
import { ZombieSurvivalGameState } from '../types/game';
import {
  Shield,
  Heart,
  Crosshair,
  Flame,
  Zap,
  Snowflake,
  Wrench,
  Bomb,
  Radio,
  Settings,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface FloatingHUDProps {
  gameState: ZombieSurvivalGameState;
  onOpenForge: () => void;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
  onTriggerReload: () => void;
  onDeployTripwire: () => void;
  onRepairNearestBarricade: () => void;
  onSwitchWeapon: (index: number) => void;
}

export function FloatingHUD({
  gameState,
  onOpenForge,
  onOpenSettings,
  onOpenLeaderboard,
  onTriggerReload,
  onDeployTripwire,
  onRepairNearestBarricade,
  onSwitchWeapon,
}: FloatingHUDProps) {
  const { player, stats, currentWave, enemiesRemaining, totalEnemiesInWave, isBlackout, status } = gameState;
  const activeWeapon = player.weapons[player.activeWeaponIndex];

  // Format Elapsed Survival Time (mm:ss.s)
  const totalSeconds = Math.floor(stats.timeSurvivedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((stats.timeSurvivedMs % 1000) / 100);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;

  // Health % & Armor %
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const armorPercent = Math.max(0, Math.min(100, (player.armor / player.maxArmor) * 100));
  const isCriticalHp = player.hp <= 25;

  // Wave Hostiles Remaining %
  const hostilesProgress =
    totalEnemiesInWave > 0
      ? Math.max(0, Math.min(100, ((totalEnemiesInWave - enemiesRemaining) / totalEnemiesInWave) * 100))
      : 0;

  // Active Reload Variables
  const { activeReload } = player;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none flex flex-col justify-between p-3 sm:p-5">
      {/* CRITICAL LOW HEALTH CRIMSON VIGNETTE & HAZARD PULSE */}
      {isCriticalHp && (
        <div className="absolute inset-0 pointer-events-none border-[12px] border-red-600/70 shadow-[inset_0_0_90px_rgba(239,68,68,0.7)] animate-pulse-crimson" />
      )}

      {/* BLACKOUT ALERT BANNER */}
      {isBlackout && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500 text-red-300 px-6 py-1.5 rounded-sm shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center gap-3 animate-flicker">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
          <span className="font-display font-black text-sm uppercase tracking-widest text-white">
            CRITICAL FACILITY BLACKOUT // AUXILIARY FLASHLIGHT ACTIVE
          </span>
          <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
        </div>
      )}

      {/* TOP FLOATING TELEMETRY CAPSULE */}
      <header className="flex items-center justify-between gap-4 w-full max-w-6xl mx-auto">
        {/* Left: Wave Tracker & Hazard Badge */}
        <div className="pointer-events-auto flex items-center gap-3 bg-[#0C1012D9] backdrop-blur-md border border-[#1E272B] px-4 py-2 rounded-sm shadow-xl">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">DEFENSE SECTOR</div>
              <div className="text-base sm:text-lg font-display font-black text-white tracking-wider">
                WAVE <span className="text-amber-400">{String(currentWave).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
          <Badge variant={currentWave > 5 ? 'crimson' : 'hazard'} className="text-[10px] hidden sm:inline-flex">
            {currentWave > 8 ? 'CATASTROPHIC' : currentWave > 4 ? 'SEVERE' : 'CONTAINED'}
          </Badge>
        </div>

        {/* Center: Hostiles Remaining Runner */}
        <div className="pointer-events-auto flex-1 max-w-md hidden md:flex flex-col gap-1 bg-[#0C1012D9] backdrop-blur-md border border-[#1E272B] px-4 py-2 rounded-sm shadow-xl">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider">SWARM ERADICATION</span>
            <span className="text-amber-400 font-bold tracking-widest">
              {enemiesRemaining} HOSTILES REMAINING
            </span>
          </div>
          <div className="relative h-2 w-full bg-slate-900 rounded-sm overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${hostilesProgress}%` }}
            />
          </div>
        </div>

        {/* Right: Scrap Tally & Timer */}
        <div className="pointer-events-auto flex items-center gap-3 bg-[#0C1012D9] backdrop-blur-md border border-[#1E272B] px-4 py-2 rounded-sm shadow-xl">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">SURVIVAL CLOCK</div>
            <div className="text-sm sm:text-base font-mono font-bold text-white tracking-widest">
              {formattedTime}
            </div>
          </div>
          <div className="h-7 w-[1px] bg-slate-800" />
          <div className="text-right flex items-center gap-2">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">BIOMASS SCRAP</div>
              <div className="text-base sm:text-lg font-mono font-black text-amber-400 tracking-wider">
                ⚙️ {player.scrap.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Action Drawer Buttons */}
          <div className="flex items-center gap-1.5 ml-2">
            <Button
              variant="default"
              size="icon"
              onClick={onOpenLeaderboard}
              title="Quarantine Leaderboard"
              className="w-8 h-8 hover:text-amber-400"
            >
              <Trophy className="w-4 h-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={onOpenSettings}
              title="Tactical Settings [ESC]"
              className="w-8 h-8 hover:text-cyan-400"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* WAVE INTERMISSION CALLOUT (When wave cleared) */}
      {status === 'WAVE_INTERMISSION' && (
        <div className="pointer-events-auto self-center bg-[#0C1012F2] border-2 border-emerald-500/80 p-5 rounded-md text-center max-w-lg shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in-95">
          <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">
            SECTOR TEMPORARILY SECURED
          </div>
          <h2 className="text-2xl font-display font-black text-white uppercase tracking-wider mb-2">
            WAVE {currentWave} CLEARED
          </h2>
          <p className="text-xs text-slate-300 font-mono mb-4">
            Fortify barricades or open the Scrap Forge to evolve weapon ballistics before the next breach.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="hazard" onClick={onOpenForge} className="gap-2">
              <Wrench className="w-4 h-4" /> OPEN SCRAP FORGE [B]
            </Button>
          </div>
        </div>
      )}

      {/* BOTTOM DOCK */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
        {/* Left: Vital Status Capsule (Health & Armor) */}
        <div className="pointer-events-auto bg-[#0C1012D9] backdrop-blur-md border border-[#1E272B] p-3 rounded-sm shadow-xl min-w-[220px]">
          {/* Health Gauge */}
          <div className="space-y-1 mb-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Heart className="w-3.5 h-3.5 fill-emerald-500" /> VITALITY
              </span>
              <span className="text-white font-bold tracking-wider">
                {Math.round(player.hp)} / {player.maxHp}
              </span>
            </div>
            <div className="relative h-2.5 w-full bg-slate-950 rounded-sm overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-200 ${
                  isCriticalHp ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Armor Gauge */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Shield className="w-3.5 h-3.5 fill-cyan-500" /> PLATING
              </span>
              <span className="text-white font-bold tracking-wider">
                {Math.round(player.armor)} / {player.maxArmor}
              </span>
            </div>
            <div className="relative h-2 w-full bg-slate-950 rounded-sm overflow-hidden border border-slate-800">
              <div
                className="h-full bg-cyan-500 transition-all duration-200"
                style={{ width: `${armorPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Active Reload Bar & Ammo Counter */}
        <div className="pointer-events-auto flex flex-col items-center bg-[#0C1012D9] backdrop-blur-md border border-[#1E272B] p-3 rounded-sm shadow-xl min-w-[280px]">
          {/* Active Reload Mini-Game Bar */}
          {activeReload.isReloading ? (
            <div className="w-full mb-2">
              <div className="flex justify-between items-center text-[11px] font-mono mb-1">
                <span className="text-amber-400 font-bold animate-pulse">RELOADING...</span>
                <span className="text-emerald-400 font-bold uppercase tracking-wider">
                  HIT [R] IN BIO SWEET-SPOT!
                </span>
              </div>
              <div className="relative h-4 w-full bg-slate-950 rounded-sm overflow-hidden border border-slate-700">
                {/* Sweet-Spot Zone Indicator */}
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/40 border-x-2 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  style={{
                    left: `${activeReload.sweetSpotStart * 100}%`,
                    width: `${(activeReload.sweetSpotEnd - activeReload.sweetSpotStart) * 100}%`,
                  }}
                />
                {/* Moving Indicator Pin */}
                <div
                  className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_12px_#ffffff] -translate-x-1/2"
                  style={{ left: `${activeReload.progress * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1.5">
              <span>ACTIVE WEAPON:</span>
              <span className="text-white font-bold">{activeWeapon?.name || 'FIREARM'}</span>
            </div>
          )}

          {/* Large Monospace Ammo Counter */}
          <div className="flex items-center gap-3">
            <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider">
              {activeWeapon?.currentAmmo}
              <span className="text-slate-500 text-lg"> / {activeWeapon?.clipSize}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onTriggerReload}
              className="text-xs h-8 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
            >
              RELOAD [R]
            </Button>
          </div>
        </div>

        {/* Right: Weapon Quick-Rack & Fortification Bar */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#0C1012D9] backdrop-blur-md border border-[#1E272B] p-2 rounded-sm shadow-xl">
          {/* Weapon Slots [1], [2], [3] */}
          {player.weapons.map((w, idx) => {
            const isActive = idx === player.activeWeaponIndex;
            return (
              <button
                key={w.id}
                onClick={() => onSwitchWeapon(idx)}
                className={`relative px-3 py-2 rounded-sm font-mono text-left transition-all border ${
                  isActive
                    ? 'border-amber-500 bg-[#1A2328] shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'border-slate-800 bg-[#101416] opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-bold">[{idx + 1}]</span>
                  {w.elemental === 'shock' && <Zap className="w-3 h-3 text-cyan-400" />}
                  {w.elemental === 'incendiary' && <Flame className="w-3 h-3 text-red-400" />}
                  {w.elemental === 'cryo' && <Snowflake className="w-3 h-3 text-sky-400" />}
                </div>
                <div className="text-xs font-bold text-white truncate max-w-[85px]">{w.name}</div>
                <div className="text-[10px] text-amber-400 font-mono">
                  {w.currentAmmo}/{w.clipSize}
                </div>
              </button>
            );
          })}

          <div className="h-9 w-[1px] bg-slate-800 mx-1" />

          {/* Quick Fortify & Forge Buttons */}
          <div className="flex flex-col gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={onDeployTripwire}
              title="Deploy Mine Trap [E]"
              className="h-6 text-[10px] px-2 text-slate-300 hover:text-white"
            >
              <Bomb className="w-3 h-3 mr-1 text-red-400" /> MINE [E]
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onRepairNearestBarricade}
              title="Repair Nearest Barricade [F]"
              className="h-6 text-[10px] px-2 text-slate-300 hover:text-white"
            >
              <Wrench className="w-3 h-3 mr-1 text-amber-400" /> FIX [F]
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
