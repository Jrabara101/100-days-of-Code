import React from 'react';
import { Volume2, VolumeX, Flame, Vault, Zap, Hourglass, FastForward, Radio } from 'lucide-react';
import { EngineSnapshot } from '../engine/types';
import { TriviaGameshowEngine } from '../engine/TriviaGameshowEngine';

interface BroadcastHeaderProps {
  engine: TriviaGameshowEngine;
  state: EngineSnapshot;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const BroadcastHeader: React.FC<BroadcastHeaderProps> = ({
  engine,
  state,
  isMuted,
  onToggleMute
}) => {
  const { phase, streak, totalScore, lifelines, isFrozen } = state;
  const canUseLifeline = phase === 'COUNTDOWN';

  return (
    <header className="w-full max-w-7xl mx-auto glass-panel rounded-2xl p-3 md:p-4 flex flex-wrap justify-between items-center gap-3 z-30 border-purple-500/40">
      {/* Brand & Live Feed Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-0.5 shadow-[0_0_15px_rgba(236,72,153,0.6)]">
          <div className="w-full h-full bg-[#090a1a] rounded-[10px] flex items-center justify-center text-pink-400 font-arcade text-xs">
            <Radio className="w-5 h-5 animate-pulse text-pink-400" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-audiowide text-lg md:text-xl font-bold tracking-wider retro-glitch-text text-white">
              APEX ARENA
            </h1>
            <span className="font-arcade text-[9px] text-amber-400 bg-amber-400/10 border border-amber-400/40 px-1.5 py-0.5 rounded">
              80s BROADCAST
            </span>
          </div>
          <div className="flex items-center gap-2 font-crt text-cyan-300 text-sm md:text-base leading-none tracking-widest mt-0.5">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              ON AIR
            </span>
            <span>// MONOTONIC TIME DECAY // 1.4M AUDIENCE</span>
          </div>
        </div>
      </div>

      {/* Center Telemetry: Streak & Vault */}
      <div className="flex items-center gap-3 md:gap-6 bg-[#0c0e24] px-4 py-2 rounded-xl border border-purple-900/60 shadow-inner">
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
          <div className="flex flex-col">
            <span className="font-arcade text-[8px] text-slate-400 uppercase">STREAK</span>
            <span className="font-crt text-lg md:text-xl font-bold text-amber-400">
              {streak > 0 ? `${streak}X COMBO` : '0X'}
            </span>
          </div>
        </div>

        <div className="w-px h-6 bg-purple-900/60" />

        <div className="flex items-center gap-2">
          <Vault className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col">
            <span className="font-arcade text-[8px] text-slate-400 uppercase">BANK VAULT</span>
            <span className="font-crt text-lg md:text-xl font-bold text-emerald-400 neon-cyan-glow">
              ${totalScore.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Lifelines & Volume Toggle */}
      <div className="flex items-center gap-2">
        {/* 50:50 Lifeline */}
        <button
          onClick={() => engine.useFiftyFifty()}
          disabled={!lifelines.fiftyFifty || !canUseLifeline}
          title="50:50 Lifeline - Prunes two incorrect options"
          className={`px-2.5 md:px-3 py-1.5 rounded-xl font-arcade text-[9px] flex items-center gap-1.5 border transition-all ${
            lifelines.fiftyFifty && canUseLifeline
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 hover:bg-cyan-500/30 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer'
              : 'opacity-25 bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>50:50</span>
        </button>

        {/* Freeze Lifeline */}
        <button
          onClick={() => engine.useFreeze()}
          disabled={!lifelines.freeze || !canUseLifeline || isFrozen}
          title="Freeze Time - Pauses monotonic countdown for 5 seconds"
          className={`px-2.5 md:px-3 py-1.5 rounded-xl font-arcade text-[9px] flex items-center gap-1.5 border transition-all ${
            lifelines.freeze && canUseLifeline && !isFrozen
              ? 'bg-purple-500/20 text-purple-300 border-purple-400/50 hover:bg-purple-500/30 hover:shadow-[0_0_12px_rgba(139,92,246,0.4)] cursor-pointer'
              : isFrozen
              ? 'bg-cyan-500/40 text-cyan-200 border-cyan-400 animate-pulse'
              : 'opacity-25 bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
          }`}
        >
          <Hourglass className={`w-3.5 h-3.5 ${isFrozen ? 'animate-spin' : ''}`} />
          <span>{isFrozen ? 'FROZEN' : 'FREEZE'}</span>
        </button>

        {/* Skip Lifeline */}
        <button
          onClick={() => engine.useSkip()}
          disabled={!lifelines.skip || !canUseLifeline}
          title="Skip Question - Bypasses question without penalty"
          className={`px-2.5 md:px-3 py-1.5 rounded-xl font-arcade text-[9px] flex items-center gap-1.5 border transition-all ${
            lifelines.skip && canUseLifeline
              ? 'bg-pink-500/20 text-pink-300 border-pink-400/50 hover:bg-pink-500/30 hover:shadow-[0_0_12px_rgba(236,72,153,0.4)] cursor-pointer'
              : 'opacity-25 bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
          }`}
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>SKIP</span>
        </button>

        {/* Procedural Audio Mute/Unmute */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Sound Synthesizer' : 'Mute Sound Synthesizer'}
          className="p-2 rounded-xl bg-slate-900/80 border border-pink-500/40 text-pink-400 hover:text-pink-300 hover:border-pink-400 transition-all shadow-[0_0_10px_rgba(236,72,153,0.2)] ml-1 cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-pink-400" />}
        </button>
      </div>
    </header>
  );
};
