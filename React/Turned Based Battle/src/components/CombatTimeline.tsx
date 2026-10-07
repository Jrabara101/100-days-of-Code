import React from 'react';
import { CombatGameState } from '../types/combat';
import { Volume2, VolumeX, ShieldAlert, Zap, Radio } from 'lucide-react';
import { sound } from '../lib/audio';

interface CombatTimelineProps {
  gameState: CombatGameState | null;
  timeRemainingMs: number;
  onOpenCombatLog: () => void;
  onOpenLobby: () => void;
}

export const CombatTimeline: React.FC<CombatTimelineProps> = ({
  gameState,
  timeRemainingMs,
  onOpenCombatLog,
  onOpenLobby,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getMuted());

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const timerSeconds = Math.max(0, timeRemainingMs / 1000).toFixed(1);
  const timerPercentage = Math.min(100, Math.max(0, (timeRemainingMs / 15000) * 100));

  const isLowTime = timeRemainingMs <= 4000 && timeRemainingMs > 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-magma-900/90 backdrop-blur-xl border-b border-ember-orange/30 shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
      {/* Top Main Bar */}
      <div className="h-14 w-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Sector ID & Mode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-magma-850 border border-ember-orange/40 px-2.5 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-ember-orange animate-ping" />
            <span className="font-mono text-[10px] text-solar-gold font-bold uppercase tracking-widest">
              SECTOR-IX // VOLCANIC CALDERA
            </span>
          </div>

          {gameState && (
            <div className="hidden sm:flex items-center gap-2 border-l border-magma-700 pl-3">
              <span className="font-mono text-[11px] text-text-muted flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-ember-core" />
                ROOM: <span className="text-solar-gold font-bold">{gameState.roomCode}</span>
              </span>
              <span className="font-mono text-[11px] text-text-muted ml-2">
                MODE: <span className="text-cooling-cyan font-bold">{gameState.isPvP ? '1v1 DUEL' : 'AI TRAINING'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Center: Strategic Round & Overheat Countdown Timer */}
        <div className="flex flex-col items-center justify-center min-w-[200px] md:min-w-[320px]">
          <div className="flex items-center justify-between w-full px-1 mb-1 font-mono text-[10px] tracking-widest">
            <span className="text-ember-core uppercase font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-crimson-heat" />
              ROUND {gameState ? String(gameState.roundNumber).padStart(2, '0') : '01'}
            </span>
            <span
              className={`font-mono text-xs font-bold ${
                isLowTime ? 'text-crimson-heat animate-pulse' : 'text-solar-gold'
              }`}
            >
              {gameState?.phase === 'PLANNING_PHASE'
                ? `HEAT TICK ${timerSeconds}s`
                : gameState?.phase === 'RESOLVING_ACTIONS'
                ? 'CLASH RESOLUTION'
                : 'WAITING'}
            </span>
          </div>
          <div className="w-full h-2 bg-magma-950 rounded-sm overflow-hidden border border-magma-700 p-0.5 flex">
            <div
              className={`h-full rounded-sm transition-all duration-300 ${
                isLowTime
                  ? 'bg-gradient-to-r from-red-600 to-crimson-heat animate-pulse'
                  : 'bg-gradient-to-r from-ember-core via-ember-orange to-solar-gold shadow-[0_0_12px_rgba(249,115,22,0.8)]'
              }`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCombatLog}
            className="p-1.5 rounded bg-magma-850 border border-magma-700 text-text-muted hover:text-solar-gold hover:border-ember-orange transition-colors flex items-center gap-1.5 text-xs font-mono"
            title="Open Combat Telemetry Log"
          >
            <Zap className="w-4 h-4 text-solar-gold" />
            <span className="hidden md:inline">LOGS</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 rounded bg-magma-850 border border-magma-700 text-text-muted hover:text-solar-gold hover:border-ember-orange transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-solar-gold" />}
          </button>

          <button
            onClick={onOpenLobby}
            className="px-2.5 py-1 rounded bg-gradient-to-r from-ember-core to-ember-orange text-white font-rajdhani font-bold text-xs uppercase tracking-wider hover:brightness-110 border border-solar-gold/40 shadow-sm"
          >
            {gameState ? 'MATCH' : 'NEW DUEL'}
          </button>
        </div>
      </div>

      {/* Turn Rail Sub-HUD */}
      <div className="w-full px-4 lg:px-8 py-1.5 bg-magma-900/80 backdrop-blur-md border-b border-ember-orange/20 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="font-mono text-[10px] text-solar-gold font-bold tracking-wider uppercase flex items-center gap-1">
            INITIATIVE QUEUE:
          </span>

          {/* Player Turn Pip */}
          <div className="flex items-center gap-1.5 bg-magma-850 border border-solar-gold/60 px-2 py-0.5 rounded">
            <div className="w-4 h-4 rounded bg-ember-orange text-white flex items-center justify-center font-mono text-[9px] font-bold">
              P1
            </div>
            <span className="font-rajdhani font-bold text-[11px] text-solar-gold">
              {gameState?.playerFighter.name.split(' ')[0] || 'SCION'}
            </span>
            <span className="text-[9px] font-mono text-text-muted">
              SPD {gameState?.playerFighter.speed || 100}
            </span>
          </div>

          <span className="text-ember-core font-mono text-[11px]">⚔️</span>

          {/* Enemy Turn Pip */}
          <div className="flex items-center gap-1.5 bg-magma-850 border border-crimson-heat/60 px-2 py-0.5 rounded">
            <div className="w-4 h-4 rounded bg-crimson-heat text-white flex items-center justify-center font-mono text-[9px] font-bold">
              {gameState?.isPvP ? 'P2' : 'AI'}
            </div>
            <span className="font-rajdhani font-bold text-[11px] text-crimson-heat">
              {gameState?.enemyFighter.name.split(' ')[0] || 'TYPHON'}
            </span>
            <span className="text-[9px] font-mono text-text-muted">
              SPD {gameState?.enemyFighter.speed || 96}
            </span>
          </div>
        </div>

        {/* Priority Help Tip */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-[10px] text-text-muted">
          <span>PRIORITY: [DEFEND: 3] &gt; [FAST: 2] &gt; [ATTACK: 1] &gt; [HEAVY: 0]</span>
        </div>
      </div>
    </header>
  );
};
