import React, { useState, useEffect } from 'react';
import { RotateCw, Zap, Shield, CheckCircle, Sparkles, Lock, Unlock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHubStore } from '../../../store/useHubStore';
import { sounds } from '../../../lib/audio';
import { networkHub } from '../../../lib/network';
import { cn } from '../../../lib/utils';
import { TerminalCard } from '../../ui/TerminalCard';

interface MirrorNode {
  id: string;
  name: string;
  angle: number; // 0, 90, 180, 270
  targetAngle: number;
  controlledBy: 'P1';
}

interface PolarityFilter {
  id: string;
  name: string;
  frequency: number; // 1 to 5
  targetFreq: number;
  controlledBy: 'P2';
}

export const SharedPuzzleRoom: React.FC = () => {
  const playerRole = useHubStore((s) => s.playerRole);
  const gameMode = useHubStore((s) => s.gameMode);
  const recordWin = useHubStore((s) => s.recordWin);
  const triggerPing = useHubStore((s) => s.triggerPing);

  // Puzzle State
  const [level, setLevel] = useState<number>(1);
  const [mirrors, setMirrors] = useState<MirrorNode[]>([
    { id: 'm1', name: 'Prism Alpha', angle: 0, targetAngle: 90, controlledBy: 'P1' },
    { id: 'm2', name: 'Laser Conduit Beta', angle: 180, targetAngle: 270, controlledBy: 'P1' },
  ]);
  const [filters, setFilters] = useState<PolarityFilter[]>([
    { id: 'f1', name: 'Amber Resonator', frequency: 2, targetFreq: 4, controlledBy: 'P2' },
    { id: 'f2', name: 'Polarity Gate Delta', frequency: 1, targetFreq: 3, controlledBy: 'P2' },
  ]);

  // Synchronized Core Override Buttons
  const [p1CoreActive, setP1CoreActive] = useState<boolean>(false);
  const [p2CoreActive, setP2CoreActive] = useState<boolean>(false);
  const [lastP1Press, setLastP1Press] = useState<number>(0);
  const [lastP2Press, setLastP2Press] = useState<number>(0);
  const [levelCompleted, setLevelCompleted] = useState<boolean>(false);

  // Beam status calculations
  const mirrorsAligned = mirrors.every((m) => m.angle === m.targetAngle);
  const filtersAligned = filters.every((f) => f.frequency === f.targetFreq);
  const circuitUnlocked = mirrorsAligned && filtersAligned;

  // Listen to network sync for Puzzle
  useEffect(() => {
    const unsub = networkHub.subscribe((msg) => {
      if (msg.type === 'SYNC_STATE' && msg.payload.puzzle) {
        const p = msg.payload.puzzle;
        setMirrors(p.mirrors);
        setFilters(p.filters);
        setP1CoreActive(p.p1CoreActive);
        setP2CoreActive(p.p2CoreActive);
        setLevel(p.level);
        setLevelCompleted(p.levelCompleted);
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
          puzzle: {
            mirrors,
            filters,
            p1CoreActive,
            p2CoreActive,
            level,
            levelCompleted,
            ...overrides,
          },
        },
        timestamp: Date.now(),
      });
    }
  };

  const handleRotateMirror = (id: string) => {
    if (gameMode === 'ONLINE' && playerRole !== 'P1') return;
    sounds.playClick(1.4);
    const updated = mirrors.map((m) =>
      m.id === id ? { ...m, angle: (m.angle + 90) % 360 } : m
    );
    setMirrors(updated);
    broadcastState({ mirrors: updated });

    if (updated.every((m) => m.angle === m.targetAngle)) {
      sounds.playConduitLink();
    }
  };

  const handleAdjustFrequency = (id: string, delta: number) => {
    if (gameMode === 'ONLINE' && playerRole !== 'P2') return;
    sounds.playClick(1.1);
    const updated = filters.map((f) => {
      if (f.id !== id) return f;
      const next = Math.max(1, Math.min(5, f.frequency + delta));
      return { ...f, frequency: next };
    });
    setFilters(updated);
    broadcastState({ filters: updated });

    if (updated.every((f) => f.frequency === f.targetFreq)) {
      sounds.playConduitLink();
    }
  };

  // Synchronized Core Override Press
  const handlePressCore = (player: 'P1' | 'P2') => {
    const now = Date.now();
    sounds.playClick(1.8);

    if (player === 'P1') {
      setP1CoreActive(true);
      setLastP1Press(now);
      setTimeout(() => setP1CoreActive(false), 800);

      // Check if P2 pressed within 800ms
      if (p2CoreActive || Math.abs(now - lastP2Press) < 800) {
        completeLevel();
      } else {
        broadcastState({ p1CoreActive: true });
      }
    } else {
      setP2CoreActive(true);
      setLastP2Press(now);
      setTimeout(() => setP2CoreActive(false), 800);

      if (p1CoreActive || Math.abs(now - lastP1Press) < 800) {
        completeLevel();
      } else {
        broadcastState({ p2CoreActive: true });
      }
    }
  };

  const completeLevel = () => {
    sounds.playVictory();
    setLevelCompleted(true);
    recordWin('P1');
    recordWin('P2');
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    broadcastState({ levelCompleted: true });
  };

  const handleNextLevel = () => {
    sounds.playConduitLink();
    const nextLvl = level + 1;
    setLevel(nextLvl);
    setLevelCompleted(false);
    setP1CoreActive(false);
    setP2CoreActive(false);

    // New randomized configuration for next level
    const newMirrors: MirrorNode[] = [
      { id: 'm1', name: 'Prism Alpha', angle: 0, targetAngle: (nextLvl * 90) % 360, controlledBy: 'P1' },
      { id: 'm2', name: 'Laser Conduit Beta', angle: 90, targetAngle: (nextLvl * 180) % 360, controlledBy: 'P1' },
    ];
    const newFilters: PolarityFilter[] = [
      { id: 'f1', name: 'Amber Resonator', frequency: 1, targetFreq: ((nextLvl * 2) % 4) + 1, controlledBy: 'P2' },
      { id: 'f2', name: 'Polarity Gate Delta', frequency: 2, targetFreq: ((nextLvl * 3) % 4) + 1, controlledBy: 'P2' },
    ];
    setMirrors(newMirrors);
    setFilters(newFilters);
    broadcastState({
      level: nextLvl,
      levelCompleted: false,
      p1CoreActive: false,
      p2CoreActive: false,
      mirrors: newMirrors,
      filters: newFilters,
    });
  };

  return (
    <div
      className="space-y-6"
      onClick={(e) => {
        // Drop tactical ping if shift key is pressed
        if (e.shiftKey) {
          triggerPing(e.clientX, e.clientY);
        }
      }}
    >
      {/* Overview & Objective Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border border-slate-800 bg-[#161B22]/80 backdrop-blur-md gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#58A6FF]">
            <Zap className="w-4 h-4" />
            <span>CHAMBER STAGE: 0{level} // DUAL-CIRCUIT RELAY</span>
          </div>
          <h2 className="text-lg font-black tracking-wider uppercase text-white mt-0.5">
            Synchronized Optical Conduit
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Player 1 aligns cyan optical prisms to route high-energy plasma beams. Player 2 tunes amber resonant frequencies to disable the polarity shielding. Once the circuit completes, both players must trigger the override core simultaneously.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-slate-400">Circuit Status</div>
            <div
              className={cn(
                'text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5',
                circuitUnlocked ? 'text-emerald-400' : 'text-amber-400'
              )}
            >
              {circuitUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{circuitUnlocked ? 'CIRCUIT CLOSED' : 'PATHWAY OPEN'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Control Consoles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PLAYER 1 TERMINAL (CYAN) */}
        <TerminalCard
          variant="p1"
          title="TERMINAL 01 // OPTICAL PRISMS"
          subtitle="CONTROLLED BY PLAYER 1 (CYAN)"
          badge={mirrorsAligned ? 'ALIGNED (100%)' : 'MISALIGNED'}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300 font-mono">
              Rotate mirrors until optical refractors lock into resonance:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mirrors.map((m) => {
                const isTarget = m.angle === m.targetAngle;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'p-4 rounded-xl border bg-[#0D1117] transition-all flex flex-col items-center justify-center text-center relative overflow-hidden',
                      isTarget
                        ? 'border-[#58A6FF] shadow-[0_0_15px_rgba(88,166,255,0.25)]'
                        : 'border-slate-800'
                    )}
                  >
                    {/* Beam Ray indicator */}
                    {isTarget && (
                      <div className="absolute inset-0 bg-[#58A6FF]/5 pointer-events-none animate-pulse" />
                    )}

                    <div className="text-xs font-bold uppercase text-slate-200 mb-2">{m.name}</div>

                    {/* Rotating Prism Graphic */}
                    <div
                      className="w-16 h-16 rounded-xl border border-slate-700 bg-[#161B22] flex items-center justify-center mb-3 transition-transform duration-300 shadow-inner"
                      style={{ transform: `rotate(${m.angle}deg)` }}
                    >
                      <div
                        className={cn(
                          'w-2 h-10 rounded-full transition-colors',
                          isTarget
                            ? 'bg-[#58A6FF] shadow-[0_0_12px_#58A6FF]'
                            : 'bg-slate-600'
                        )}
                      />
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mb-3">
                      ANGLE: <span className="font-bold text-white">{m.angle}°</span> (REQ:{' '}
                      <span className="text-[#58A6FF]">{m.targetAngle}°</span>)
                    </div>

                    <button
                      onClick={() => handleRotateMirror(m.id)}
                      disabled={gameMode === 'ONLINE' && playerRole !== 'P1'}
                      className={cn(
                        'w-full py-2 px-3 rounded-lg border border-[#58A6FF]/50 bg-[#58A6FF]/10 text-[#58A6FF] hover:bg-[#58A6FF]/20 text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                        gameMode === 'ONLINE' && playerRole !== 'P1' && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>ROTATE 90°</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </TerminalCard>

        {/* PLAYER 2 TERMINAL (AMBER) */}
        <TerminalCard
          variant="p2"
          title="TERMINAL 02 // RESONANCE GATES"
          subtitle="CONTROLLED BY PLAYER 2 (AMBER)"
          badge={filtersAligned ? 'STABILIZED' : 'UNSTABLE'}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300 font-mono">
              Calibrate harmonic frequencies to match plasma impedance:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filters.map((f) => {
                const isTarget = f.frequency === f.targetFreq;
                return (
                  <div
                    key={f.id}
                    className={cn(
                      'p-4 rounded-xl border bg-[#0D1117] transition-all flex flex-col items-center justify-center text-center relative overflow-hidden',
                      isTarget
                        ? 'border-[#D29922] shadow-[0_0_15px_rgba(210,153,34,0.25)]'
                        : 'border-slate-800'
                    )}
                  >
                    {isTarget && (
                      <div className="absolute inset-0 bg-[#D29922]/5 pointer-events-none animate-pulse" />
                    )}

                    <div className="text-xs font-bold uppercase text-slate-200 mb-2">{f.name}</div>

                    {/* Frequency Meter Bar Graphic */}
                    <div className="w-full flex items-end justify-center gap-1.5 h-16 mb-3 px-4">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={cn(
                            'flex-1 rounded-sm transition-all',
                            lvl <= f.frequency
                              ? isTarget
                                ? 'bg-[#D29922] shadow-[0_0_8px_#D29922]'
                                : 'bg-slate-500'
                              : 'bg-slate-800'
                          )}
                          style={{ height: `${lvl * 20}%` }}
                        />
                      ))}
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mb-3">
                      FREQ: <span className="font-bold text-white">{f.frequency} GHz</span> (REQ:{' '}
                      <span className="text-[#D29922]">{f.targetFreq} GHz</span>)
                    </div>

                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => handleAdjustFrequency(f.id, -1)}
                        disabled={gameMode === 'ONLINE' && playerRole !== 'P2'}
                        className="flex-1 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-white font-mono font-bold text-xs hover:bg-slate-700 cursor-pointer disabled:opacity-40"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAdjustFrequency(f.id, 1)}
                        disabled={gameMode === 'ONLINE' && playerRole !== 'P2'}
                        className="flex-1 py-1.5 rounded-lg border border-[#D29922]/50 bg-[#D29922]/10 text-[#D29922] font-mono font-bold text-xs hover:bg-[#D29922]/20 cursor-pointer disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TerminalCard>
      </div>

      {/* SYNCHRONIZED OVERRIDE CORE SECTION */}
      <TerminalCard
        title="CORE OVERRIDE CHAMBER // SYNCHRONOUS TRIGGER"
        subtitle="REQUIRES SIMULTANEOUS TRIGGER WITHIN 800MS"
        className={cn(
          'transition-all',
          circuitUnlocked
            ? 'border-emerald-500/60 shadow-[0_0_30px_rgba(52,211,153,0.15)]'
            : 'border-slate-800/80 opacity-60'
        )}
      >
        <div className="text-center max-w-xl mx-auto py-2">
          {levelCompleted ? (
            <div className="space-y-4 py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_#10b981]">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white">
                CHAMBER 0{level} OVERRIDDEN!
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Perfect synchronization detected. Optical plasma conduit successfully purged.
              </p>
              <button
                onClick={handleNextLevel}
                className="mt-3 px-8 py-3 rounded-xl border border-emerald-500 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-mono font-black tracking-widest uppercase transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-4 h-4" />
                <span>ENGAGE NEXT CHAMBER</span>
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-300 font-mono mb-6">
                {circuitUnlocked
                  ? 'CIRCUIT CLOSED! Both players must press their detonator buttons simultaneously!'
                  : 'Complete both Terminal 01 and Terminal 02 to unlock synchronous trigger switches.'}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* P1 Switch */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handlePressCore('P1')}
                    disabled={!circuitUnlocked || (gameMode === 'ONLINE' && playerRole !== 'P1')}
                    className={cn(
                      'w-36 h-20 rounded-2xl border flex flex-col items-center justify-center font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg',
                      p1CoreActive
                        ? 'border-[#58A6FF] bg-[#58A6FF] text-[#0D1117] shadow-[0_0_30px_#58A6FF] scale-95'
                        : 'border-[#58A6FF]/60 bg-[#58A6FF]/10 text-[#58A6FF] hover:bg-[#58A6FF]/20',
                      (!circuitUnlocked || (gameMode === 'ONLINE' && playerRole !== 'P1')) &&
                        'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <Zap className="w-5 h-5 mb-1" />
                    <span>P1 TRIGGER</span>
                    <span className="text-[9px] font-normal opacity-80 mt-0.5">
                      {p1CoreActive ? 'ACTIVE' : 'STANDBY'}
                    </span>
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">Cyan Conductor</span>
                </div>

                {/* Central Bridge Wire */}
                <div className="hidden sm:flex items-center">
                  <div
                    className={cn(
                      'w-20 h-1 rounded-full transition-colors',
                      p1CoreActive && p2CoreActive
                        ? 'bg-emerald-400 shadow-[0_0_15px_#10b981]'
                        : p1CoreActive
                        ? 'bg-[#58A6FF] shadow-[0_0_10px_#58A6FF]'
                        : p2CoreActive
                        ? 'bg-[#D29922] shadow-[0_0_10px_#D29922]'
                        : 'bg-slate-800'
                    )}
                  />
                </div>

                {/* P2 Switch */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handlePressCore('P2')}
                    disabled={!circuitUnlocked || (gameMode === 'ONLINE' && playerRole !== 'P2')}
                    className={cn(
                      'w-36 h-20 rounded-2xl border flex flex-col items-center justify-center font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg',
                      p2CoreActive
                        ? 'border-[#D29922] bg-[#D29922] text-[#0D1117] shadow-[0_0_30px_#D29922] scale-95'
                        : 'border-[#D29922]/60 bg-[#D29922]/10 text-[#D29922] hover:bg-[#D29922]/20',
                      (!circuitUnlocked || (gameMode === 'ONLINE' && playerRole !== 'P2')) &&
                        'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <Shield className="w-5 h-5 mb-1" />
                    <span>P2 TRIGGER</span>
                    <span className="text-[9px] font-normal opacity-80 mt-0.5">
                      {p2CoreActive ? 'ACTIVE' : 'STANDBY'}
                    </span>
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">Amber Resonator</span>
                </div>
              </div>
            </>
          )}
        </div>
      </TerminalCard>
    </div>
  );
};
