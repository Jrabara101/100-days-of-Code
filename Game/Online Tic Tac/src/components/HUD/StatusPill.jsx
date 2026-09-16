import React from 'react';
import { ShieldAlert, Crosshair, Sparkles, Radio } from 'lucide-react';

export const StatusPill = ({ currentTurn, status, hoveredCell, gameMode, peerCount }) => {
  const isX = currentTurn === 'X';

  const formatHoverCoord = (cellIndex) => {
    if (cellIndex === null || cellIndex === undefined) return null;
    const r = Math.floor(cellIndex / 3);
    const c = cellIndex % 3;
    const bitVal = 1 << cellIndex;
    return `R:${r} C:${c} | Bit: 1<<${cellIndex} (${bitVal})`;
  };

  return (
    <header className="flex flex-col items-center justify-center gap-2.5 pointer-events-none">
      {/* Title & Cyber Header */}
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-white/10 pointer-events-auto">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <span className="font-orbitron font-extrabold text-sm sm:text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-200 to-pink-500">
          CYBER-TTT 3D
        </span>
        <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
          BABYLON.JS + BITBOARD
        </span>

        {gameMode === 'PEER' && (
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 pl-1 border-l border-white/10">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>TABS: {peerCount}</span>
          </div>
        )}
      </div>

      {/* Dynamic Status Pill */}
      <div className="flex items-center gap-3">
        {status === 'IN_PROGRESS' ? (
          <div
            className={`px-5 py-2 rounded-2xl glass-panel transition-all duration-300 flex items-center gap-2.5 pointer-events-auto ${
              isX ? 'glass-panel-glow-cyan' : 'glass-panel-glow-magenta'
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full animate-ping ${
                isX ? 'bg-cyan-400' : 'bg-pink-500'
              }`}
            />
            <span className="font-orbitron text-xs sm:text-sm font-bold tracking-wider text-white">
              CURRENT TURN:{' '}
              <span className={isX ? 'text-neon-cyan' : 'text-neon-magenta'}>
                PLAYER {currentTurn}
              </span>
            </span>
          </div>
        ) : status === 'WON' ? (
          <div className="px-5 py-2 rounded-2xl glass-panel glass-panel-glow-cyan flex items-center gap-2 text-emerald-300 pointer-events-auto">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-orbitron text-xs sm:text-sm font-bold tracking-wider">
              WIN CONDITION MET ($O(1)$)
            </span>
          </div>
        ) : (
          <div className="px-5 py-2 rounded-2xl glass-panel border border-amber-500/40 flex items-center gap-2 text-amber-300 pointer-events-auto">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="font-orbitron text-xs sm:text-sm font-bold tracking-wider">
              FULL GRID STALEMATE
            </span>
          </div>
        )}

        {/* Hover Coordinate Readout */}
        {hoveredCell !== null && hoveredCell !== undefined && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel border border-cyan-500/30 text-[11px] font-mono text-cyan-300 animate-in fade-in">
            <Crosshair className="w-3.5 h-3.5" />
            <span>{formatHoverCoord(hoveredCell)}</span>
          </div>
        )}
      </div>
    </header>
  );
};
