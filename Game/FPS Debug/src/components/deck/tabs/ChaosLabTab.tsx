import React, { useState } from 'react';
import type { ChaosSettings } from '../../../types/telemetry';
import { chaosEngine } from '../../../services/chaosEngine';
import { Flame, Cpu, Gauge, Radio, ShieldAlert, Sparkles, RefreshCw, Zap } from 'lucide-react';

interface ChaosLabTabProps {
  onSettingsChanged?: () => void;
}

export const ChaosLabTab: React.FC<ChaosLabTabProps> = ({ onSettingsChanged }) => {
  const [settings, setSettings] = useState<ChaosSettings>(chaosEngine.getSettings());
  const [lastHitchTriggered, setLastHitchTriggered] = useState<string | null>(null);

  const update = (partial: Partial<ChaosSettings>) => {
    chaosEngine.updateSettings(partial);
    const updated = chaosEngine.getSettings();
    setSettings(updated);
    if (onSettingsChanged) onSettingsChanged();
  };

  const handleReset = () => {
    update({
      targetFpsCap: 0,
      cpuLagDelayMs: 0,
      cpuWorkerLoadPct: 0,
      artificialJitterMs: 0,
      memoryStressActive: false,
      memoryStressMb: 128,
      dropFramesProbability: 0,
    });
    setLastHitchTriggered('All throttling restored to nominal zero');
  };

  const triggerInstantHitch = (ms: number) => {
    chaosEngine.injectInstantHitch(ms);
    setLastHitchTriggered(`Injected ${ms}ms main-thread blocking hitch`);
    setTimeout(() => setLastHitchTriggered(null), 3000);
  };

  const triggerGcSpike = () => {
    chaosEngine.triggerGarbageCollectionSpike(64);
    setLastHitchTriggered('Dispatched 64MB transient heap buffer for GC reclaim');
    setTimeout(() => setLastHitchTriggered(null), 3000);
  };

  return (
    <div className="space-y-4 font-mono-avionics text-xs">
      {/* Banner / Notice */}
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Flame className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="text-amber-200 font-bold block">Chaos Rig // Stress Simulation Sandbox</span>
            <span className="text-[11px] text-amber-300/80 font-sans">
              Inject hardware constraints, CPU busy-wait loops, and GC churn to test game smoothness and verify 1% low radar warnings.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 transition-colors flex items-center space-x-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset All</span>
        </button>
      </div>

      {lastHitchTriggered && (
        <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-[11px] flex items-center space-x-2 animate-bounce">
          <Zap className="w-3.5 h-3.5 text-red-400" />
          <span>{lastHitchTriggered}</span>
        </div>
      )}

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Frame Rate Lock */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0D1322] space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Target Framerate Cap</span>
            </span>
            <span className="text-cyan-300 font-bold">
              {settings.targetFpsCap === 0 ? 'Uncapped' : `${settings.targetFpsCap} FPS`}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[0, 30, 45, 60, 120].map((cap) => (
              <button
                key={cap}
                type="button"
                onClick={() => update({ targetFpsCap: cap })}
                className={`flex-1 py-1.5 rounded border text-[11px] font-bold transition-all ${
                  settings.targetFpsCap === cap
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                    : 'bg-[#080C16] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cap === 0 ? 'MAX' : `${cap} FPS`}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Locks requestAnimationFrame pacing to simulate lower refresh rate monitors or thermal caps.
          </span>
        </div>

        {/* Worker-based CPU Burner */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0D1322] space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-red-400" />
              <span>Web Worker CPU Burner</span>
            </span>
            <span className="text-red-300 font-bold">{settings.cpuWorkerLoadPct}% Load</span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.cpuWorkerLoadPct}
              onChange={(e) => update({ cpuWorkerLoadPct: Number(e.target.value) })}
              className="w-full accent-red-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Idle)</span>
              <span>50% (Heavy Physics)</span>
              <span>100% (Thermal Saturation)</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Off-thread busy-wait loop taxing core hardware to simulate background processes and mobile heat.
          </span>
        </div>

        {/* Main Thread Artificial Lag */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0D1322] space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Main Thread Frame Delay (ms)</span>
            </span>
            <span className="text-amber-300 font-bold">{settings.cpuLagDelayMs} ms</span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="45"
              step="1"
              value={settings.cpuLagDelayMs}
              onChange={(e) => update({ cpuLagDelayMs: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 ms</span>
              <span>16.6 ms (Drop to 30)</span>
              <span>45 ms (Heavy Hitch)</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Injects synchronous blocking computation into the game loop to test frame pacing resilience.
          </span>
        </div>

        {/* Frame Hitch Jitter Probability */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0D1322] space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Stutter Drop Probability</span>
            </span>
            <span className="text-amber-300 font-bold">
              {(settings.dropFramesProbability * 100).toFixed(0)}%
            </span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.05"
              value={settings.dropFramesProbability}
              onChange={(e) => update({ dropFramesProbability: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Smooth)</span>
              <span>15% (Micro-stutters)</span>
              <span>40% (Severe Hitching)</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Randomly drops random frame cycles to trigger the 1% low radar and HUD tremor warning.
          </span>
        </div>
      </div>

      {/* Instant Trigger Arsenal */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0D1322] space-y-3">
        <span className="text-slate-300 font-semibold block pb-1 border-b border-slate-800">
          Manual Hitch &amp; Stress Injectors (One-Click Verification)
        </span>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => triggerInstantHitch(80)}
            className="px-3 py-2 rounded-lg bg-red-950/70 border border-red-800/80 text-red-200 hover:bg-red-900/90 transition-all flex items-center space-x-2"
          >
            <Zap className="w-3.5 h-3.5 text-red-400" />
            <span>Inject 80ms Asset Freeze</span>
          </button>

          <button
            type="button"
            onClick={() => triggerInstantHitch(150)}
            className="px-3 py-2 rounded-lg bg-red-950/70 border border-red-800/80 text-red-200 hover:bg-red-900/90 transition-all flex items-center space-x-2"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Inject 150ms Severe Long Task</span>
          </button>

          <button
            type="button"
            onClick={triggerGcSpike}
            className="px-3 py-2 rounded-lg bg-cyan-950/70 border border-cyan-800/80 text-cyan-200 hover:bg-cyan-900/90 transition-all flex items-center space-x-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Provoke 64MB GC Heap Pulse</span>
          </button>
        </div>
      </div>
    </div>
  );
};
