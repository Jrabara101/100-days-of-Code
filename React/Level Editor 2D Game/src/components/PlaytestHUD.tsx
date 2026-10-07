import React from 'react';
import { Play, RotateCcw, Timer, Trophy, Skull, X } from 'lucide-react';
import { Button } from './ui/index.js';

interface PlaytestHUDProps {
  elapsedMs: number;
  score: number;
  deathCount: number;
  onReset: () => void;
  onExit: () => void;
}

export const PlaytestHUD: React.FC<PlaytestHUDProps> = ({
  elapsedMs,
  score,
  deathCount,
  onReset,
  onExit,
}) => {
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const centi = Math.floor((ms % 1000) / 10);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${centi
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-x-0 top-3 pointer-events-none flex flex-col items-center gap-2 z-40 select-none">
      {/* Top Floating Glass Telemetry Bar */}
      <div className="pointer-events-auto bg-[#121620]/90 backdrop-blur-md border border-emerald-500/50 shadow-glowEmerald rounded-full px-5 py-2 flex items-center gap-5 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>FLIGHT CHECK ACTIVE</span>
        </div>

        <div className="h-4 w-px bg-[#222B3D]" />

        {/* Stopwatch */}
        <div className="flex items-center gap-1.5 text-white">
          <Timer className="w-3.5 h-3.5 text-cyan-400" />
          <span>{formatTime(elapsedMs)}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 text-amber-400">
          <Trophy className="w-3.5 h-3.5" />
          <span>{score} PTS</span>
        </div>

        {/* Deaths */}
        <div className="flex items-center gap-1.5 text-rose-400">
          <Skull className="w-3.5 h-3.5" />
          <span>{deathCount}</span>
        </div>

        <div className="h-4 w-px bg-[#222B3D]" />

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[#94A3B8] hover:text-amber-400 transition-colors"
          title="Respawn Player [R]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset [R]</span>
        </button>

        {/* Exit */}
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-[#94A3B8] hover:text-rose-400 transition-colors"
          title="Exit to Editor [Space]"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit [Space]</span>
        </button>
      </div>

      {/* Controls helper pill */}
      <div className="bg-[#0A0C10]/80 backdrop-blur-sm border border-[#222B3D] rounded-full px-3 py-1 text-[11px] font-mono text-[#94A3B8]">
        [A/D] Run • [Space/W] Jump • [S] Drop Through • [Space] Stop Flight Check
      </div>
    </div>
  );
};
