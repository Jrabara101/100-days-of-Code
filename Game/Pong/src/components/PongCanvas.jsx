import React from 'react';

export function PongCanvas({
  canvasRef,
  screenShake,
  matchState,
  winner,
  onRestart,
  theme
}) {
  return (
    <div className="relative w-full max-w-4xl aspect-[16/10] sm:aspect-[16/10] flex items-center justify-center p-2">
      {/* Outer Glow Border Frame */}
      <div
        className={`w-full h-full rounded-2xl overflow-hidden glass-panel border-2 relative transition-transform ${
          screenShake ? 'screen-shake' : ''
        }`}
        style={{
          borderColor: theme.accent,
          boxShadow: `0 0 35px ${theme.p1Glow}, 0 0 15px ${theme.p2Glow}`
        }}
      >
        {/* The Game Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-full object-contain block bg-slate-950"
        />

        {/* Victory / Game Over Overlay */}
        {matchState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-20 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center font-mono">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">
                MATCH CONCLUDED
              </span>
              <h2
                className="text-3xl sm:text-4xl font-display font-black tracking-wide uppercase drop-shadow-lg"
                style={{ color: winner === 1 ? theme.p1Color : theme.p2Color }}
              >
                {winner === 1 ? 'PLAYER 1 (LEFT)' : 'PLAYER 2 (RIGHT)'} VICTORIOUS!
              </h2>
            </div>

            <button
              onClick={onRestart}
              className="px-6 py-3 bg-cyber-cyan hover:bg-sky-400 text-slate-950 font-black font-mono rounded-xl uppercase tracking-wider transition-all shadow-glow-cyan hover:scale-105 active:scale-95"
            >
              PLAY REMATCH [SPACE]
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
