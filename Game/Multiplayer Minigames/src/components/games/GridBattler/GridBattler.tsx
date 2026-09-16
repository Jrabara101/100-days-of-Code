import React, { useState, useEffect } from 'react';
import { Shield, Zap, Crosshair, Radio, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHubStore } from '../../../store/useHubStore';
import { sounds } from '../../../lib/audio';
import { networkHub } from '../../../lib/network';
import { cn } from '../../../lib/utils';
import { TerminalCard } from '../../ui/TerminalCard';

interface Position {
  x: number;
  y: number;
}

interface PlayerStats {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  ap: number;
  maxAp: number;
  pos: Position;
}

const BOARD_SIZE = 6;

export const GridBattler: React.FC = () => {
  const playerRole = useHubStore((s) => s.playerRole);
  const gameMode = useHubStore((s) => s.gameMode);
  const recordWin = useHubStore((s) => s.recordWin);
  const triggerPing = useHubStore((s) => s.triggerPing);

  const [currentTurn, setCurrentTurn] = useState<'P1' | 'P2'>('P1');
  const [turnCount, setTurnCount] = useState<number>(1);
  const [selectedAction, setSelectedAction] = useState<'MOVE' | 'ATTACK' | 'SHIELD' | 'EMP'>('MOVE');
  const [winner, setWinner] = useState<'P1' | 'P2' | null>(null);

  // Power Cores on board
  const [powerCores, setPowerCores] = useState<Position[]>([
    { x: 1, y: 4 },
    { x: 4, y: 1 },
  ]);

  const [p1Stats, setP1Stats] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    ap: 3,
    maxAp: 3,
    pos: { x: 0, y: 0 },
  });

  const [p2Stats, setP2Stats] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    ap: 3,
    maxAp: 3,
    pos: { x: 5, y: 5 },
  });

  // Network sync listener
  useEffect(() => {
    const unsub = networkHub.subscribe((msg) => {
      if (msg.type === 'SYNC_STATE' && msg.payload.grid) {
        const g = msg.payload.grid;
        setP1Stats(g.p1Stats);
        setP2Stats(g.p2Stats);
        setCurrentTurn(g.currentTurn);
        setTurnCount(g.turnCount);
        setPowerCores(g.powerCores);
        setWinner(g.winner);
      }
    });
    return unsub;
  }, []);

  const broadcastState = (overrides?: any) => {
    if (gameMode === 'ONLINE') {
      networkHub.send({
        type: 'SYNC_STATE',
        sender: playerRole,
        payload: {
          grid: {
            p1Stats,
            p2Stats,
            currentTurn,
            turnCount,
            powerCores,
            winner,
            ...overrides,
          },
        },
        timestamp: Date.now(),
      });
    }
  };

  // AI Sparring Partner in SOLO_AI mode
  useEffect(() => {
    if (gameMode === 'SOLO_AI' && currentTurn === 'P2' && !winner) {
      const timer = setTimeout(() => {
        executeAiTurn();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, gameMode, winner, p2Stats, p1Stats]);

  const executeAiTurn = () => {
    // Simple tactical AI:
    // If in line of sight and AP >= 2 -> Fire Railgun!
    // Else move closer to P1 or recharge shield
    const dx = p1Stats.pos.x - p2Stats.pos.x;
    const dy = p1Stats.pos.y - p2Stats.pos.y;
    const inLineOfSight = p1Stats.pos.x === p2Stats.pos.x || p1Stats.pos.y === p2Stats.pos.y;

    if (inLineOfSight && p2Stats.ap >= 2) {
      applyAttack('P2', p1Stats.pos);
    } else if (p2Stats.shield <= 20 && p2Stats.ap >= 1) {
      applyShield('P2');
    } else if (p2Stats.ap >= 1) {
      const stepX = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
      const stepY = stepX === 0 && dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
      const targetPos: Position = {
        x: Math.max(0, Math.min(5, p2Stats.pos.x + stepX)),
        y: Math.max(0, Math.min(5, p2Stats.pos.y + stepY)),
      };
      if (!(targetPos.x === p1Stats.pos.x && targetPos.y === p1Stats.pos.y)) {
        applyMove('P2', targetPos);
      } else {
        endTurn('P2');
      }
    } else {
      endTurn('P2');
    }
  };

  const isMyTurn = () => {
    if (winner) return false;
    if (gameMode === 'LOCAL_2P') return true;
    if (gameMode === 'SOLO_AI') return currentTurn === 'P1';
    return currentTurn === playerRole;
  };

  const handleTileClick = (x: number, y: number) => {
    if (!isMyTurn()) return;

    const actingPlayer = currentTurn;
    const stats = actingPlayer === 'P1' ? p1Stats : p2Stats;

    if (selectedAction === 'MOVE') {
      // Orthogonal step check
      const dist = Math.abs(x - stats.pos.x) + Math.abs(y - stats.pos.y);
      const opponentPos = actingPlayer === 'P1' ? p2Stats.pos : p1Stats.pos;
      if (dist === 1 && !(x === opponentPos.x && y === opponentPos.y) && stats.ap >= 1) {
        applyMove(actingPlayer, { x, y });
      }
    } else if (selectedAction === 'ATTACK') {
      // Railgun line of sight check
      const inLine = x === stats.pos.x || y === stats.pos.y;
      if (inLine && stats.ap >= 2) {
        applyAttack(actingPlayer, { x, y });
      }
    }
  };

  const applyMove = (player: 'P1' | 'P2', target: Position) => {
    sounds.playClick(1.2);
    const stats = player === 'P1' ? p1Stats : p2Stats;
    let newAp = stats.ap - 1;

    // Check if stepped on Power Core
    let newCores = [...powerCores];
    const hitCore = powerCores.find((c) => c.x === target.x && c.y === target.y);
    if (hitCore) {
      sounds.playConduitLink();
      newAp = Math.min(stats.maxAp, newAp + 2);
      newCores = newCores.filter((c) => c !== hitCore);
    }

    const updatedStats: PlayerStats = {
      ...stats,
      pos: target,
      ap: newAp,
    };

    if (player === 'P1') {
      setP1Stats(updatedStats);
      setPowerCores(newCores);
      broadcastState({ p1Stats: updatedStats, powerCores: newCores });
    } else {
      setP2Stats(updatedStats);
      setPowerCores(newCores);
      broadcastState({ p2Stats: updatedStats, powerCores: newCores });
    }
  };

  const applyAttack = (player: 'P1' | 'P2', target: Position) => {
    sounds.playLaser();
    const stats = player === 'P1' ? p1Stats : p2Stats;
    const defender = player === 'P1' ? p2Stats : p1Stats;

    // Check if target matches defender pos
    const isHit = target.x === defender.pos.x && target.y === defender.pos.y;
    let newDefenderStats = { ...defender };

    if (isHit) {
      const damage = 35;
      let remainingDmg = damage;

      if (newDefenderStats.shield > 0) {
        const shieldAbsorb = Math.min(newDefenderStats.shield, remainingDmg);
        newDefenderStats.shield -= shieldAbsorb;
        remainingDmg -= shieldAbsorb;
      }

      newDefenderStats.hp = Math.max(0, newDefenderStats.hp - remainingDmg);

      if (newDefenderStats.hp <= 0) {
        setWinner(player);
        recordWin(player);
        sounds.playVictory();
        confetti({ particleCount: 100, spread: 80 });
      }
    }

    const updatedAttacker: PlayerStats = {
      ...stats,
      ap: stats.ap - 2,
    };

    if (player === 'P1') {
      setP1Stats(updatedAttacker);
      setP2Stats(newDefenderStats);
      broadcastState({
        p1Stats: updatedAttacker,
        p2Stats: newDefenderStats,
        winner: newDefenderStats.hp <= 0 ? 'P1' : null,
      });
    } else {
      setP2Stats(updatedAttacker);
      setP1Stats(newDefenderStats);
      broadcastState({
        p2Stats: updatedAttacker,
        p1Stats: newDefenderStats,
        winner: newDefenderStats.hp <= 0 ? 'P2' : null,
      });
    }
  };

  const applyShield = (player: 'P1' | 'P2') => {
    sounds.playClick(1.6);
    const stats = player === 'P1' ? p1Stats : p2Stats;
    if (stats.ap < 1) return;

    const updated: PlayerStats = {
      ...stats,
      shield: Math.min(stats.maxShield, stats.shield + 25),
      ap: stats.ap - 1,
    };

    if (player === 'P1') {
      setP1Stats(updated);
      broadcastState({ p1Stats: updated });
    } else {
      setP2Stats(updated);
      broadcastState({ p2Stats: updated });
    }
  };

  const applyEmp = (player: 'P1' | 'P2') => {
    sounds.playEMP();
    const stats = player === 'P1' ? p1Stats : p2Stats;
    const defender = player === 'P1' ? p2Stats : p1Stats;
    if (stats.ap < 2) return;

    // EMP disables enemy shields and deals 15 direct shock damage if within 2 tiles
    const dist = Math.abs(stats.pos.x - defender.pos.x) + Math.abs(stats.pos.y - defender.pos.y);
    let updatedDefender = { ...defender };

    if (dist <= 2) {
      updatedDefender.shield = 0;
      updatedDefender.hp = Math.max(0, updatedDefender.hp - 15);
    }

    const updatedAttacker: PlayerStats = {
      ...stats,
      ap: stats.ap - 2,
    };

    if (player === 'P1') {
      setP1Stats(updatedAttacker);
      setP2Stats(updatedDefender);
      broadcastState({ p1Stats: updatedAttacker, p2Stats: updatedDefender });
    } else {
      setP2Stats(updatedAttacker);
      setP1Stats(updatedDefender);
      broadcastState({ p2Stats: updatedAttacker, p1Stats: updatedDefender });
    }
  };

  const endTurn = (player: 'P1' | 'P2') => {
    sounds.playClick(1.0);
    const nextTurn = player === 'P1' ? 'P2' : 'P1';

    // Refresh AP for the next player
    if (nextTurn === 'P1') {
      setP1Stats((prev) => ({ ...prev, ap: prev.maxAp }));
    } else {
      setP2Stats((prev) => ({ ...prev, ap: prev.maxAp }));
    }

    setCurrentTurn(nextTurn);
    setTurnCount((c) => c + 1);
    broadcastState({
      currentTurn: nextTurn,
      turnCount: turnCount + 1,
      p1Stats: nextTurn === 'P1' ? { ...p1Stats, ap: p1Stats.maxAp } : p1Stats,
      p2Stats: nextTurn === 'P2' ? { ...p2Stats, ap: p2Stats.maxAp } : p2Stats,
    });
  };

  const resetGame = () => {
    sounds.playClick(0.8);
    const freshP1: PlayerStats = {
      hp: 100,
      maxHp: 100,
      shield: 50,
      maxShield: 50,
      ap: 3,
      maxAp: 3,
      pos: { x: 0, y: 0 },
    };
    const freshP2: PlayerStats = {
      hp: 100,
      maxHp: 100,
      shield: 50,
      maxShield: 50,
      ap: 3,
      maxAp: 3,
      pos: { x: 5, y: 5 },
    };
    const freshCores = [
      { x: 1, y: 4 },
      { x: 4, y: 1 },
    ];

    setP1Stats(freshP1);
    setP2Stats(freshP2);
    setPowerCores(freshCores);
    setCurrentTurn('P1');
    setTurnCount(1);
    setWinner(null);

    broadcastState({
      p1Stats: freshP1,
      p2Stats: freshP2,
      powerCores: freshCores,
      currentTurn: 'P1',
      turnCount: 1,
      winner: null,
    });
  };

  const activeStats = currentTurn === 'P1' ? p1Stats : p2Stats;

  return (
    <div
      className="space-y-6"
      onClick={(e) => {
        if (e.shiftKey) triggerPing(e.clientX, e.clientY);
      }}
    >
      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border border-slate-800 bg-[#161B22]/80 backdrop-blur-md gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#D29922]">
            <Zap className="w-4 h-4" />
            <span>GRID BATTLER // 6×6 TACTICAL CYBER ARENA</span>
          </div>
          <h2 className="text-lg font-black tracking-wider uppercase text-white mt-0.5">
            Turn-Based Positional Combat
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Out-maneuver and eliminate the opposing combatant. Position yourself along line-of-sight axes to discharge the railgun, detonate proximity EMP shockwaves, and claim power cells.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-slate-400">Current Initiative</div>
            <div
              className={cn(
                'text-sm font-mono font-black uppercase tracking-wider',
                currentTurn === 'P1' ? 'text-[#58A6FF]' : 'text-[#D29922]'
              )}
            >
              {currentTurn === 'P1' ? 'P1 // CYAN VANGUARD' : 'P2 // AMBER STRIKER'}
            </div>
            <div className="text-[10px] font-mono text-slate-500">TURN #{turnCount}</div>
          </div>

          <button
            onClick={resetGame}
            className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title="Reset Board"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Arena & Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* P1 Status Panel */}
        <div className="lg:col-span-3">
          <TerminalCard
            variant="p1"
            title="P1 CYAN VANGUARD"
            subtitle="GRID OPERATOR"
            badge={`AP: ${p1Stats.ap}/${p1Stats.maxAp}`}
          >
            <div className="space-y-3">
              {/* HP Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">HULL INTEGRITY</span>
                  <span className="font-bold text-white">{p1Stats.hp} HP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${(p1Stats.hp / p1Stats.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Shield Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">DEFLECTION SHIELD</span>
                  <span className="font-bold text-[#58A6FF]">{p1Stats.shield} SP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#58A6FF] transition-all duration-300 shadow-[0_0_8px_#58A6FF]"
                    style={{ width: `${(p1Stats.shield / p1Stats.maxShield) * 100}%` }}
                  />
                </div>
              </div>

              {/* Action Point Pips */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">
                  Action Points
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: p1Stats.maxAp }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 h-3 rounded-sm border transition-all',
                        i < p1Stats.ap
                          ? 'border-[#58A6FF] bg-[#58A6FF] shadow-[0_0_8px_#58A6FF]'
                          : 'border-slate-800 bg-slate-900'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TerminalCard>
        </div>

        {/* 6x6 Center Grid Board */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="relative p-4 rounded-2xl border border-slate-800 bg-[#0D1117]/90 shadow-2xl backdrop-blur-md">
            {/* 6x6 Grid */}
            <div className="grid grid-cols-6 gap-2 w-72 sm:w-96 md:w-[420px] aspect-square">
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => {
                const x = idx % BOARD_SIZE;
                const y = Math.floor(idx / BOARD_SIZE);

                const isP1 = p1Stats.pos.x === x && p1Stats.pos.y === y;
                const isP2 = p2Stats.pos.x === x && p2Stats.pos.y === y;
                const isCore = powerCores.some((c) => c.x === x && c.y === y);

                // Line of Sight highlighting for active attacker
                const activePos = currentTurn === 'P1' ? p1Stats.pos : p2Stats.pos;
                const isLineOfSight =
                  selectedAction === 'ATTACK' && (x === activePos.x || y === activePos.y);

                return (
                  <button
                    key={idx}
                    onClick={() => handleTileClick(x, y)}
                    className={cn(
                      'relative rounded-xl border transition-all flex items-center justify-center text-xs font-mono font-bold cursor-pointer group',
                      'hover:border-slate-500 hover:bg-slate-800/40',
                      isP1
                        ? 'border-[#58A6FF] bg-[#58A6FF]/20 shadow-[0_0_20px_rgba(88,166,255,0.4)]'
                        : isP2
                        ? 'border-[#D29922] bg-[#D29922]/20 shadow-[0_0_20px_rgba(210,153,34,0.4)]'
                        : isLineOfSight
                        ? 'border-red-500/40 bg-red-500/10'
                        : 'border-slate-800/80 bg-[#161B22]/60'
                    )}
                  >
                    {/* Grid coordinate watermark */}
                    <span className="absolute top-1 left-1.5 text-[8px] text-slate-600 font-mono select-none">
                      {x},{y}
                    </span>

                    {/* Power Core pickup */}
                    {isCore && !isP1 && !isP2 && (
                      <div className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400 flex items-center justify-center text-emerald-300 animate-pulse shadow-[0_0_12px_#34d399]">
                        <Zap className="w-3 h-3" />
                      </div>
                    )}

                    {/* Player 1 Avatar */}
                    {isP1 && (
                      <div className="flex flex-col items-center">
                        <Zap className="w-6 h-6 text-[#58A6FF] drop-shadow-[0_0_8px_#58A6FF]" />
                        <span className="text-[9px] font-black text-[#58A6FF]">P1</span>
                      </div>
                    )}

                    {/* Player 2 Avatar */}
                    {isP2 && (
                      <div className="flex flex-col items-center">
                        <Shield className="w-6 h-6 text-[#D29922] drop-shadow-[0_0_8px_#D29922]" />
                        <span className="text-[9px] font-black text-[#D29922]">P2</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Victory Splash Overlay */}
            {winner && (
              <div className="absolute inset-0 bg-black/90 rounded-2xl flex flex-col items-center justify-center p-6 text-center backdrop-blur-md z-20">
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl border flex items-center justify-center mb-3',
                    winner === 'P1'
                      ? 'border-[#58A6FF] bg-[#58A6FF]/20 text-[#58A6FF] shadow-[0_0_30px_#58A6FF]'
                      : 'border-[#D29922] bg-[#D29922]/20 text-[#D29922] shadow-[0_0_30px_#D29922]'
                  )}
                >
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-wider text-white">
                  {winner === 'P1' ? 'PLAYER 1 (CYAN) VICTORIOUS!' : 'PLAYER 2 (AMBER) VICTORIOUS!'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1 mb-4">
                  Tactical grid superiority achieved. Opponent combat module neutralised.
                </p>
                <button
                  onClick={resetGame}
                  className="px-6 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold tracking-widest uppercase cursor-pointer"
                >
                  ENGAGE REMATCH
                </button>
              </div>
            )}
          </div>

          {/* Action Command Bar for active player */}
          <div className="mt-4 w-full max-w-[420px] p-3 rounded-xl border border-slate-800 bg-[#161B22]/90 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedAction('MOVE')}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer',
                  selectedAction === 'MOVE'
                    ? 'border-white bg-white/10 text-white'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700'
                )}
              >
                MOVE (1 AP)
              </button>

              <button
                onClick={() => setSelectedAction('ATTACK')}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1',
                  selectedAction === 'ATTACK'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700'
                )}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>RAILGUN (2 AP)</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => applyShield(currentTurn)}
                disabled={activeStats.ap < 1 || !isMyTurn()}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[#58A6FF] disabled:opacity-40 cursor-pointer"
                title="Recharge Shield (+25 SP) - 1 AP"
              >
                <Shield className="w-4 h-4" />
              </button>

              <button
                onClick={() => applyEmp(currentTurn)}
                disabled={activeStats.ap < 2 || !isMyTurn()}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[#D29922] disabled:opacity-40 cursor-pointer"
                title="Detonate EMP Shockwave - 2 AP"
              >
                <Radio className="w-4 h-4" />
              </button>

              <button
                onClick={() => endTurn(currentTurn)}
                disabled={!isMyTurn()}
                className="px-3 py-1.5 rounded-lg border border-emerald-500/60 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-mono font-black tracking-wider uppercase transition-all cursor-pointer disabled:opacity-40"
              >
                END TURN
              </button>
            </div>
          </div>
        </div>

        {/* P2 Status Panel */}
        <div className="lg:col-span-3">
          <TerminalCard
            variant="p2"
            title="P2 AMBER STRIKER"
            subtitle="GRID OPERATOR"
            badge={`AP: ${p2Stats.ap}/${p2Stats.maxAp}`}
          >
            <div className="space-y-3">
              {/* HP Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">HULL INTEGRITY</span>
                  <span className="font-bold text-white">{p2Stats.hp} HP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${(p2Stats.hp / p2Stats.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Shield Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">DEFLECTION SHIELD</span>
                  <span className="font-bold text-[#D29922]">{p2Stats.shield} SP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#D29922] transition-all duration-300 shadow-[0_0_8px_#D29922]"
                    style={{ width: `${(p2Stats.shield / p2Stats.maxShield) * 100}%` }}
                  />
                </div>
              </div>

              {/* Action Point Pips */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">
                  Action Points
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: p2Stats.maxAp }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 h-3 rounded-sm border transition-all',
                        i < p2Stats.ap
                          ? 'border-[#D29922] bg-[#D29922] shadow-[0_0_8px_#D29922]'
                          : 'border-slate-800 bg-slate-900'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TerminalCard>
        </div>
      </div>
    </div>
  );
};
