import React from 'react';
import {
  Camera,
  RotateCcw,
  Volume2,
  VolumeX,
  Binary,
  Users,
  Bot,
  Radio,
} from 'lucide-react';

export const ControlsBar = ({
  gameMode = 'LOCAL', // 'LOCAL' | 'AI' | 'PEER'
  onSelectMode,
  onResetGame,
  onResetCamera,
  soundEnabled = true,
  onToggleSound,
  inspectorOpen = false,
  onToggleInspector,
  peerCount = 1,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 p-3 sm:p-4 rounded-2xl glass-panel border border-white/10 w-full max-w-4xl mx-auto shadow-2xl">
      {/* Game Mode Selector Buttons */}
      <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
        <button
          onClick={() => onSelectMode('LOCAL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-space font-medium transition-all ${
            gameMode === 'LOCAL'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Local 2P</span>
        </button>

        <button
          onClick={() => onSelectMode('AI')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-space font-medium transition-all ${
            gameMode === 'AI'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Vs AI</span>
        </button>

        <button
          onClick={() => onSelectMode('PEER')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-space font-medium transition-all ${
            gameMode === 'PEER'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${gameMode === 'PEER' ? 'animate-pulse' : ''}`} />
          <span className="hidden xs:inline">P2P Multi-Tab</span>
          {gameMode === 'PEER' && (
            <span className="text-[10px] font-mono px-1 rounded bg-emerald-500/30 text-emerald-200">
              {peerCount}
            </span>
          )}
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Bitboard Inspector Toggle */}
        <button
          onClick={onToggleInspector}
          title="Toggle 9-Bit Bitboard Inspector"
          className={`p-2.5 rounded-xl border text-xs flex items-center gap-1.5 font-mono transition-all ${
            inspectorOpen
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
        >
          <Binary className="w-4 h-4" />
          <span className="hidden md:inline">Bitboard $O(1)$</span>
        </button>

        {/* Reset Camera View */}
        <button
          onClick={onResetCamera}
          title="Reset Camera Viewport"
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Reset / New Match */}
        <button
          onClick={onResetGame}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-bold text-xs tracking-wider transition-all transform active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>
    </div>
  );
};
