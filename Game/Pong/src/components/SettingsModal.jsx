import React from 'react';
import { 
  X, 
  Palette, 
  Trophy, 
  Bot, 
  Tv, 
  Volume2, 
  Check 
} from 'lucide-react';
import { THEMES } from '../styles/themes';

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  setTheme,
  scoreLimit,
  setScoreLimit,
  aiDifficulty,
  setAiDifficulty,
  isCRTEnabled,
  setIsCRTEnabled,
  volume,
  setVolume
}) {
  if (!isOpen) return null;

  const themesList = Object.values(THEMES);
  const scoreLimits = [5, 11, 21];
  const difficulties = [
    { id: 'EASY', label: 'EASY', desc: 'Slow tracking, high error rate' },
    { id: 'MEDIUM', label: 'MEDIUM', desc: 'Balanced reflex & aim' },
    { id: 'HARD', label: 'HARD', desc: 'Sub-step trajectory prediction' },
    { id: 'IMPOSSIBLE', label: 'IMPOSSIBLE', desc: 'Instant raycast solver' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-cyber-cyan/30 p-6 flex flex-col gap-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/50 flex items-center justify-center">
              <Palette className="w-4 h-4 text-cyber-cyan" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                ENGINE_CONFIG
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Visual Themes, Gameplay & Physics Parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setting Groups */}
        <div className="flex flex-col gap-4 font-mono text-xs max-h-[65vh] overflow-y-auto pr-1">
          {/* 1. Visual Theme */}
          <div className="flex flex-col gap-2">
            <span className="text-slate-300 font-bold flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-cyber-cyan" />
              CYBER THEME
            </span>
            <div className="grid grid-cols-2 gap-2">
              {themesList.map((t) => {
                const isActive = theme.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isActive
                        ? 'border-cyber-cyan bg-cyber-cyan/15 text-white font-bold shadow-glow-cyan'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: t.p1Color }}
                      />
                      <span>{t.name}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-cyber-cyan" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Score Limit */}
          <div className="flex flex-col gap-2">
            <span className="text-slate-300 font-bold flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-cyber-gold" />
              VICTORY SCORE LIMIT
            </span>
            <div className="grid grid-cols-3 gap-2">
              {scoreLimits.map((limit) => (
                <button
                  key={limit}
                  onClick={() => setScoreLimit(limit)}
                  className={`py-2 rounded-xl border text-center transition-all ${
                    scoreLimit === limit
                      ? 'border-cyber-gold bg-cyber-gold/15 text-cyber-gold font-bold shadow-glow-gold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {limit} POINTS
                </button>
              ))}
            </div>
          </div>

          {/* 3. AI Difficulty */}
          <div className="flex flex-col gap-2">
            <span className="text-slate-300 font-bold flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              AI BOT ALGORITHM
            </span>
            <div className="grid grid-cols-2 gap-2">
              {difficulties.map((diff) => {
                const isActive = aiDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    onClick={() => setAiDifficulty(diff.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-500/15 text-white font-bold shadow-glow-emerald'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{diff.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5 font-normal">
                      {diff.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Display & Audio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            {/* CRT Toggle */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-cyber-cyan" />
                <span>CRT SCANLINES</span>
              </div>
              <input
                type="checkbox"
                checked={isCRTEnabled}
                onChange={(e) => setIsCRTEnabled(e.target.checked)}
                className="w-4 h-4 accent-cyber-cyan cursor-pointer rounded"
              />
            </div>

            {/* Volume Slider */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyber-gold" />
                  MASTER VOLUME
                </span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-cyber-gold cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-cyber-cyan hover:bg-sky-400 text-slate-950 font-black rounded-xl uppercase tracking-wider transition-all shadow-glow-cyan"
        >
          CONFIRM & APPLY
        </button>
      </div>
    </div>
  );
}
