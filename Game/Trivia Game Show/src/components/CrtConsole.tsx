import React from 'react';
import { Cpu, Terminal, Lock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { EngineSnapshot } from '../engine/types';
import { TriviaGameshowEngine } from '../engine/TriviaGameshowEngine';
import { PRIZE_LADDER } from '../data/triviaData';

interface CrtConsoleProps {
  engine: TriviaGameshowEngine;
  state: EngineSnapshot;
}

export const CrtConsole: React.FC<CrtConsoleProps> = ({ engine, state }) => {
  const {
    phase,
    tierIndex,
    question,
    remainingMs,
    totalDuration,
    selectedOption,
    isCorrect,
    roundPoints,
    streak,
    hiddenOptions,
    isFrozen
  } = state;

  const currentTier = PRIZE_LADDER[tierIndex] || PRIZE_LADDER[PRIZE_LADDER.length - 1];
  const timerRatio = Math.max(0, remainingMs / totalDuration);
  const formattedTime = (remainingMs / 1000).toFixed(1);

  return (
    <section className="flex-1 flex flex-col gap-4 justify-center">
      {/* High-Tension Monotonic Pressure Bar & Telemetry */}
      <div className="w-full glass-panel rounded-2xl p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-3 border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-600 p-0.5">
            <div className="w-full h-full bg-[#090a1a] rounded-[6px] flex items-center justify-center font-arcade text-cyan-300 text-xs">
              #{String(tierIndex + 1).padStart(2, '0')}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-righteous text-white text-base md:text-lg">SYNTH CONTENDER 1P</span>
              <span className="font-arcade text-[8px] bg-pink-500/20 border border-pink-500 text-pink-300 px-1.5 py-0.5 rounded">
                ACTIVE
              </span>
            </div>
            <p className="font-crt text-purple-300 text-sm">
              BOUNTY TIER {tierIndex + 1} OF 10 // {currentTier.safe ? '🛡️ SAFE HAVEN CHECKPOINT' : 'STANDARD TIER'}
            </p>
          </div>
        </div>

        {/* Monotonic Countdown Clock Display */}
        <div className="flex flex-col items-center md:items-end w-full md:w-64 gap-1.5">
          <div className="flex items-center justify-between w-full font-arcade text-xs">
            <span className="flex items-center gap-1 text-rose-400">
              <span className={`w-2 h-2 rounded-full ${isFrozen ? 'bg-cyan-400 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
              <span className="text-[9px]">{isFrozen ? 'TIME FROZEN' : 'PRESSURE CLOCK'}</span>
            </span>
            <span className={`text-base md:text-lg font-bold tabular-nums ${
              isFrozen ? 'text-cyan-300' : timerRatio < 0.25 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
            }`}>
              {formattedTime}s
            </span>
          </div>

          <div className="w-full h-2.5 bg-black/80 rounded-full border border-purple-900/60 overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-75 shadow-lg ${
                isFrozen
                  ? 'bg-cyan-400 animate-pulse shadow-[0_0_12px_#06b6d4]'
                  : timerRatio > 0.5
                  ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]'
                  : timerRatio > 0.25
                  ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'
                  : 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
              }`}
              style={{ width: `${timerRatio * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cathode-Ray Tube (CRT) Trivia Console */}
      <div className="crt-screen p-6 md:p-8 border-4 border-purple-500/50 relative shadow-[0_0_50px_rgba(139,92,246,0.3)]">
        {/* CRT Top Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-purple-500/30 relative z-25">
          <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-500/40 px-3 py-1 rounded-lg">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-arcade text-[9px] text-cyan-300 uppercase tracking-wider">
              {question.category}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-pink-950/50 border border-pink-500/50 px-3 py-1 rounded-lg">
            <span className="font-arcade text-[9px] text-amber-400 font-bold uppercase tracking-wider">
              TIER {question.tier} • ${currentTier.bounty.toLocaleString()} BOUNTY
            </span>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="py-6 md:py-8 relative z-25">
          <div className="font-arcade text-[10px] text-pink-400 mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 animate-pulse text-pink-400" />
            <span>QUESTION READY // DECODE HARDWARE & SYSTEM DATA:</span>
          </div>

          <h2 className="font-righteous text-xl sm:text-2xl md:text-3xl text-white tracking-wide leading-relaxed retro-glitch-text min-h-[70px] flex items-center">
            {question.question}
          </h2>
        </div>

        {/* Staging Overlay during QUESTION_INTRO */}
        {phase === 'INTRO' && (
          <div className="absolute inset-0 bg-[#070818]/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center gap-2">
            <span className="font-arcade text-xs md:text-sm text-cyan-400 tracking-widest uppercase animate-pulse">
              SYNCHRONIZING QUESTION TIMERS...
            </span>
            <span className="font-crt text-slate-400 text-lg">
              1.2s Anti-Latency Reading Lock Active
            </span>
          </div>
        )}

        {/* 2x2 Tactile Keycap Answer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 relative z-25">
          {question.options.map((opt, idx) => {
            const isHidden = hiddenOptions.includes(idx);
            const isSelected = selectedOption === idx;
            const isAnswerCorrect = idx === question.correct;
            const keyLetter = String.fromCharCode(65 + idx);
            const keyNum = idx + 1;
            const pollPercent = question.pollPercentages[idx];

            if (isHidden) {
              return (
                <div
                  key={idx}
                  className="h-20 rounded-2xl border-2 border-dashed border-slate-800/60 bg-[#070818]/40 opacity-20 flex items-center justify-center font-arcade text-xs text-slate-600"
                >
                  [PRUNED BY 50:50]
                </div>
              );
            }

            let cardStyle = "bg-[#0f1230]/90 border-slate-700/60 text-slate-200 hover:border-cyan-400 hover:bg-[#151945]";

            if (phase === 'LOCKED' && isSelected) {
              cardStyle = "bg-amber-500/25 border-amber-400 text-amber-300 ring-2 ring-amber-400/50 animate-pulse";
            } else if (phase === 'REVEAL') {
              if (isAnswerCorrect) {
                cardStyle = "bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold ring-2 ring-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.4)]";
              } else if (isSelected && !isAnswerCorrect) {
                cardStyle = "bg-rose-500/30 border-rose-500 text-rose-300 line-through ring-2 ring-rose-500/50";
              } else {
                cardStyle = "opacity-35 bg-slate-950/70 border-slate-800 text-slate-500";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => engine.handleSelectOption(idx)}
                disabled={phase !== 'COUNTDOWN'}
                className={`keycap-btn group relative text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden cursor-pointer ${cardStyle}`}
              >
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    {/* Retro Keycap Badge */}
                    <span className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-600 text-cyan-300 font-arcade text-xs flex items-center justify-center shrink-0 group-hover:border-cyan-400 group-hover:text-white transition-colors">
                      [{keyNum}]
                    </span>
                    <div>
                      <span className="font-righteous text-base sm:text-lg text-white tracking-wider block">
                        {opt}
                      </span>
                      <span className="font-crt text-xs text-slate-400 tracking-widest">
                        [{keyLetter}] OPTION
                      </span>
                    </div>
                  </div>

                  {/* Badges for Locked / Reveal state */}
                  {phase === 'LOCKED' && isSelected && (
                    <div className="flex items-center gap-1 text-amber-400 bg-black/60 border border-amber-400/60 px-2 py-0.5 rounded text-[10px] font-arcade">
                      <Lock className="w-3 h-3 animate-spin" />
                      <span>LOCKED</span>
                    </div>
                  )}

                  {phase === 'REVEAL' && isAnswerCorrect && (
                    <div className="flex items-center gap-1 text-emerald-400 bg-black/60 border border-emerald-400 px-2 py-0.5 rounded text-[10px] font-arcade">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>CORRECT</span>
                    </div>
                  )}

                  {phase === 'REVEAL' && isSelected && !isAnswerCorrect && (
                    <div className="flex items-center gap-1 text-rose-400 bg-black/60 border border-rose-400 px-2 py-0.5 rounded text-[10px] font-arcade">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>MISS</span>
                    </div>
                  )}
                </div>

                {/* Simulated Audience Confidence Bar */}
                <div className="mt-3 pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs w-full">
                  <div className="flex items-center gap-2 w-3/4">
                    <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pollPercent}%` }}
                      />
                    </div>
                    <span className="font-arcade text-[8px] text-slate-400 font-bold w-6">
                      {pollPercent}%
                    </span>
                  </div>
                  <span className="font-arcade text-[7px] text-slate-500 uppercase">
                    AUDIENCE
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dramatic Reveal Ribbon */}
      {phase === 'REVEAL' && (
        <div className="glass-panel p-4 md:p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 border border-cyan-400/40 shadow-2xl animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm md:text-base font-black tracking-wider uppercase font-arcade ${
                isCorrect ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isCorrect ? `CORRECT! +$${roundPoints.toLocaleString()}` : 'INCORRECT ANSWER!'}
              </span>
              {isCorrect && streak > 1 && (
                <span className="text-[10px] font-arcade bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded">
                  🔥 {streak}X STREAK
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {question.explanation}
            </p>
            <p className="font-crt text-cyan-300 text-sm mt-0.5">
              {isCorrect
                ? `Time Bonus Awarded: ${Math.round(timerRatio * 100)}% speed scalar applied`
                : currentTier.safe
                ? 'Safe haven checkpoint locked into your earnings.'
                : 'Fell before safe haven floor.'}
            </p>
          </div>

          <button
            onClick={() => engine.proceedNext()}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan-400 to-pink-500 hover:from-cyan-300 hover:to-pink-400 text-slate-950 font-arcade text-xs font-bold uppercase rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <span>{isCorrect ? 'Advance Next Tier' : 'View Settlement'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};
