import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Sliders, 
  LineChart, 
  Zap, 
  Activity,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { SCENARIOS } from '../engine/Scenarios.js';

export function TopHeader({
  engine,
  currentScenario,
  onScenarioChange,
  isPaused,
  onTogglePause,
  speedMultiplier,
  onChangeSpeed,
  onReset,
  telemetry,
  isControlPanelOpen,
  onToggleControlPanel,
  isTelemetryHudOpen,
  onToggleTelemetryHud
}) {
  const getShockwaveColor = (idx) => {
    if (idx < 20) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (idx < 50) return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
    if (idx < 75) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10 animate-pulse';
  };

  return (
    <header className="w-full z-40 p-3 pointer-events-auto flex flex-col gap-2.5">
      <div className="w-full mx-auto glass-panel-glow px-4 py-2.5 rounded-2xl flex flex-wrap justify-between items-center gap-3">
        {/* Brand & Engine Identification */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
            <Zap className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-sky-400 to-cyan-200 bg-clip-text text-transparent">
                TRAFFIC_SIM // 2D IDM CORE
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-400/30 text-[9px] font-mono text-sky-400">
                v2.0 PRO
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
              MICROSCOPIC CAR-FOLLOWING & SHOCKWAVE SIMULATOR
            </p>
          </div>
        </div>

        {/* Scenario Selection Tabs */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 overflow-x-auto max-w-full">
          {Object.values(SCENARIOS).map((sc) => {
            const isActive = currentScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => onScenarioChange(sc.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {sc.id === 'SUGIYAMA_RING' && '🔄'}
                {sc.id === 'FOUR_WAY_INTERSECTION' && '🚦'}
                {sc.id === 'HIGHWAY_BOTTLENECK' && '🚧'}
                {sc.id === 'ROUNDABOUT' && '🔀'}
                <span>{sc.name.split(' ')[0]} {sc.name.split(' ')[1] || ''}</span>
              </button>
            );
          })}
        </div>

        {/* Live Telemetry KPI Chips */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {/* Signal Phase (If active) */}
          {engine.trafficLight && (
            <div className="px-2.5 py-1 rounded-lg glass-card border border-slate-700/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-ping" style={{
                backgroundColor: engine.trafficLight.currentPhase.includes('GREEN') ? '#10b981' : engine.trafficLight.currentPhase.includes('YELLOW') ? '#f59e0b' : '#ef4444'
              }} />
              <span className="text-[10px] text-slate-400">Phase:</span>
              <strong className={engine.trafficLight.currentPhase.includes('GREEN') ? 'text-emerald-400' : 'text-amber-400'}>
                {engine.trafficLight.currentPhase.replace('_', ' ')}
              </strong>
            </div>
          )}

          {/* Vehicles Active */}
          <div className="px-2.5 py-1 rounded-lg glass-card border border-slate-700/80 flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px]">Veh:</span>
            <strong className="text-sky-400">{telemetry.vehicleCount}</strong>
          </div>

          {/* Average Flow Speed */}
          <div className="px-2.5 py-1 rounded-lg glass-card border border-slate-700/80 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[10px]">Speed:</span>
            <strong className="text-emerald-400">{telemetry.avgSpeedKmh} <span className="text-[9px]">km/h</span></strong>
          </div>

          {/* Shockwave Congestion Index */}
          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${getShockwaveColor(telemetry.shockwaveIndex)}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[10px] opacity-80">Shockwave:</span>
            <strong>{telemetry.shockwaveIndex}%</strong>
          </div>
        </div>

        {/* Action & HUD Toggles */}
        <div className="flex items-center gap-2">
          {/* Play / Pause */}
          <button
            onClick={onTogglePause}
            className={`p-2 rounded-xl border transition-all ${
              isPaused
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title={isPaused ? 'Resume Simulation (Space)' : 'Pause Simulation (Space)'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-700 text-[10px] font-mono">
            {[0.5, 1.0, 2.0, 4.0].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-1.5 py-1 rounded-lg transition-all ${
                  speedMultiplier === s
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-rose-400 transition-all"
            title="Reset Simulation (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Analytics HUD Toggle */}
          <button
            onClick={onToggleTelemetryHud}
            className={`p-2 rounded-xl border transition-all ${
              isTelemetryHudOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Space-Time Analytics HUD"
          >
            <LineChart className="w-4 h-4" />
          </button>

          {/* Controls Panel Drawer Toggle */}
          <button
            onClick={onToggleControlPanel}
            className={`p-2 rounded-xl border transition-all ${
              isControlPanelOpen
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-lg shadow-sky-500/10'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
            }`}
            title="Toggle IDM Controls & Sliders"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
