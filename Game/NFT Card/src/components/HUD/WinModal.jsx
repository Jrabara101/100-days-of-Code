import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Zap, Sparkles } from 'lucide-react';

export const WinModal = ({ status, winner, winningIndices, onRematch }) => {
  if (status !== 'WON' && status !== 'DRAW') return null;

  useEffect(() => {
    if (status === 'WON') {
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const colors = winner === 'X' ? ['#00f0ff', '#38bdf8', '#0284c7'] : ['#ff007f', '#f43f5e', '#ec4899'];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [status, winner]);

  const isX = winner === 'X';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className={`relative w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel text-center border overflow-hidden shadow-2xl transition-all scale-100 ${
          status === 'WON'
            ? isX
              ? 'glass-panel-glow-cyan border-cyan-400/50'
              : 'glass-panel-glow-magenta border-pink-400/50'
            : 'border-white/20'
        }`}
      >
        {/* Neon laser beam decorative header banner */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            status === 'WON' ? (isX ? 'bg-cyan-400 shadow-[0_0_15px_#00f0ff]' : 'bg-pink-500 shadow-[0_0_15px_#ff007f]') : 'bg-amber-400'
          }`}
        />

        {status === 'WON' ? (
          <>
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white/5 border border-white/10 shadow-inner">
              <Trophy className={`w-9 h-9 ${isX ? 'text-neon-cyan' : 'text-neon-magenta'}`} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-slate-300 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Laser Strike Connect: Cells [{winningIndices?.join(', ')}]
            </div>

            <h2 className="font-orbitron font-black text-3xl sm:text-4xl tracking-wide mb-2 text-white">
              PLAYER <span className={isX ? 'text-neon-cyan' : 'text-neon-magenta'}>{winner}</span> WINS!
            </h2>

            <p className="text-slate-300 text-sm font-space mb-6">
              Bitboard verification complete in <span className="font-mono text-cyan-400 font-bold">O(1)</span>. High-energy neon laser line projected across grid centroids.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white/5 border border-white/10 shadow-inner">
              <Sparkles className="w-9 h-9 text-amber-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-amber-950/60 border border-amber-500/30 text-amber-300 mb-2">
              Gridlock 511 Masks Full
            </div>

            <h2 className="font-orbitron font-black text-3xl sm:text-4xl tracking-wide mb-2 text-white">
              STALEMATE DRAW
            </h2>

            <p className="text-slate-300 text-sm font-space mb-6">
              All 9 grid colliders occupied. Zero winning bitboard masks satisfied.
            </p>
          </>
        )}

        <button
          onClick={onRematch}
          className={`w-full py-4 px-6 rounded-2xl font-orbitron font-bold text-base tracking-wider flex items-center justify-center gap-2.5 transition-all transform active:scale-95 shadow-lg ${
            status === 'WON'
              ? isX
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/30'
                : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-400 hover:to-rose-500 shadow-pink-500/30'
              : 'bg-gradient-to-r from-amber-500 to-orange-600 text-black hover:from-amber-400 hover:to-orange-500 shadow-amber-500/30'
          }`}
        >
          <RefreshCw className="w-5 h-5 animate-spin-reverse" />
          START REMATCH
        </button>
      </div>
    </div>
  );
};
