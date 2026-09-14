import React from 'react';
import { useGameState } from '../../context/GameStateContext';
import { formatTime } from '../../utils/puzzleEngine';
import { Trophy, CheckCircle, RotateCcw } from 'lucide-react';

export default function VictoryModal() {
  const { gameState, resetGame } = useGameState();

  if (gameState.phase < 4) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-container-low border-2 border-tertiary/60 rounded-2xl shadow-[0_0_50px_rgba(123,219,128,0.3)] max-w-lg w-full p-space-lg text-center space-y-space-md relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-tertiary/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-16 h-16 rounded-full bg-tertiary/20 border-2 border-tertiary mx-auto flex items-center justify-center text-tertiary shadow-[0_0_20px_rgba(123,219,128,0.5)] animate-bounce">
          <Trophy size={32} />
        </div>

        <div className="space-y-1">
          <span className="font-label-caps text-label-caps text-tertiary uppercase tracking-widest">
            FACILITY LOCK OVERRIDDEN // CO-OP ESCAPE VERIFIED
          </span>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold">
            CHAMBER PURGED
          </h2>
          <p className="text-on-surface-variant font-body-md text-body-md">
            Both operatives synchronized their respective quantum conduits with sub-millisecond precision. The orbital core has returned to stable equilibrium.
          </p>
        </div>

        {/* Mission Telemetry Summary */}
        <div className="grid grid-cols-2 gap-space-sm bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/30 text-left">
          <div>
            <span className="font-label-caps text-label-caps text-outline">REMAINING WINDOW:</span>
            <div className="font-telemetry-lg text-telemetry-lg text-tertiary font-bold">
              {formatTime(gameState.countdownSeconds)}
            </div>
          </div>
          <div>
            <span className="font-label-caps text-label-caps text-outline">SYNC LOCK DELTA:</span>
            <div className="font-telemetry-lg text-telemetry-lg text-primary font-bold">
              100.0% // MATCHED
            </div>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="w-full py-space-sm bg-tertiary hover:bg-tertiary-container text-on-tertiary-fixed font-label-caps text-label-caps uppercase font-bold tracking-widest rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-tertiary/25 transition-all active:scale-98"
        >
          <RotateCcw size={16} />
          RE-INITIALIZE TEST CHAMBER
        </button>
      </div>
    </div>
  );
}
