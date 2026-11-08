import React, { useState } from 'react';
import { Brain, X, CheckCircle2, RotateCcw, Video, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSpacedRepetitionScheduler } from '../../hooks/useSpacedRepetitionScheduler';
import { sounds } from '../../services/audioEffects';
import { SRSRating } from '../../types';

interface MemoryVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToRemediation?: (lessonId: string, timestampSec: number) => void;
}

export const MemoryVaultModal: React.FC<MemoryVaultModalProps> = ({
  isOpen,
  onClose,
  onJumpToRemediation
}) => {
  const {
    cards,
    currentCard,
    currentIndex,
    totalCards,
    isAnswerRevealed,
    sessionCompleted,
    revealAnswer,
    rateCard,
    refreshQueue
  } = useSpacedRepetitionScheduler();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#171B26] border border-black/10 dark:border-white/10 shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                Daily 3-Minute Memory Vault
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30">
                  SM-2 / FSRS
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Fighting the Ebbinghaus forgetting curve with targeted recall
              </p>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {sessionCompleted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Daily Retention Session Complete!
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All scheduled concepts reviewed. Decaying memory rings restored to <strong className="text-emerald-500">98% Mastery Strength</strong>.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 max-w-xs mx-auto text-xs text-emerald-700 dark:text-emerald-300 font-mono">
              +1 Day Streak Shield Momentum 🔥
            </div>
            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="mt-4 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20"
            >
              Back to Learning Hub
            </button>
          </div>
        ) : currentCard ? (
          <div className="py-4 space-y-5">
            {/* Progress counter */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">
                CARD {currentIndex + 1} OF {totalCards}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {currentCard.moduleTitle}
              </span>
            </div>

            {/* Flashcard Box */}
            <div className="p-5 rounded-2xl bg-surface-secondary dark:bg-[#11141C] border border-black/10 dark:border-white/10 min-h-[160px] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                  Recall Prompt
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {currentCard.questionPrompt}
                </p>
              </div>

              {/* Revealed Answer & Remediation */}
              {isAnswerRevealed ? (
                <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 space-y-3 animate-in fade-in duration-200">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200">
                    <span className="font-bold block mb-1">Key Conceptual Anchor:</span>
                    PACELC dictates: If Partition, choose Availability vs Consistency; Else, choose Latency vs Consistency. Heartbeat must be 10x smaller than election timeout.
                  </div>

                  {currentCard.remediationClip && (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onClose();
                        if (onJumpToRemediation) {
                          onJumpToRemediation(
                            currentCard.remediationClip!.lessonId,
                            currentCard.remediationClip!.startSec
                          );
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-indigo-500/20 transition-all"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Watch 36s Lecture Clip @ {currentCard.remediationClip.startSec}s</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={revealAnswer}
                  className="mt-4 w-full py-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:border-indigo-400 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-[#171B26] transition-all shadow-xs"
                >
                  Show Answer & Remediation
                </button>
              )}
            </div>

            {/* Metacognitive Rating Choices (FSRS / SM-2) */}
            {isAnswerRevealed && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 block text-center">
                  How well did you recall this concept?
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => rateCard('again')}
                    className="p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-semibold text-center transition-all"
                  >
                    <span className="block font-bold">Again</span>
                    <span className="text-[10px] opacity-75 font-mono">&lt;10m</span>
                  </button>

                  <button
                    onClick={() => rateCard('hard')}
                    className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-semibold text-center transition-all"
                  >
                    <span className="block font-bold">Hard</span>
                    <span className="text-[10px] opacity-75 font-mono">2d</span>
                  </button>

                  <button
                    onClick={() => rateCard('good')}
                    className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-semibold text-center transition-all"
                  >
                    <span className="block font-bold">Good</span>
                    <span className="text-[10px] opacity-75 font-mono">5d</span>
                  </button>

                  <button
                    onClick={() => rateCard('easy')}
                    className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold text-center transition-all"
                  >
                    <span className="block font-bold">Easy</span>
                    <span className="text-[10px] opacity-75 font-mono">12d</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

