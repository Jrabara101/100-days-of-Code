import React from 'react';
import { Play, RotateCcw, Keyboard } from 'lucide-react';

export function FooterBar({
  gameMode,
  role,
  matchState,
  onRestart,
  onOpenSignaling
}) {
  return (
    <footer className="fixed bottom-0 left-0 w-full z-40 h-8 bg-surface-lowest/90 backdrop-blur-md border-t border-slate-800 px-4 md:px-6 flex items-center justify-between text-[11px] font-mono text-slate-400">
      {/* Left: Engine version & Mode */}
      <div className="flex items-center gap-3">
        <span className="text-slate-500 font-bold hidden sm:inline">PONG_OS_v2.04</span>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">MODE:</span>
          <strong className="text-cyber-cyan">{gameMode}</strong>
          {role && <span className="text-cyber-rose font-bold">[{role}]</span>}
        </div>
      </div>

      {/* Center: Controls Guidance */}
      <div className="flex items-center gap-2">
        <Keyboard className="w-3.5 h-3.5 text-cyber-cyan hidden sm:block" />
        {gameMode === 'LOCAL_2P' ? (
          <span>
            <strong className="text-cyber-cyan">P1: W / S</strong> &nbsp;|&nbsp;{' '}
            <strong className="text-cyber-rose">P2: ↑ / ↓</strong>
          </span>
        ) : gameMode === 'WEBRTC_P2P' && role === 'CLIENT' ? (
          <span>
            <strong className="text-cyber-rose">P2: W / S or ↑ / ↓</strong> (PREDICTION ACTIVE)
          </span>
        ) : (
          <span>
            <strong className="text-cyber-cyan">P1: W / S or ↑ / ↓</strong>
          </span>
        )}
      </div>

      {/* Right: Quick Action hints */}
      <div className="flex items-center gap-3">
        {matchState === 'READY' || matchState === 'GAME_OVER' ? (
          <button
            onClick={onRestart}
            className="flex items-center gap-1 text-cyber-cyan hover:text-white font-bold transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>[SPACE] SERVE</span>
          </button>
        ) : (
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE SIMULATION
          </span>
        )}
      </div>
    </footer>
  );
}
