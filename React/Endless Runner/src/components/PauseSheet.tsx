import React from 'react';
import { GameSettings } from '../types/game';
import { X, Volume2, RotateCcw, Play, Eye, Activity, Sliders } from 'lucide-react';

interface PauseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: () => void;
  onRestart: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
}

export const PauseSheet: React.FC<PauseSheetProps> = ({
  isOpen,
  onClose,
  onResume,
  onRestart,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full glass-panel border-l border-neon-cyan/30 p-6 flex flex-col justify-between overflow-y-auto">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-neon-cyan" />
              <h2 className="font-orbitron font-bold text-xl text-white tracking-wider">
                PAUSE & SETTINGS
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3 my-6">
            <button
              onClick={onResume}
              className="py-3 px-4 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 text-slate-950 font-orbitron font-bold flex items-center justify-center gap-2 shadow-lg shadow-neon-cyan/30 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> RESUME
            </button>
            <button
              onClick={onRestart}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-orbitron font-bold flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> RESTART
            </button>
          </div>

          {/* Audio Sliders */}
          <div className="space-y-5">
            <div className="text-xs font-orbitron text-neon-cyan uppercase tracking-wider font-semibold">
              Audio Systems
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-slate-400" /> Master Volume
                </span>
                <span className="font-orbitron text-slate-200">{settings.masterVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.masterVolume}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, masterVolume: parseInt(e.target.value, 10) })
                }
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-300">SFX Volume</span>
                <span className="font-orbitron text-slate-200">{settings.sfxVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.sfxVolume}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, sfxVolume: parseInt(e.target.value, 10) })
                }
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neon-magenta"
              />
            </div>

            {/* Visual Dynamics Sliders */}
            <div className="text-xs font-orbitron text-neon-cyan uppercase tracking-wider font-semibold pt-4">
              Motion Dynamics
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-300">Camera Tilt Sensitivity</span>
                <span className="font-orbitron text-slate-200">{settings.cameraTilt}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.cameraTilt}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, cameraTilt: parseInt(e.target.value, 10) })
                }
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-300">Screen Shake Feedback</span>
                <span className="font-orbitron text-slate-200">{settings.screenShake}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.screenShake}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, screenShake: parseInt(e.target.value, 10) })
                }
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
              />
            </div>

            {/* Toggles */}
            <div className="pt-4 space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-neon-cyan" /> Ghost Hologram
                </span>
                <input
                  type="checkbox"
                  checked={settings.showGhost}
                  onChange={(e) => onUpdateSettings({ ...settings, showGhost: e.target.checked })}
                  className="w-4 h-4 rounded text-neon-cyan accent-neon-cyan cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-neon-magenta" /> Debug Hitboxes
                </span>
                <input
                  type="checkbox"
                  checked={settings.showHitboxes}
                  onChange={(e) => onUpdateSettings({ ...settings, showHitboxes: e.target.checked })}
                  className="w-4 h-4 rounded text-neon-magenta accent-neon-magenta cursor-pointer"
                />
              </label>
            </div>

            {/* Keybinding Reference Card */}
            <div className="pt-4">
              <div className="text-xs font-orbitron text-slate-400 uppercase tracking-wider mb-2">
                Universal Controls
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                  <span className="text-slate-400">Lane Switch:</span>
                  <span className="font-mono text-neon-cyan">A / D or ◄ ►</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                  <span className="text-slate-400">Jump:</span>
                  <span className="font-mono text-neon-cyan">W / ▲ / SPACE</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                  <span className="text-slate-400">Slide / Duck:</span>
                  <span className="font-mono text-neon-cyan">S / ▼</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                  <span className="text-slate-400">Overdrive:</span>
                  <span className="font-mono text-neon-magenta">SHIFT / E</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center text-xs text-slate-500">
          NEON SLIPSTREAM v1.0.0 // 60Hz Authoritative Engine
        </div>
      </div>
    </div>
  );
};
