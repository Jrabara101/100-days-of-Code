import React from 'react';
import {
  Sliders,
  Eye,
  Radio,
  Camera,
  Users,
  Compass,
  Crosshair,
  ShieldAlert,
  Palette,
  X,
  RotateCcw,
} from 'lucide-react';

export const ControlDrawer = ({
  isOpen,
  onClose,
  engine,
  numBoids,
  onNumBoidsChange,
  weights,
  onWeightChange,
  colorTheme,
  onColorThemeChange,
  cameraMode,
  onCameraModeChange,
  showBounds,
  onToggleBounds,
  showGrid,
  onToggleGrid,
  showTarget,
  onToggleTarget,
  showPredator,
  onTogglePredator,
  mouseTargeting,
  onToggleMouseTargeting,
  onResetDefaults,
}) => {
  return (
    <aside
      className={`fixed top-16 md:top-20 right-4 bottom-24 w-80 sm:w-96 glass-panel-glow rounded-2xl z-30 transition-all duration-300 transform flex flex-col pointer-events-auto overflow-hidden ${
        isOpen
          ? 'translate-x-0 opacity-100'
          : 'translate-x-[110%] opacity-0 pointer-events-none'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-cyber-border/30 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2 text-sky-400 font-display font-bold text-sm">
          <Sliders className="w-4 h-4" />
          <span>SIMULATION PARAMETERS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onResetDefaults}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
            title="Reset to Baseline Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Controls Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs font-mono text-slate-300">
        {/* Population / Boid Count */}
        <section className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sky-300 font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>POPULATION DENSITY</span>
            </div>
            <span className="text-sky-400 font-bold">{numBoids}</span>
          </div>
          <input
            type="range"
            min="200"
            max="3500"
            step="100"
            value={numBoids}
            onChange={(e) => onNumBoidsChange(parseInt(e.target.value))}
            className="w-full accent-sky-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>200 (Low)</span>
            <span>1,400 (Standard)</span>
            <span>3,500 (Heavy)</span>
          </div>
        </section>

        {/* Reynolds Steering Forces */}
        <section className="space-y-4 bg-slate-950/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-sky-300 font-semibold border-b border-white/5 pb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>REYNOLDS STEERING KERNEL</span>
          </div>

          {/* Separation */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Separation ($w_{'{'}sep{'}'}$):</span>
              <span className="text-sky-400 font-bold">{weights.weightSep.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="4.0"
              step="0.1"
              value={weights.weightSep}
              onChange={(e) => onWeightChange('weightSep', parseFloat(e.target.value))}
              className="w-full accent-sky-400"
            />
          </div>

          {/* Alignment */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Alignment ($w_{'{'}ali{'}'}$):</span>
              <span className="text-sky-400 font-bold">{weights.weightAli.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="4.0"
              step="0.1"
              value={weights.weightAli}
              onChange={(e) => onWeightChange('weightAli', parseFloat(e.target.value))}
              className="w-full accent-sky-400"
            />
          </div>

          {/* Cohesion */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Cohesion ($w_{'{'}coh{'}'}$):</span>
              <span className="text-sky-400 font-bold">{weights.weightCoh.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="4.0"
              step="0.1"
              value={weights.weightCoh}
              onChange={(e) => onWeightChange('weightCoh', parseFloat(e.target.value))}
              className="w-full accent-sky-400"
            />
          </div>

          {/* Attractor Pull */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Attractor Gravitation ($w_{'{'}target{'}'}$):</span>
              <span className="text-rose-400 font-bold">{weights.weightTarget.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.1"
              value={weights.weightTarget}
              onChange={(e) => onWeightChange('weightTarget', parseFloat(e.target.value))}
              className="w-full accent-rose-400"
            />
          </div>
        </section>

        {/* Sensory Radii & Kinematics */}
        <section className="space-y-4 bg-slate-950/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-sky-300 font-semibold border-b border-white/5 pb-2">
            <Radio className="w-3.5 h-3.5" />
            <span>SENSORY RADII & KINEMATICS</span>
          </div>

          {/* Neighbor Radius */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Sensory Radius ($r_{'{'}neighbor{'}'}$):</span>
              <span className="text-emerald-400 font-bold">{weights.neighborRadius.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="4.0"
              max="16.0"
              step="0.5"
              value={weights.neighborRadius}
              onChange={(e) => onWeightChange('neighborRadius', parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>

          {/* Separation Radius */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Separation Zone ($r_{'{'}sep{'}'}$):</span>
              <span className="text-emerald-400 font-bold">{weights.separationRadius.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="6.0"
              step="0.2"
              value={weights.separationRadius}
              onChange={(e) => onWeightChange('separationRadius', parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>

          {/* Max Velocity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Terminal Velocity ($v_{'{'}max{'}'}$):</span>
              <span className="text-purple-400 font-bold">{weights.maxSpeed.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="3.5"
              step="0.1"
              value={weights.maxSpeed}
              onChange={(e) => onWeightChange('maxSpeed', parseFloat(e.target.value))}
              className="w-full accent-purple-400"
            />
          </div>

          {/* Max Force */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Max Steering Force ($F_{'{'}max{'}'}$):</span>
              <span className="text-purple-400 font-bold">{weights.maxForce.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.30"
              step="0.01"
              value={weights.maxForce}
              onChange={(e) => onWeightChange('maxForce', parseFloat(e.target.value))}
              className="w-full accent-purple-400"
            />
          </div>
        </section>

        {/* Dynamic Agents: Attractor & Predator Modes */}
        <section className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-sky-300 font-semibold border-b border-white/5 pb-2">
            <Crosshair className="w-3.5 h-3.5" />
            <span>ATTRACTOR & PREDATOR DYNAMICS</span>
          </div>

          {/* Mouse Raycast Targeting Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-[11px] text-slate-300">Pointer Raycast Attractor</span>
            <button
              onClick={onToggleMouseTargeting}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                mouseTargeting
                  ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {mouseTargeting ? 'ENABLED (CLICK/DRAG)' : 'DISABLED'}
            </button>
          </div>

          {/* Predator Agent Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-[11px] text-slate-300">Apex Predator Hunter</span>
            <button
              onClick={onTogglePredator}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                showPredator && engine.predator.active
                  ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.6)]'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {showPredator && engine.predator.active ? 'ACTIVE' : 'OFFLINE'}
            </button>
          </div>
        </section>

        {/* Visual Shaders & Palettes */}
        <section className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-sky-300 font-semibold border-b border-white/5 pb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>COLOR SPECTRAL PALETTE</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {[
              { id: 'cyan', name: 'Cyber Cyan' },
              { id: 'ocean', name: 'Deep Ocean' },
              { id: 'thermal', name: 'Thermal Vector' },
              { id: 'emerald', name: 'Matrix Emerald' },
              { id: 'neon', name: 'Electric Neon' },
            ].map((th) => (
              <button
                key={th.id}
                onClick={() => onColorThemeChange(th.id)}
                className={`px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                  colorTheme === th.id
                    ? 'border-sky-400 bg-sky-500/20 text-sky-300 font-bold shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                    : 'border-white/5 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {th.name}
              </button>
            ))}
          </div>
        </section>

        {/* Camera Views */}
        <section className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-sky-300 font-semibold border-b border-white/5 pb-2">
            <Camera className="w-3.5 h-3.5" />
            <span>CAMERA PERSPECTIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {[
              { id: 'default', name: 'Isometric View' },
              { id: 'top', name: 'Top-Down Plan' },
              { id: 'follow', name: 'Flock Centroid' },
              { id: 'cinematic', name: 'Cinematic Orbit' },
            ].map((cam) => (
              <button
                key={cam.id}
                onClick={() => onCameraModeChange(cam.id)}
                className={`px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                  cameraMode === cam.id
                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300 font-bold'
                    : 'border-white/5 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cam.name}
              </button>
            ))}
          </div>
        </section>

        {/* Visual Guides & Overlays */}
        <section className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-sky-300 font-semibold border-b border-white/5 pb-2">
            <Eye className="w-3.5 h-3.5" />
            <span>GEOMETRY OVERLAYS</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[11px] text-slate-300">Bounding Domain Box</span>
            <input
              type="checkbox"
              checked={showBounds}
              onChange={onToggleBounds}
              className="accent-sky-400 rounded w-4 h-4 cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[11px] text-slate-300">3D Spatial Hash Grid</span>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={onToggleGrid}
              className="accent-sky-400 rounded w-4 h-4 cursor-pointer"
            />
          </div>
        </section>
      </div>
    </aside>
  );
};
