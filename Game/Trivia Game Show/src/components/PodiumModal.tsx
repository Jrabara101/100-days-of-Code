import React from 'react';
import { Trophy, Skull, RotateCcw, Award, ShieldCheck } from 'lucide-react';
import { EngineSnapshot } from '../engine/types';
import { TriviaGameshowEngine } from '../engine/TriviaGameshowEngine';

interface PodiumModalProps {
  engine: TriviaGameshowEngine;
  state: EngineSnapshot;
}

export const PodiumModal: React.FC<PodiumModalProps> = ({ engine, state }) => {
  const { phase, totalScore, safeHavenScore, streak, tierIndex } = state;
  const isVictory = phase === 'VICTORY';

  if (phase !== 'GAME_OVER' && phase !== 'VICTORY') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-[#050714]/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full text-center border-2 border-cyan-400/50 shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col gap-5">
        {/* Header Icon */}
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-2xl p-0.5 shadow-xl flex items-center justify-center ${
            isVictory
              ? 'bg-gradient-to-tr from-amber-400 to-pink-500 text-amber-300'
              : 'bg-gradient-to-tr from-rose-500 to-purple-800 text-rose-300'
          }`}>
            <div className="w-full h-full bg-[#090a1a] rounded-[14px] flex items-center justify-center">
              {isVictory ? <Trophy className="w-8 h-8 text-amber-400" /> : <Skull className="w-8 h-8 text-rose-500" />}
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className={`font-righteous text-2xl sm:text-3xl uppercase tracking-wider ${
            isVictory ? 'text-amber-400 gold-glow' : 'text-rose-500'
          }`}>
            {isVictory ? 'GRAND CHAMPION!' : 'BROADCAST TERMINATED'}
          </h2>
          <p className="font-crt text-slate-300 text-base mt-1">
            {isVictory
              ? 'Flawless execution! You conquered all 10 tiers of the tournament!'
              : `Eliminated at Tier ${tierIndex + 1}. The live studio audience salutes your attempt.`}
          </p>
        </div>

        {/* Financial Settlement Breakdown */}
        <div className="bg-[#0b0e28] p-4 rounded-2xl border border-purple-900/60 flex flex-col gap-3 text-left">
          <div className="flex justify-between items-center">
            <span className="font-arcade text-[9px] text-slate-400">TOTAL BANK SCORE</span>
            <span className="font-crt text-xl font-bold text-emerald-400">
              ${totalScore.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center border-t border-purple-950 pt-2">
            <span className="font-arcade text-[9px] text-cyan-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              GUARANTEED SAFE PAYOUT
            </span>
            <span className="font-crt text-lg font-bold text-cyan-300">
              ${(isVictory ? totalScore : safeHavenScore).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center border-t border-purple-950 pt-2">
            <span className="font-arcade text-[9px] text-amber-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              PEAK ACCURACY STREAK
            </span>
            <span className="font-crt text-lg font-bold text-amber-400">
              {streak}X MULTIPLIER
            </span>
          </div>
        </div>

        {/* Restart Action */}
        <button
          onClick={() => engine.reset()}
          className="w-full py-3.5 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-400 hover:opacity-95 text-white font-arcade text-xs font-bold uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(236,72,153,0.5)] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Insert Coin // Play New Broadcast</span>
        </button>
      </div>
    </div>
  );
};
