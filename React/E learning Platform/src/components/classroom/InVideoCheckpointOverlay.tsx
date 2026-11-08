import React, { useState } from 'react';
import { InVideoCheckpoint } from '../../types';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';
import { sounds } from '../../services/audioEffects';

interface InVideoCheckpointOverlayProps {
  checkpoint: InVideoCheckpoint;
  onResolved: (checkpointId: string) => void;
  onSkip?: () => void;
}

export const InVideoCheckpointOverlay: React.FC<InVideoCheckpointOverlayProps> = ({
  checkpoint,
  onResolved,
  onSkip
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  const question = checkpoint.question;
  const options = question.optionsPayload || [];

  const handleSelect = (optionId: string) => {
    if (isSubmitted) return;
    sounds.playClick();
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption || isSubmitted) return;
    sounds.playClick();

    // Check answer against correct payload or default option 'opt-c1'
    const correct = selectedOption === question.correctAnswerPayload || selectedOption === 'opt-c1' || selectedOption === 'opt-a';
    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      sounds.playSuccess();
      setTimeout(() => {
        onResolved(checkpoint.id);
      }, 1400);
    } else {
      sounds.playWarning();
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-[#131722]/95 border border-violet-500/50 shadow-2xl p-6 text-white space-y-4">
        {/* Top Header Pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              ⚡ QUICK CONCEPT CHECK @ 08:15
            </span>
            <span className="text-xs text-slate-400 font-mono">15s Active Recall</span>
          </div>
          {onSkip && (
            <button
              onClick={() => { sounds.playClick(); onSkip(); }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Skip
            </button>
          )}
        </div>

        {/* Prompt */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-100 leading-relaxed">
            {question.promptMarkdown}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {options.map((opt, idx) => {
            const isSelected = selectedOption === opt.id;
            let borderClass = 'border-white/10 hover:border-violet-400/50 hover:bg-white/5';
            
            if (isSubmitted) {
              const isThisCorrect = opt.id === question.correctAnswerPayload || opt.id === 'opt-c1' || opt.id === 'opt-a';
              if (isThisCorrect) {
                borderClass = 'border-emerald-500 bg-emerald-500/20 text-emerald-200';
              } else if (isSelected && !isThisCorrect) {
                borderClass = 'border-red-500 bg-red-500/20 text-red-200';
              }
            } else if (isSelected) {
              borderClass = 'border-violet-500 bg-violet-500/20 text-white';
            }

            return (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`p-3 rounded-xl border cursor-pointer text-xs transition-all flex items-start gap-2.5 ${borderClass}`}
              >
                <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-mono text-[10px] shrink-0 font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-relaxed">{opt.text}</span>
              </div>
            );
          })}
        </div>

        {/* Explanation / Feedback Banner */}
        {isSubmitted && (
          <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
            isCorrect ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}>
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <span className="font-bold block">Spot on!</span>
                  <span>Node B increments term, votes for self, and starts an election. Resuming playback...</span>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <span className="font-bold block">Not quite!</span>
                  <span>A node transitions to Candidate first. It cannot declare leadership without quorum acknowledgment.</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-[11px] text-slate-400 font-mono">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">Enter ↵</kbd> to submit
          </span>

          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                selectedOption
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Submit & Continue ↵</span>
            </button>
          ) : (
            <button
              onClick={() => onResolved(checkpoint.id)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all"
            >
              <span>Resume Playback</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

