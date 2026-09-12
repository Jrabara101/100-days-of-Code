import React from 'react';
import { WIN_MASKS } from '../../engine/BitboardEngine';
import { Binary, CheckCircle2 } from 'lucide-react';

export const BitboardInspector = ({ mx = 0, mo = 0, winningMask = null, isOpen = false, onClose }) => {
  if (!isOpen) return null;

  const binX = mx.toString(2).padStart(9, '0');
  const binO = mo.toString(2).padStart(9, '0');
  const occupied = (mx | mo).toString(2).padStart(9, '0');

  return (
    <div className="absolute top-20 right-4 sm:right-6 w-80 sm:w-96 rounded-2xl glass-panel p-5 z-40 border border-cyan-500/30 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm tracking-wider">
          <Binary className="w-4 h-4" />
          BITBOARD FSM KERNEL ($O(1)$)
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="mt-3.5 space-y-3 font-mono">
        {/* Bitboard register states */}
        <div className="space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-cyan-400 font-bold">M_X (9-bit):</span>
            <span className="text-cyan-300 tracking-widest">{binX} (dec: {mx})</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-pink-400 font-bold">M_O (9-bit):</span>
            <span className="text-pink-300 tracking-widest">{binO} (dec: {mo})</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-white/5">
            <span>Occupied (M_X | M_O):</span>
            <span className="text-amber-300 tracking-widest">{occupied}</span>
          </div>
        </div>

        {/* 3x3 Mini Bitboard Grid Visualization */}
        <div>
          <div className="text-[11px] text-slate-400 mb-1.5 font-space">3x3 Bit Positioning [1 &lt;&lt; index]:</div>
          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-black/50 border border-white/5 max-w-[200px] mx-auto text-center">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
              const bit = 1 << idx;
              const isX = (mx & bit) !== 0;
              const isO = (mo & bit) !== 0;
              return (
                <div
                  key={idx}
                  className={`h-9 rounded-lg flex flex-col items-center justify-center border font-bold transition-colors ${
                    isX
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                      : isO
                      ? 'bg-pink-950/80 border-pink-400 text-pink-300 shadow-[0_0_8px_rgba(255,0,127,0.4)]'
                      : 'bg-white/5 border-white/10 text-slate-500'
                  }`}
                >
                  <span className="text-xs">{isX ? 'X' : isO ? 'O' : idx}</span>
                  <span className="text-[8px] opacity-60">2^{idx}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Winning Masks O(1) matching evaluation */}
        <div>
          <div className="text-[11px] text-slate-400 mb-1.5 font-space">Win Masks Evaluator: (M &amp; w) == w</div>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
            {WIN_MASKS.map((w) => {
              const matchesX = (mx & w.mask) === w.mask;
              const matchesO = (mo & w.mask) === w.mask;
              const isWinning = winningMask === w.mask;

              return (
                <div
                  key={w.mask}
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-[10px] ${
                    isWinning
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                      : 'bg-white/[0.02] border-white/5 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isWinning && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    <span>{w.name}</span>
                    <span className="text-slate-500">[{w.indices.join(',')}]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">mask: {w.mask}</span>
                    {matchesX && <span className="px-1 rounded bg-cyan-900 text-cyan-300 font-bold">X WIN</span>}
                    {matchesO && <span className="px-1 rounded bg-pink-900 text-pink-300 font-bold">O WIN</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
