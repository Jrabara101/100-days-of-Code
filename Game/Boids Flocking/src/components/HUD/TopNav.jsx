import React from 'react';
import { Activity, Cpu, Gauge, Layers, Sliders, Info, Sparkles } from 'lucide-react';
import { PRESETS } from '../../engine/presets';

export const TopNav = ({
  telemetry,
  activePreset,
  onSelectPreset,
  onOpenTelemetryModal,
  onToggleDrawer,
  isDrawerOpen,
}) => {
  return (
    <header className="fixed top-0 left-0 w-full px-4 sm:px-6 py-3 z-40 flex flex-col md:flex-row justify-between items-center gap-3 glass-panel border-b border-cyber-border/40 pointer-events-auto">
      {/* Branding & Subtitle */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500/20 to-sky-400/40 border border-sky-400/50 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.35)]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300 uppercase">
                BOIDS_FLOCKING_3D
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-300 font-semibold">
                v2.4 SOA
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 tracking-wider">
              REYNOLDS STEERING & 3D SPATIAL HASHING
            </p>
          </div>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={onToggleDrawer}
          className="md:hidden p-2 rounded-lg glass-pill text-sky-400 hover:bg-sky-500/10 transition-colors"
          title="Toggle Control Drawer"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Preset Quick Switcher */}
      <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/5 font-mono text-xs">
        {PRESETS.map((p) => {
          const isSelected = activePreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p.id)}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.5)] scale-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>{p.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Telemetry Chips & Inspector Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs overflow-x-auto max-w-full pb-1 md:pb-0">
        {/* Boids Count */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-sky-500/20 text-slate-300">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] text-slate-400">BOIDS:</span>
          <strong className="text-sky-300">{telemetry.boids}</strong>
        </div>

        {/* Avg Velocity */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-emerald-500/20 text-slate-300">
          <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-slate-400">VEL:</span>
          <strong className="text-emerald-300">{telemetry.avgSpeed} u/s</strong>
        </div>

        {/* Viewport FPS */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-indigo-500/20 text-slate-300">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] text-slate-400">FPS:</span>
          <strong
            className={
              telemetry.fps >= 55
                ? 'text-emerald-400'
                : telemetry.fps >= 35
                ? 'text-amber-400'
                : 'text-rose-400'
            }
          >
            {telemetry.fps}
          </strong>
        </div>

        {/* Step Compute Ms */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-purple-500/20 text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px] text-slate-400">KERNEL:</span>
          <strong className="text-purple-300">{telemetry.stepMs || '0.5'}ms</strong>
        </div>

        {/* Open Telemetry & System Specs Modal */}
        <button
          onClick={onOpenTelemetryModal}
          className="p-1.5 rounded-lg glass-pill text-slate-300 hover:text-sky-300 hover:bg-sky-500/10 transition-colors border border-sky-500/30"
          title="Staff Systems Architecture & Math Formulations"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
