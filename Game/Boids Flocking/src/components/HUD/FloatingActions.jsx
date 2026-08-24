import React from 'react';
import {
  Play,
  Pause,
  Shuffle,
  Volume2,
  VolumeX,
  Crosshair,
  Sliders,
  Maximize,
  Minimize,
  Zap,
} from 'lucide-react';

export const FloatingActions = ({
  weights,
  onWeightChange,
  targetActive,
  onToggleTarget,
  onScramble,
  onShockwave,
  isPaused,
  onTogglePause,
  audioEnabled,
  onToggleAudio,
  isDrawerOpen,
  onToggleDrawer,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <footer className="fixed bottom-3 left-0 w-full px-4 sm:px-6 z-40 pointer-events-none">
      <div className="max-w-5xl mx-auto glass-panel rounded-2xl p-3 sm:p-4 border border-cyber-border/40 pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Reynolds Steering Quick Sliders */}
        <div className="grid grid-cols-3 gap-4 w-full md:w-3/5 text-xs font-mono">
          {/* Separation */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span className="text-[11px] font-semibold text-sky-400">SEP:</span>
              <span className="text-slate-200 font-bold">{weights.weightSep.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="4.0"
              step="0.1"
              value={weights.weightSep}
              onChange={(e) => onWeightChange('weightSep', parseFloat(e.target.value))}
              className="accent-sky-400 w-full cursor-pointer"
            />
          </div>

          {/* Alignment */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span className="text-[11px] font-semibold text-emerald-400">ALI:</span>
              <span className="text-slate-200 font-bold">{weights.weightAli.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="4.0"
              step="0.1"
              value={weights.weightAli}
              onChange={(e) => onWeightChange('weightAli', parseFloat(e.target.value))}
              className="accent-emerald-400 w-full cursor-pointer"
            />
          </div>

          {/* Cohesion */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span className="text-[11px] font-semibold text-purple-400">COH:</span>
              <span className="text-slate-200 font-bold">{weights.weightCoh.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="4.0"
              step="0.1"
              value={weights.weightCoh}
              onChange={(e) => onWeightChange('weightCoh', parseFloat(e.target.value))}
              className="accent-purple-400 w-full cursor-pointer"
            />
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end font-mono text-xs">
          {/* Attractor Toggle */}
          <button
            onClick={onToggleTarget}
            className={`px-3 py-2 rounded-xl font-bold border transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
              targetActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : 'bg-slate-900/80 text-slate-400 border-white/5 hover:border-white/20'
            }`}
            title="Toggle Dynamic Lissajous Attractor"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{targetActive ? 'ATTRACTOR' : 'FREE ROAM'}</span>
          </button>

          {/* Scramble Impulse */}
          <button
            onClick={onScramble}
            className="px-3 py-2 rounded-xl font-bold bg-sky-500/20 border border-sky-400/40 text-sky-300 hover:bg-sky-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-[0_0_10px_rgba(56,189,248,0.2)]"
            title="Randomize Boid Headings"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SCRAMBLE</span>
          </button>

          {/* Radial Shockwave */}
          <button
            onClick={onShockwave}
            className="p-2 rounded-xl font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30 transition-all flex items-center gap-1.5 active:scale-95"
            title="Trigger Central Radial Shockwave Impulse"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>

          {/* Pause / Resume */}
          <button
            onClick={onTogglePause}
            className={`p-2 rounded-xl font-bold border transition-all active:scale-95 ${
              isPaused
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-white/5'
            }`}
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Audio Synth Toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-xl font-bold border transition-all active:scale-95 ${
              audioEnabled
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                : 'bg-slate-900/80 text-slate-400 border-white/10 hover:bg-white/5'
            }`}
            title={audioEnabled ? 'Mute Generative Drone' : 'Unmute Generative Flocking Audio Synth'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl font-bold bg-slate-900/80 text-slate-300 border border-white/10 hover:bg-white/5 transition-all active:scale-95"
            title="Toggle Fullscreen Mode"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Drawer Toggle */}
          <button
            onClick={onToggleDrawer}
            className={`p-2 rounded-xl font-bold border transition-all active:scale-95 ${
              isDrawerOpen
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]'
                : 'bg-slate-900/80 text-sky-400 border-sky-500/30 hover:bg-sky-500/10'
            }`}
            title="Toggle Parameter Matrix Drawer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
