import React from 'react';
import type { GameSettings, AiDifficulty, OpponentMode } from '../engine/types';
import { X, Sliders, Volume2, ShieldAlert, Cpu, Bot, Swords, Users, UserCheck } from 'lucide-react';
import { globalAudio } from '../engine/AudioEngine';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const difficulties: Array<{ id: AiDifficulty; label: string; desc: string; color: string }> = [
    {
      id: 'EASY',
      label: 'EASY',
      desc: 'Manhattan Greedy with 35% random wandering. Passive and prone to corners.',
      color: 'bg-[#00ff66] text-black',
    },
    {
      id: 'NORMAL',
      label: 'NORMAL',
      desc: 'BFS Shortest Path to nearest food with 1-step hazard evasion.',
      color: 'bg-[#ffea00] text-black',
    },
    {
      id: 'HARD',
      label: 'HARD',
      desc: 'Utility A* + Voronoi Space Flood-Fill (never enters dead-ends).',
      color: 'bg-[#ff0033] text-white',
    },
    {
      id: 'EXPERT',
      label: 'EXPERT',
      desc: 'Dual-Phase Safe A* + Tail-Following Cycles + Aggressive Interception.',
      color: 'bg-[#bd00ff] text-white',
    },
  ];

  const modes: Array<{ id: OpponentMode; label: string; icon: React.ReactNode; desc: string }> = [
    {
      id: 'AI_ENEMY',
      label: 'VERSUS AI ENEMY',
      icon: <Swords className="w-4 h-4 text-[#ff0033]" />,
      desc: 'P2 is an adversarial rival trying to trap you, steal food, and outlive you.',
    },
    {
      id: 'AI_COOP',
      label: 'CO-OP AI COMPANION',
      icon: <Users className="w-4 h-4 text-[#00ff66]" />,
      desc: 'P2 is a helpful partner that coordinates food combos and rescues you.',
    },
    {
      id: 'HUMAN_P2',
      label: 'LOCAL 2-PLAYER',
      icon: <UserCheck className="w-4 h-4 text-[#0055ff]" />,
      desc: 'P2 is controlled manually via Arrow Keys [↑][←][↓][→].',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex flex-col gap-5 brutal-border p-6 sm:p-8 bg-white brutal-shadow-lg max-w-[580px] w-full text-black max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black pb-3">
          <div className="flex items-center gap-2 font-display text-2xl">
            <Sliders className="w-6 h-6 stroke-[3]" />
            <h2>SYSTEM CONFIGURATION</h2>
          </div>
          <button
            onClick={() => {
              globalAudio.playClick();
              onClose();
            }}
            className="p-1.5 bg-[#ff0033] text-white brutal-border brutal-shadow-sm hover:bg-black transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Setting Groups */}
        <div className="flex flex-col gap-5 font-mono-code text-sm">
          {/* 1. Opponent Mode & AI Difficulty */}
          <div className="flex flex-col gap-3 bg-[#e5e5e5] p-3.5 brutal-border">
            <div className="flex items-center gap-2 font-display text-base">
              <Bot className="w-4 h-4 text-[#bd00ff]" />
              <h3>OPPONENT & AI ENGINE</h3>
            </div>

            {/* Mode Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-xs">OPPONENT CONTROL MODE:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onUpdateSettings({ opponentMode: m.id })}
                    className={`flex flex-col items-center justify-center p-2.5 brutal-border text-center transition-all cursor-pointer ${
                      settings.opponentMode === m.id
                        ? 'bg-black text-[#ffea00] brutal-shadow-sm scale-[1.02]'
                        : 'bg-white text-black hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-display text-xs">
                      {m.icon}
                      <span>{m.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Difficulty Selector (Visible when P2 is AI) */}
            {settings.opponentMode !== 'HUMAN_P2' && (
              <div className="flex flex-col gap-2 pt-2 border-t border-black/20">
                <span className="font-bold text-xs">AI DIFFICULTY LEVEL:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {difficulties.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onUpdateSettings({ aiDifficulty: d.id })}
                      className={`py-2 px-1 font-display text-xs brutal-border transition-all cursor-pointer ${
                        settings.aiDifficulty === d.id
                          ? `${d.color} brutal-shadow-sm scale-105`
                          : 'bg-white text-black hover:bg-neutral-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="bg-white p-2.5 brutal-border-2 text-xs text-black/80 font-bold">
                  {difficulties.find((d) => d.id === settings.aiDifficulty)?.desc}
                </div>
              </div>
            )}
          </div>

          {/* 2. Simulation Timing & Interpolation */}
          <div className="flex flex-col gap-2 bg-[#e5e5e5] p-3.5 brutal-border">
            <div className="flex items-center gap-2 font-display text-base">
              <Cpu className="w-4 h-4 text-[#0055ff]" />
              <h3>TIMING & RENDERING PIPELINE</h3>
            </div>

            {/* Sub-Pixel Interpolation Toggle */}
            <div className="flex items-center justify-between mt-1">
              <div>
                <span className="font-bold block">Sub-Pixel Interpolation (α-Lerp)</span>
                <span className="text-xs text-black/70">60-144 FPS smooth movement</span>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({ subpixelInterpolation: !settings.subpixelInterpolation })
                }
                className={`px-4 py-1.5 font-display text-xs brutal-border transition-colors cursor-pointer ${
                  settings.subpixelInterpolation ? 'bg-[#00ff66] text-black' : 'bg-white text-black'
                }`}
              >
                {settings.subpixelInterpolation ? 'ENABLED' : 'DISCRETE (10Hz)'}
              </button>
            </div>

            {/* Initial Tick Frequency */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/20">
              <div>
                <span className="font-bold block">Baseline Tick Speed</span>
                <span className="text-xs text-black/70">Fixed physics interval</span>
              </div>
              <div className="flex gap-1 font-display text-xs">
                {[8, 10, 13].map((hz) => (
                  <button
                    key={hz}
                    onClick={() => onUpdateSettings({ initialSpeedHz: hz })}
                    className={`px-2.5 py-1 brutal-border transition-colors cursor-pointer ${
                      settings.initialSpeedHz === hz ? 'bg-[#ffea00] text-black' : 'bg-white text-black'
                    }`}
                  >
                    {hz} Hz
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Co-op / Versus Rules */}
          <div className="flex flex-col gap-2 bg-[#e5e5e5] p-3.5 brutal-border">
            <div className="flex items-center gap-2 font-display text-base">
              <ShieldAlert className="w-4 h-4 text-[#ff0033]" />
              <h3>COLLISION MATRIX & RULES</h3>
            </div>

            {/* Friendly Pass-Through */}
            <div className="flex items-center justify-between mt-1">
              <div>
                <span className="font-bold block">Friendly Tail Pass-Through</span>
                <span className="text-xs text-black/70">Disable partner tail collisions</span>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({ friendlyPassThrough: !settings.friendlyPassThrough })
                }
                className={`px-4 py-1.5 font-display text-xs brutal-border transition-colors cursor-pointer ${
                  settings.friendlyPassThrough ? 'bg-[#00ff66] text-black' : 'bg-white text-black'
                }`}
              >
                {settings.friendlyPassThrough ? 'SAFE MODE' : 'HARDCORE'}
              </button>
            </div>

            {/* Shared Lives (for Co-op) */}
            {settings.opponentMode !== 'AI_ENEMY' && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/20">
                <div>
                  <span className="font-bold block">Shared Life Reserve</span>
                  <span className="text-xs text-black/70">Respawns before game over</span>
                </div>
                <div className="flex gap-1 font-display text-xs">
                  {[1, 3, 5].map((count) => (
                    <button
                      key={count}
                      onClick={() => onUpdateSettings({ sharedLives: count })}
                      className={`px-3 py-1 brutal-border transition-colors cursor-pointer ${
                        settings.sharedLives === count ? 'bg-[#ff0033] text-white' : 'bg-white text-black'
                      }`}
                    >
                      {count} {count === 1 ? 'LIFE' : 'LIVES'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Audio & Display */}
          <div className="flex flex-col gap-2 bg-[#e5e5e5] p-3.5 brutal-border">
            <div className="flex items-center gap-2 font-display text-base">
              <Volume2 className="w-4 h-4 text-[#bd00ff]" />
              <h3>AUDIO & DISPLAY</h3>
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="font-bold">Sound Effects Synth</span>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`px-4 py-1.5 font-display text-xs brutal-border transition-colors cursor-pointer ${
                  settings.soundEnabled ? 'bg-[#00ff66] text-black' : 'bg-white text-black'
                }`}
              >
                {settings.soundEnabled ? 'ON' : 'MUTED'}
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/20">
              <span className="font-bold">CRT Scanlines</span>
              <button
                onClick={() => onUpdateSettings({ retroScanlines: !settings.retroScanlines })}
                className={`px-4 py-1.5 font-display text-xs brutal-border transition-colors cursor-pointer ${
                  settings.retroScanlines ? 'bg-[#ffea00] text-black' : 'bg-white text-black'
                }`}
              >
                {settings.retroScanlines ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            globalAudio.playClick();
            onClose();
          }}
          className="flex w-full cursor-pointer items-center justify-center brutal-border h-12 bg-black text-white font-display text-lg hover:bg-[#ffea00] hover:text-black transition-colors brutal-shadow-hover mt-1"
        >
          CONFIRM & RETURN
        </button>
      </div>
    </div>
  );
};
