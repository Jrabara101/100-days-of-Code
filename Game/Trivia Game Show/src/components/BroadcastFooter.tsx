import React from 'react';
import { Terminal, Keyboard } from 'lucide-react';
import { FSMPhase } from '../engine/types';

interface BroadcastFooterProps {
  tierIndex: number;
  phase: FSMPhase;
}

export const BroadcastFooter: React.FC<BroadcastFooterProps> = ({ tierIndex, phase }) => {
  return (
    <footer className="w-full max-w-7xl mx-auto glass-panel p-3 rounded-2xl flex flex-wrap justify-between items-center text-xs text-slate-400 gap-3 border-purple-900/40">
      <div className="flex items-center gap-2">
        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
        <span>STAGE: <strong className="text-white font-mono">Tier {tierIndex + 1} of 10</strong></span>
        <span className="text-purple-700">|</span>
        <span>FSM PHASE: <strong className="text-cyan-300 font-arcade text-[9px]">{phase}</strong></span>
      </div>

      <div className="flex items-center gap-2 text-slate-400 font-crt text-sm">
        <Keyboard className="w-3.5 h-3.5 text-pink-400" />
        <span>HOTKEYS: [1-4] or [A-D] Answer • [Space] Advance Tier</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
        <span className="font-mono text-[11px] text-slate-400">CLOCK: ~16.6ms MONOTONIC</span>
      </div>
    </footer>
  );
};
