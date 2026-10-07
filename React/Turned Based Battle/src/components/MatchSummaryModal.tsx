import React, { useEffect } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Trophy, Skull, RotateCcw, Swords, ShieldAlert, Zap, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CombatGameState } from '../types/combat';

interface MatchSummaryModalProps {
  open: boolean;
  gameState: CombatGameState | null;
  onRematch: () => void;
  onNewMatch: () => void;
}

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({
  open,
  gameState,
  onRematch,
  onNewMatch,
}) => {
  const isWinner = gameState?.winnerId === gameState?.playerFighter.id;
  const isDraw = gameState?.winnerId === 'DRAW';

  useEffect(() => {
    if (open && isWinner) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF5722', '#F97316', '#FBBF24', '#DC2626'],
        });
      } catch (e) {
        // ignore if confetti fails
      }
    }
  }, [open, isWinner]);

  if (!gameState || !open) return null;

  const stats = gameState.matchStats || {
    totalRounds: gameState.roundNumber,
    playerDamageDealt: 0,
    enemyDamageDealt: 0,
    playerCrits: 0,
    staggerBreaks: 0,
    mvpAbility: 'Inferno Strike',
  };

  return (
    <Dialog
      open={open}
      title={isDraw ? 'CALDERA STALEMATE' : isWinner ? 'VICTORY ACHIEVED' : 'MISSION COMPROMISED'}
      description="Engagement concluded. Telemetry audit recorded in authoritative ledger."
      className={
        isWinner
          ? 'border-solar-gold shadow-[0_0_60px_rgba(251,191,36,0.35)]'
          : 'border-crimson-heat shadow-[0_0_60px_rgba(220,38,38,0.35)]'
      }
    >
      <div className="flex flex-col items-center gap-4">
        {/* Victory / Defeat Emblem */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
            isWinner
              ? 'bg-solar-gold/20 border-solar-gold text-solar-gold shadow-[0_0_30px_rgba(251,191,36,0.6)]'
              : isDraw
              ? 'bg-magma-800 border-magma-600 text-text-muted'
              : 'bg-crimson-heat/20 border-crimson-heat text-crimson-heat shadow-[0_0_30px_rgba(220,38,38,0.6)]'
          }`}
        >
          {isWinner ? <Trophy className="w-10 h-10 animate-bounce" /> : <Skull className="w-10 h-10" />}
        </div>

        <div className="text-center">
          <h2
            className={`font-rajdhani text-3xl font-black tracking-widest ${
              isWinner ? 'text-solar-gold' : isDraw ? 'text-text-primary' : 'text-crimson-heat'
            }`}
          >
            {isWinner ? 'TACTICAL TRIUMPH' : isDraw ? 'MUTUAL MELTDOWN' : 'CHASSIS DESTROYED'}
          </h2>
          <p className="font-chakra text-xs text-text-muted mt-1">
            {isWinner
              ? `Pilot ${gameState.playerFighter.name} successfully neutralized hostile unit.`
              : 'Hull integrity reached zero. Ejection pod deployed.'}
          </p>
        </div>

        {/* Match Statistics Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-2">
          <div className="p-2.5 rounded bg-magma-950 border border-magma-800 flex flex-col items-center text-center">
            <span className="font-mono text-[10px] text-text-muted uppercase">TOTAL ROUNDS</span>
            <span className="font-rajdhani text-xl font-bold text-solar-gold">
              {stats.totalRounds}
            </span>
          </div>

          <div className="p-2.5 rounded bg-magma-950 border border-magma-800 flex flex-col items-center text-center">
            <span className="font-mono text-[10px] text-text-muted uppercase">DAMAGE INFLICTED</span>
            <span className="font-rajdhani text-xl font-bold text-emerald-400">
              {stats.playerDamageDealt}
            </span>
          </div>

          <div className="p-2.5 rounded bg-magma-950 border border-magma-800 flex flex-col items-center text-center">
            <span className="font-mono text-[10px] text-text-muted uppercase">DAMAGE SUSTAINED</span>
            <span className="font-rajdhani text-xl font-bold text-red-400">
              {stats.enemyDamageDealt}
            </span>
          </div>

          <div className="p-2.5 rounded bg-magma-950 border border-magma-800 flex flex-col items-center text-center">
            <span className="font-mono text-[10px] text-text-muted uppercase">CRITICAL HITS</span>
            <span className="font-rajdhani text-xl font-bold text-solar-gold">
              {stats.playerCrits}
            </span>
          </div>

          <div className="p-2.5 rounded bg-magma-950 border border-magma-800 flex flex-col items-center text-center">
            <span className="font-mono text-[10px] text-text-muted uppercase">GUARD BREAKS</span>
            <span className="font-rajdhani text-xl font-bold text-amber-500">
              {stats.staggerBreaks}
            </span>
          </div>

          <div className="p-2.5 rounded bg-magma-950 border border-magma-800 flex flex-col items-center text-center">
            <span className="font-mono text-[10px] text-text-muted uppercase">MVP ABILITY</span>
            <span className="font-rajdhani text-sm font-bold text-cooling-cyan truncate w-full">
              {stats.mvpAbility || 'Inferno Strike'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center justify-between gap-3 pt-2 border-t border-magma-800">
          <Button variant="secondary" size="md" onClick={onNewMatch} className="flex-1">
            RETURN TO LOBBY
          </Button>
          <Button variant="solar" size="md" onClick={onRematch} className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4 text-magma-950" />
            <span>REMATCH NOW</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
