import React from 'react';
import { 
  Play, Pause, FastForward, Volume2, VolumeX, 
  Sun, CloudRain, Wind, Dna, BarChart3, Users, BookOpen
} from 'lucide-react';

export default function TopBar({
  sim,
  resources,
  population,
  broodCount,
  gameHour,
  weather,
  speedFactor,
  isPaused,
  isAudioActive,
  onTogglePause,
  onSetSpeed,
  onToggleAudio,
  onOpenModal
}) {
  const formattedHour = Math.floor(gameHour);
  const formattedMin = Math.floor((gameHour % 1) * 60);
  const timeString = `${String(formattedHour).padStart(2, '0')}:${String(formattedMin).padStart(2, '0')}`;
  const isNight = formattedHour < 6 || formattedHour >= 19;

  return (
    <header className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-3 pointer-events-none">
      {/* Left: Colony Identity & Core Vital Status */}
      <div className="glass-panel p-2.5 px-4 rounded-xl flex items-center gap-4 pointer-events-auto shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl">
            🐜
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide text-emerald-400 font-mono uppercase flex items-center gap-1.5">
              AntColony_OS <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">v2.0</span>
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Pop: <strong className="text-slate-100 font-mono">{population}</strong> ants</span>
              <span className="text-purple-400 font-mono">({broodCount} brood)</span>
            </p>
          </div>
        </div>

        {/* Resources Badges */}
        <div className="h-6 w-px bg-slate-700/60 hidden sm:block" />

        <div className="flex items-center gap-3 text-xs font-mono">
          {/* Sugar */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-sky-500/30" title="Sugar / Energy">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
            <span className="text-sky-300 font-bold">{Math.floor(resources.sugar)}</span>
          </div>

          {/* Protein */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-rose-500/30" title="Protein / Brood growth">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
            <span className="text-rose-300 font-bold">{Math.floor(resources.protein)}</span>
          </div>

          {/* Leaf */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-emerald-500/30" title="Foliage / Biomass">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_6px_#22c55e]" />
            <span className="text-emerald-300 font-bold">{Math.floor(resources.leaf)}</span>
          </div>

          {/* Honey */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-amber-500/30" title="Honeydew / Superfood">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
            <span className="text-amber-300 font-bold">{Math.floor(resources.honey)}</span>
          </div>
        </div>
      </div>

      {/* Center: Colony Nav Modals Buttons */}
      <div className="glass-panel p-1.5 px-3 rounded-xl flex items-center gap-1.5 pointer-events-auto shadow-xl hidden md:flex">
        <button
          onClick={() => onOpenModal('colony')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>Castes</span>
        </button>

        <button
          onClick={() => onOpenModal('evolution')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <Dna className="w-3.5 h-3.5 text-emerald-400" />
          <span>Genetics</span>
        </button>

        <button
          onClick={() => onOpenModal('statistics')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => onOpenModal('scenarios')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>Scenarios</span>
        </button>
      </div>

      {/* Right: Environment, Time & Playback Controls */}
      <div className="glass-panel p-2 px-3 rounded-xl flex items-center gap-3 pointer-events-auto shadow-xl">
        {/* Weather & Time */}
        <div className="flex items-center gap-2 bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs font-mono">
          {weather === 'RAIN' ? (
            <CloudRain className="w-4 h-4 text-cyan-400 animate-bounce" />
          ) : weather === 'WIND' ? (
            <Wind className="w-4 h-4 text-slate-300" />
          ) : (
            <Sun className={`w-4 h-4 ${isNight ? 'text-indigo-400' : 'text-amber-400 animate-spin-slow'}`} />
          )}
          <span className="text-slate-200 font-bold">{timeString}</span>
          <span className="text-[10px] text-slate-400 uppercase">({weather})</span>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={onTogglePause}
            className={`p-1.5 rounded-md text-xs font-bold transition ${
              isPaused ? 'bg-amber-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onSetSpeed(1)}
            className={`px-2 py-1 rounded-md text-xs font-mono font-bold transition ${
              !isPaused && speedFactor === 1 ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            1x
          </button>
          <button
            onClick={() => onSetSpeed(2)}
            className={`px-2 py-1 rounded-md text-xs font-mono font-bold transition ${
              !isPaused && speedFactor === 2 ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            2x
          </button>
          <button
            onClick={() => onSetSpeed(5)}
            className={`px-2 py-1 rounded-md text-xs font-mono font-bold transition ${
              !isPaused && speedFactor === 5 ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            5x
          </button>
        </div>

        {/* Audio Ambient toggle */}
        <button
          onClick={onToggleAudio}
          className={`p-2 rounded-lg border transition ${
            isAudioActive
              ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title={isAudioActive ? 'Mute Music' : 'Start Ambient Synth Music'}
        >
          {isAudioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
