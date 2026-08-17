import React, { useState } from 'react';
import { Flame, ShieldAlert, CloudRain, Zap, Radio } from 'lucide-react';

export function DisturbancesToolbar({
  onTapBrake,
  onToggleStall,
  engine
}) {
  const [isWetRoad, setIsWetRoad] = useState(false);

  const handleToggleWetRoad = () => {
    const nextWet = !isWetRoad;
    setIsWetRoad(nextWet);
    if (nextWet) {
      // Low friction road (Wet weather)
      engine.setGlobalIDMOverrides({
        aMax: 0.8,
        bComf: 1.0,
        s0: 6.0
      });
    } else {
      // Restore normal dry asphalt
      engine.setGlobalIDMOverrides({
        aMax: 1.4,
        bComf: 1.8,
        s0: 4.0
      });
    }
  };

  const handleTriggerPlatoon = () => {
    engine.setGlobalIDMOverrides({
      v0: 20.0,
      T: 0.5,
      s0: 2.0,
      aMax: 2.2,
      bComf: 2.5
    });
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-2xl border border-sky-400/20">
        <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider hidden sm:inline mr-1 flex items-center gap-1">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Disturbances:</span>
        </span>

        {/* Tap Brake Leader */}
        <button
          onClick={onTapBrake}
          className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-md"
          title="Forces lead vehicle to tap brake, initiating emergent shockwave"
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>Tap Brake</span>
        </button>

        {/* Stall Vehicle */}
        <button
          onClick={onToggleStall}
          className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-md"
          title="Stalls vehicle as stationary obstacle"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Stall Roadblock</span>
        </button>

        {/* Rain / Low Friction Toggle */}
        <button
          onClick={handleToggleWetRoad}
          className={`px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1.5 active:scale-95 ${
            isWetRoad
              ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Toggles wet asphalt friction reduction (amplifies shockwaves)"
        >
          <CloudRain className="w-3.5 h-3.5 text-blue-400" />
          <span>{isWetRoad ? '🌧️ Wet Asphalt (ON)' : '☀️ Dry Asphalt'}</span>
        </button>

        {/* AV Platoon Preset */}
        <button
          onClick={handleTriggerPlatoon}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-md"
          title="Applies autonomous vehicle low-headway platooning parameters"
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>AV Platoon</span>
        </button>
      </div>
    </div>
  );
}
