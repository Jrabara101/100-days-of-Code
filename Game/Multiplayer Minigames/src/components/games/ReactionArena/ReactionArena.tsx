import React, { useState, useEffect, useRef } from 'react';
import { Gauge, Zap, Flame, Play, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHubStore } from '../../../store/useHubStore';
import { sounds } from '../../../lib/audio';
import { networkHub } from '../../../lib/network';
import { cn } from '../../../lib/utils';
import { TerminalCard } from '../../ui/TerminalCard';

type ChallengeType = 'PLASMA_DEFLECT' | 'NEEDLE_LOCK' | 'SYNC_DISARM';

interface RoundResult {
  round: number;
  winner: 'P1' | 'P2' | 'TIE' | 'FAIL';
  p1Time?: number;
  p2Time?: number;
  type: ChallengeType;
}

export const ReactionArena: React.FC = () => {
  const playerRole = useHubStore((s) => s.playerRole);
  const gameMode = useHubStore((s) => s.gameMode);
  const recordWin = useHubStore((s) => s.recordWin);
  const triggerPing = useHubStore((s) => s.triggerPing);

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [challengeType, setChallengeType] = useState<ChallengeType>('PLASMA_DEFLECT');
  const [gameState, setGameState] = useState<'IDLE' | 'COUNTDOWN' | 'ACTIVE' | 'RESOLVED'>('IDLE');
  const [countdown, setCountdown] = useState<number>(3);
  const [roundHistory, setRoundHistory] = useState<RoundResult[]>([]);
  const [matchWinner, setMatchWinner] = useState<'P1' | 'P2' | null>(null);

  // Player action inputs
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [p1Triggered, setP1Triggered] = useState<boolean>(false);
  const [p2Triggered, setP2Triggered] = useState<boolean>(false);
  const [p1Time, setP1Time] = useState<number | null>(null);
  const [p2Time, setP2Time] = useState<number | null>(null);

  // Precision Sweep Needle State (0 to 100)
  const [needlePos, setNeedlePos] = useState<number>(10);
  const needleDirection = useRef<number>(1);
  const activeStartTime = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Network synchronization
  useEffect(() => {
    const unsub = networkHub.subscribe((msg) => {
      if (msg.type === 'SYNC_STATE' && msg.payload.reaction) {
        const r = msg.payload.reaction;
        setGameState(r.gameState);
        setCurrentRound(r.currentRound);
        setChallengeType(r.challengeType);
        setP1Score(r.p1Score);
        setP2Score(r.p2Score);
        setP1Triggered(r.p1Triggered);
        setP2Triggered(r.p2Triggered);
        setP1Time(r.p1Time);
        setP2Time(r.p2Time);
        setMatchWinner(r.matchWinner);
        setRoundHistory(r.roundHistory);
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
          reaction: {
            gameState,
            currentRound,
            challengeType,
            p1Score,
            p2Score,
            p1Triggered,
            p2Triggered,
            p1Time,
            p2Time,
            matchWinner,
            roundHistory,
            ...overrides,
          },
        },
        timestamp: Date.now(),
      });
    }
  };

  // Needle oscillation animation
  useEffect(() => {
    if (gameState === 'ACTIVE') {
      const updateNeedle = () => {
        setNeedlePos((prev) => {
          let next = prev + needleDirection.current * 1.8;
          if (next >= 95) {
            needleDirection.current = -1;
            next = 95;
          } else if (next <= 5) {
            needleDirection.current = 1;
            next = 5;
          }
          return next;
        });
        animFrameRef.current = requestAnimationFrame(updateNeedle);
      };
      animFrameRef.current = requestAnimationFrame(updateNeedle);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState]);

  // AI bot behavior in SOLO_AI mode
  useEffect(() => {
    if (gameMode === 'SOLO_AI' && gameState === 'ACTIVE' && !p2Triggered) {
      const randomReactionDelay = 220 + Math.random() * 160; // 220-380ms
      const botTimer = setTimeout(() => {
        handleTrigger('P2');
      }, randomReactionDelay);
      return () => clearTimeout(botTimer);
    }
  }, [gameState, gameMode, p2Triggered]);

  const startRound = () => {
    sounds.playClick(1.2);
    setGameState('COUNTDOWN');
    setCountdown(3);
    setP1Triggered(false);
    setP2Triggered(false);
    setP1Time(null);
    setP2Time(null);

    const challenges: ChallengeType[] = ['PLASMA_DEFLECT', 'NEEDLE_LOCK', 'SYNC_DISARM'];
    const nextChallenge = challenges[(currentRound - 1) % challenges.length];
    setChallengeType(nextChallenge);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count > 0) {
        sounds.playClick(0.8 + count * 0.2);
      } else {
        clearInterval(interval);
        sounds.playLaser();
        setGameState('ACTIVE');
        activeStartTime.current = Date.now();
        broadcastState({
          gameState: 'ACTIVE',
          challengeType: nextChallenge,
          p1Triggered: false,
          p2Triggered: false,
        });
      }
    }, 800);
  };

  const handleTrigger = (player: 'P1' | 'P2') => {
    if (gameState !== 'ACTIVE') return;
    if (gameMode === 'ONLINE' && playerRole !== player) return;

    const reactionDelta = Date.now() - activeStartTime.current;
    sounds.playClick(player === 'P1' ? 1.6 : 1.2);

    let nextP1Time = p1Time;
    let nextP2Time = p2Time;

    if (player === 'P1' && !p1Triggered) {
      setP1Triggered(true);
      setP1Time(reactionDelta);
      nextP1Time = reactionDelta;
    } else if (player === 'P2' && !p2Triggered) {
      setP2Triggered(true);
      setP2Time(reactionDelta);
      nextP2Time = reactionDelta;
    }

    // Check if both players have responded or evaluate based on challenge
    if (nextP1Time !== null && nextP2Time !== null) {
      evaluateRound(nextP1Time, nextP2Time);
    } else {
      broadcastState({
        p1Triggered: player === 'P1' ? true : p1Triggered,
        p2Triggered: player === 'P2' ? true : p2Triggered,
        p1Time: nextP1Time,
        p2Time: nextP2Time,
      });

      // Auto resolve after 1.5s if other player didn't respond
      setTimeout(() => {
        if (gameState === 'ACTIVE') {
          evaluateRound(nextP1Time || 9999, nextP2Time || 9999);
        }
      }, 1200);
    }
  };

  const evaluateRound = (time1: number, time2: number) => {
    setGameState('RESOLVED');
    let roundWinner: 'P1' | 'P2' | 'TIE' | 'FAIL' = 'TIE';

    if (challengeType === 'SYNC_DISARM') {
      // In Synchronized Disarm, they win together if within 250ms of each other!
      const syncDelta = Math.abs(time1 - time2);
      if (syncDelta <= 250) {
        roundWinner = 'TIE'; // Cooperative success
        sounds.playVictory();
        setP1Score((s) => s + 1);
        setP2Score((s) => s + 1);
      } else {
        roundWinner = 'FAIL';
        sounds.playAlert();
      }
    } else {
      // Competitive speed test
      if (time1 < time2) {
        roundWinner = 'P1';
        sounds.playVictory();
        setP1Score((s) => s + 1);
        recordWin('P1');
      } else if (time2 < time1) {
        roundWinner = 'P2';
        sounds.playVictory();
        setP2Score((s) => s + 1);
        recordWin('P2');
      }
    }

    const result: RoundResult = {
      round: currentRound,
      winner: roundWinner,
      p1Time: time1,
      p2Time: time2,
      type: challengeType,
    };

    const newHistory = [...roundHistory, result];
    setRoundHistory(newHistory);

    // Match check: Best of 5 (First to 3)
    const newP1Score = roundWinner === 'P1' || (challengeType === 'SYNC_DISARM' && roundWinner === 'TIE') ? p1Score + 1 : p1Score;
    const newP2Score = roundWinner === 'P2' || (challengeType === 'SYNC_DISARM' && roundWinner === 'TIE') ? p2Score + 1 : p2Score;

    if (newP1Score >= 3 || newP2Score >= 3) {
      const champ = newP1Score >= 3 ? 'P1' : 'P2';
      setMatchWinner(champ);
      confetti({ particleCount: 120, spread: 80 });
    }

    broadcastState({
      gameState: 'RESOLVED',
      roundHistory: newHistory,
      p1Score: newP1Score,
      p2Score: newP2Score,
      matchWinner: newP1Score >= 3 ? 'P1' : newP2Score >= 3 ? 'P2' : null,
    });
  };

  const handleNextRound = () => {
    setCurrentRound((r) => r + 1);
    startRound();
  };

  const resetMatch = () => {
    sounds.playClick(0.9);
    setCurrentRound(1);
    setGameState('IDLE');
    setP1Score(0);
    setP2Score(0);
    setP1Triggered(false);
    setP2Triggered(false);
    setP1Time(null);
    setP2Time(null);
    setRoundHistory([]);
    setMatchWinner(null);

    broadcastState({
      currentRound: 1,
      gameState: 'IDLE',
      p1Score: 0,
      p2Score: 0,
      roundHistory: [],
      matchWinner: null,
    });
  };

  return (
    <div
      className="space-y-6"
      onClick={(e) => {
        if (e.shiftKey) triggerPing(e.clientX, e.clientY);
      }}
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border border-slate-800 bg-[#161B22]/80 backdrop-blur-md gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
            <Gauge className="w-4 h-4" />
            <span>REACTION ARENA // SYNCHRONOUS REFLEX LAB</span>
          </div>
          <h2 className="text-lg font-black tracking-wider uppercase text-white mt-0.5">
            High-Intensity Reflex Duels
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Test millisecond reaction times. Anticipate the plasma flash, stop the frequency sweep in the target zone, and coordinate synchronous wire disarms.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right font-mono">
            <div className="text-[10px] uppercase text-slate-400">Match Progress</div>
            <div className="text-sm font-black text-white">
              ROUND {currentRound} / 5 //{' '}
              <span className="text-[#58A6FF]">{p1Score}</span> :{' '}
              <span className="text-[#D29922]">{p2Score}</span>
            </div>
          </div>

          <button
            onClick={resetMatch}
            className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title="Reset Match"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* P1 Action Console */}
        <div className="lg:col-span-3">
          <TerminalCard
            variant="p1"
            title="PLAYER 1 REFLEX"
            subtitle="CYAN DEFLECTOR"
            badge={p1Time !== null ? `${p1Time}ms` : 'AWAITING'}
          >
            <div className="text-center py-4">
              <button
                onClick={() => handleTrigger('P1')}
                disabled={
                  gameState !== 'ACTIVE' ||
                  p1Triggered ||
                  (gameMode === 'ONLINE' && playerRole !== 'P1')
                }
                className={cn(
                  'w-full py-8 rounded-2xl border flex flex-col items-center justify-center font-mono font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg',
                  p1Triggered
                    ? 'border-[#58A6FF] bg-[#58A6FF] text-[#0D1117] shadow-[0_0_25px_#58A6FF]'
                    : 'border-[#58A6FF]/60 bg-[#58A6FF]/10 text-[#58A6FF] hover:bg-[#58A6FF]/20',
                  (gameState !== 'ACTIVE' ||
                    p1Triggered ||
                    (gameMode === 'ONLINE' && playerRole !== 'P1')) &&
                    'opacity-50 cursor-not-allowed'
                )}
              >
                <Zap className="w-8 h-8 mb-2" />
                <span>P1 TRIGGER</span>
                <span className="text-[10px] font-normal opacity-80 mt-1">
                  {p1Time !== null ? `${p1Time}ms RESPONSE` : 'PRESS TO DEFLECT'}
                </span>
              </button>
            </div>
          </TerminalCard>
        </div>

        {/* Central Arena Screen */}
        <div className="lg:col-span-6">
          <div className="relative p-6 rounded-2xl border border-slate-800 bg-[#0D1117]/95 shadow-2xl backdrop-blur-md min-h-[360px] flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Top Challenge Identifier */}
            <div className="absolute top-4 inset-x-0 flex justify-center">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-3 py-1 rounded-full border border-slate-700 bg-[#161B22] text-slate-300">
                CHALLENGE: {challengeType.replace('_', ' ')}
              </span>
            </div>

            {/* IDLE STATE */}
            {gameState === 'IDLE' && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full border border-slate-700 bg-slate-800/60 flex items-center justify-center mx-auto text-slate-400">
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-wider text-white">
                  ARENA READY FOR DEPLOYMENT
                </h3>
                <p className="text-xs text-slate-400 font-mono max-w-sm">
                  First to 3 rounds claims tactical victory. Prepare fingers on triggers!
                </p>
                <button
                  onClick={startRound}
                  className="px-8 py-3 rounded-xl border border-emerald-500 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-mono font-black tracking-widest uppercase transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                >
                  START ROUND 0{currentRound}
                </button>
              </div>
            )}

            {/* COUNTDOWN STATE */}
            {gameState === 'COUNTDOWN' && (
              <div className="space-y-2">
                <div className="text-7xl font-mono font-black text-amber-400 animate-ping">
                  {countdown}
                </div>
                <div className="text-xs uppercase font-mono text-slate-400 tracking-widest">
                  STANDBY FOR DISCHARGE...
                </div>
              </div>
            )}

            {/* ACTIVE CHALLENGE STATE */}
            {gameState === 'ACTIVE' && (
              <div className="w-full max-w-md space-y-6">
                {/* Plasma Deflect Flash Screen */}
                {challengeType === 'PLASMA_DEFLECT' && (
                  <div className="space-y-4">
                    <div className="text-3xl font-mono font-black text-red-500 uppercase tracking-widest animate-bounce">
                      ⚡ DEFLECT NOW! ⚡
                    </div>
                    <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden border border-slate-700 relative">
                      <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-[#58A6FF] to-[#D29922] animate-pulse shadow-[0_0_15px_#fff]" />
                    </div>
                  </div>
                )}

                {/* Needle Lock Oscilloscope */}
                {challengeType === 'NEEDLE_LOCK' && (
                  <div className="space-y-4">
                    <div className="text-xs uppercase font-mono text-slate-400">
                      LOCK NEEDLE IN TARGET RESONANCE ZONE [45% - 55%]
                    </div>
                    <div className="relative w-full h-8 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
                      {/* Target Zone */}
                      <div className="absolute top-0 bottom-0 left-[45%] right-[45%] bg-emerald-500/30 border-x border-emerald-500 shadow-[0_0_15px_#10b981]" />

                      {/* Moving Needle */}
                      <div
                        className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_10px_#fff] transition-transform"
                        style={{ left: `${needlePos}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Synchronized Disarm Wire */}
                {challengeType === 'SYNC_DISARM' && (
                  <div className="space-y-4">
                    <div className="text-xl font-mono font-black text-amber-400 uppercase tracking-wider">
                      ⚠️ CO-OP DETONATION CUT! ⚠️
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Both players must trigger their buttons within 250ms of each other!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* RESOLVED STATE */}
            {gameState === 'RESOLVED' && (
              <div className="space-y-4">
                <div className="text-xl font-mono font-black uppercase tracking-wider text-white">
                  ROUND 0{currentRound} CONCLUDED
                </div>
                <div className="flex items-center justify-center gap-8 font-mono text-xs">
                  <div>
                    <span className="text-[#58A6FF] font-bold">PLAYER 1: </span>
                    <span className="text-white font-bold">{p1Time ? `${p1Time}ms` : 'FAILED'}</span>
                  </div>
                  <div>
                    <span className="text-[#D29922] font-bold">PLAYER 2: </span>
                    <span className="text-white font-bold">{p2Time ? `${p2Time}ms` : 'FAILED'}</span>
                  </div>
                </div>

                {!matchWinner ? (
                  <button
                    onClick={handleNextRound}
                    className="px-6 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold tracking-widest uppercase cursor-pointer"
                  >
                    NEXT ROUND
                  </button>
                ) : (
                  <div className="pt-2">
                    <div className="text-2xl font-black uppercase font-mono text-emerald-400">
                      🏆 {matchWinner === 'P1' ? 'PLAYER 1 WINS THE MATCH!' : 'PLAYER 2 WINS THE MATCH!'}
                    </div>
                    <button
                      onClick={resetMatch}
                      className="mt-3 px-8 py-3 rounded-xl border border-emerald-500 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-mono font-black tracking-widest uppercase cursor-pointer"
                    >
                      ENGAGE NEW MATCH
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* P2 Action Console */}
        <div className="lg:col-span-3">
          <TerminalCard
            variant="p2"
            title="PLAYER 2 REFLEX"
            subtitle="AMBER DEFLECTOR"
            badge={p2Time !== null ? `${p2Time}ms` : 'AWAITING'}
          >
            <div className="text-center py-4">
              <button
                onClick={() => handleTrigger('P2')}
                disabled={
                  gameState !== 'ACTIVE' ||
                  p2Triggered ||
                  (gameMode === 'ONLINE' && playerRole !== 'P2')
                }
                className={cn(
                  'w-full py-8 rounded-2xl border flex flex-col items-center justify-center font-mono font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg',
                  p2Triggered
                    ? 'border-[#D29922] bg-[#D29922] text-[#0D1117] shadow-[0_0_25px_#D29922]'
                    : 'border-[#D29922]/60 bg-[#D29922]/10 text-[#D29922] hover:bg-[#D29922]/20',
                  (gameState !== 'ACTIVE' ||
                    p2Triggered ||
                    (gameMode === 'ONLINE' && playerRole !== 'P2')) &&
                    'opacity-50 cursor-not-allowed'
                )}
              >
                <Flame className="w-8 h-8 mb-2" />
                <span>P2 TRIGGER</span>
                <span className="text-[10px] font-normal opacity-80 mt-1">
                  {p2Time !== null ? `${p2Time}ms RESPONSE` : 'PRESS TO DEFLECT'}
                </span>
              </button>
            </div>
          </TerminalCard>
        </div>
      </div>
    </div>
  );
};
