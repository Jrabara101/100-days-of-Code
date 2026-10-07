import React from 'react';
import { Settings, Shield, Crosshair, Zap, Compass, Radio } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface GameBackgroundProps {
  onOpenSettings: () => void;
  isSettingsOpen: boolean;
}

export const GameBackground: React.FC<GameBackgroundProps> = ({
  onOpenSettings,
  isSettingsOpen,
}) => {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070B] text-slate-100 flex flex-col justify-between p-6 select-none font-sans">
      {/* Sci-fi Tactical HUD Grid Overlay */}
      <div className="absolute inset-0 tactical-grid opacity-30 pointer-events-none" />

      {/* Ambient glowing nebula background lights */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Top HUD Bar */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-cyan-400 tracking-widest block">
              TACTICAL AVIONICS COMBAT SIM
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              SECTOR 07-BRAVO // FLIGHT DECK TELEMETRY
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 font-mono text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>SHIELD: 100%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>CAPACITOR: 94%</span>
            </div>
          </div>

          {!isSettingsOpen && (
            <Button
              size="md"
              variant="avionics"
              onClick={onOpenSettings}
              className="gap-2 font-mono text-xs font-bold animate-pulse shadow-glow-cyan"
            >
              <Settings className="w-4 h-4" />
              OPEN CALIBRATION DECK [ESC]
            </Button>
          )}
        </div>
      </header>

      {/* Center Reticle & Status */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto pointer-events-none">
        <div className="relative w-36 h-36 rounded-full border border-cyan-500/30 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border border-dashed border-cyan-500/50 animate-[spin_20s_linear_infinite]" />
          <Crosshair className="w-8 h-8 text-cyan-400 opacity-80" />
          <div className="absolute -top-3 px-2 py-0.5 rounded bg-black/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-300">
            LOCKED TARGET: ALPHA-01
          </div>
        </div>

        <div className="mt-4 text-center">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-wider text-slate-100 uppercase font-sans">
            Tactical Flight Deck & Combat Suite
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Press <strong className="text-cyan-400 font-bold">[ESC]</strong> to invoke the Settings & Controls Calibration Suite.
          </p>
        </div>
      </div>

      {/* Bottom Mission Telemetry Ribbon */}
      <footer className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-4 font-mono text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>HEADING 042° // ELEV +12.4° // LATENCY 3.8ms</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500">HOTKEYS:</span>
          <span className="px-2 py-0.5 rounded bg-[#131722] border border-slate-800 text-slate-300 text-[10px]">
            [ESC] Settings
          </span>
          <span className="px-2 py-0.5 rounded bg-[#131722] border border-slate-800 text-slate-300 text-[10px]">
            [WASD] Thrusters
          </span>
          <span className="px-2 py-0.5 rounded bg-[#131722] border border-slate-800 text-slate-300 text-[10px]">
            [SPACE] Mantle
          </span>
        </div>
      </footer>
    </div>
  );
};
