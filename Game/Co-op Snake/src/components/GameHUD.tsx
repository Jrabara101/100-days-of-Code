import React from 'react';
import type { TelemetryData } from '../engine/types';
import { Volume2, VolumeX, Pause, Play, Settings, Zap, Heart, Activity, Swords, Users } from 'lucide-react';
import { globalAudio } from '../engine/AudioEngine';

interface GameHUDProps {
  telemetry: TelemetryData;
  isPaused: boolean;
  soundEnabled: boolean;
  onTogglePause: () => void;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onToggleTelemetry: () => void;
  showTelemetry: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  telemetry,
  isPaused,
  soundEnabled,
  onTogglePause,
  onToggleSound,
  onOpenSettings,
  onToggleTelemetry,
  showTelemetry,
}) => {
  const isP2Ai = telemetry.opponentMode !== 'HUMAN_P2';
  const isVersus = telemetry.opponentMode === 'AI_ENEMY';

  const getDifficultyBadgeColor = () => {
    switch (telemetry.aiDifficulty) {
      case 'EASY':
        return 'bg-[#00ff66] text-black';
      case 'NORMAL':
        return 'bg-[#ffea00] text-black';
      case 'HARD':
        return 'bg-[#ff0033] text-white';
      case 'EXPERT':
        return 'bg-[#bd00ff] text-white animate-pulse';
    }
  };

  return (
    <header className="w-full flex flex-col md:flex-row items-center justify-between brutal-border bg-[#ffea00] brutal-shadow px-4 sm:px-6 py-3.5 gap-4">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-black text-[#ffea00] flex items-center justify-center brutal-border-2 brutal-shadow-sm font-display text-xl">
          ⚡
        </div>
        <div>
          <h1 className="text-black text-2xl sm:text-3xl lg:text-4xl font-display leading-none tracking-tight">
            NEON_SNAKE.OS
          </h1>
          <div className="flex items-center gap-2 text-[11px] font-mono-code font-bold tracking-wider text-black/80 mt-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#00ff66] animate-pulse"></span>
            <span>
              {isVersus
                ? `VERSUS AI ENEMY [${telemetry.aiDifficulty}]`
                : telemetry.opponentMode === 'AI_COOP'
                ? `CO-OP AI COMPANION [${telemetry.aiDifficulty}]`
                : 'LOCAL 2P CO-OP ENGINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry & Stats Badges */}
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 sm:gap-4 font-display text-sm sm:text-base">
        {/* Mode Tag */}
        <button
          onClick={onOpenSettings}
          title="Change Game Mode & AI Difficulty"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-black text-white text-xs brutal-border-2 brutal-shadow-sm hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {isVersus ? <Swords className="w-3.5 h-3.5 text-[#ff0033]" /> : <Users className="w-3.5 h-3.5 text-[#00ff66]" />}
          <span>{isVersus ? 'RIVAL AI' : isP2Ai ? 'CO-OP BOT' : '2P LOCAL'}</span>
        </button>

        {/* P1 Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 brutal-border brutal-shadow-sm transition-all ${
            telemetry.p1Status === 'DOWNED'
              ? 'bg-[#ff0033] text-white animate-pulse'
              : telemetry.p1Status === 'GHOST'
              ? 'bg-[#bd00ff] text-white'
              : 'bg-white text-black'
          }`}
        >
          <span className="w-3.5 h-3.5 bg-[#0055ff] inline-block brutal-border-2"></span>
          <span>P1:{telemetry.p1Length.toString().padStart(3, '0')}</span>
          {isVersus && <span className="text-xs font-mono-code bg-black text-[#00f0ff] px-1 font-bold">{telemetry.p1Score}</span>}
        </div>

        {/* P2 / AI Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 brutal-border brutal-shadow-sm transition-all ${
            telemetry.p2Status === 'DOWNED'
              ? 'bg-[#ff0033] text-white animate-pulse'
              : telemetry.p2Status === 'GHOST'
              ? 'bg-[#bd00ff] text-white'
              : 'bg-white text-black'
          }`}
        >
          <span className="w-3.5 h-3.5 bg-[#ff0033] inline-block brutal-border-2"></span>
          <span>{isP2Ai ? 'BOT' : 'P2'}:{telemetry.p2Length.toString().padStart(3, '0')}</span>
          {isP2Ai && (
            <span className={`text-[10px] font-mono-code px-1.5 py-0.5 brutal-border-2 ${getDifficultyBadgeColor()}`}>
              {telemetry.aiDifficulty}
            </span>
          )}
          {isVersus && <span className="text-xs font-mono-code bg-black text-[#ffea00] px-1 font-bold">{telemetry.p2Score}</span>}
        </div>

        {/* Combo Multiplier Meter */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 brutal-border brutal-shadow-sm transition-all ${
            telemetry.combo > 1.0
              ? 'bg-[#00ff66] text-black scale-105 animate-combo-pulse'
              : 'bg-white text-black'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>COMBO x{telemetry.combo.toFixed(1)}</span>
          {telemetry.combo > 1.0 && (
            <div className="w-8 h-2 bg-black/20 overflow-hidden brutal-border-2">
              <div
                className="h-full bg-black transition-all duration-75"
                style={{ width: `${Math.round(telemetry.comboTimer * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Shared Lives Block (in Co-op mode) */}
        {!isVersus && (
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 brutal-border brutal-shadow-sm">
            <Heart className="w-4 h-4 text-[#ff0033] fill-[#ff0033]" />
            <div className="flex gap-1">
              {Array.from({ length: telemetry.maxLives }).map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 brutal-border-2 transition-colors ${
                    i < telemetry.lives ? 'bg-[#ff0033]' : 'bg-[#e5e5e5]'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Score Display */}
        <div className="flex items-center justify-center brutal-border h-11 px-5 bg-[#0055ff] text-white font-display text-xl sm:text-2xl brutal-shadow-sm">
          <span>{telemetry.score.toLocaleString()}</span>
        </div>

        {/* Utility Buttons */}
        <div className="flex items-center gap-2">
          {/* Telemetry Inspector Toggle */}
          <button
            onClick={() => {
              globalAudio.playClick();
              onToggleTelemetry();
            }}
            title="Toggle Staff Architect Telemetry"
            className={`p-2 brutal-border brutal-shadow-sm transition-colors cursor-pointer ${
              showTelemetry ? 'bg-black text-[#ffea00]' : 'bg-white text-black hover:bg-[#e5e5e5]'
            }`}
          >
            <Activity className="w-5 h-5" />
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={() => {
              globalAudio.playClick();
              onToggleSound();
            }}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
            className="p-2 bg-white text-black brutal-border brutal-shadow-sm hover:bg-[#e5e5e5] transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-[#ff0033]" />}
          </button>

          {/* Pause / Resume */}
          <button
            onClick={() => {
              globalAudio.playClick();
              onTogglePause();
            }}
            title={isPaused ? 'Resume Game' : 'Pause Game'}
            className="p-2 bg-white text-black brutal-border brutal-shadow-sm hover:bg-[#e5e5e5] transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              globalAudio.playClick();
              onOpenSettings();
            }}
            title="Engine Settings"
            className="p-2 bg-white text-black brutal-border brutal-shadow-sm hover:bg-[#e5e5e5] transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
