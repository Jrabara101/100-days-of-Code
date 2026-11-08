import React, { useState } from 'react';
import { Play, Pause, AlertTriangle, CheckCircle2, RotateCcw, Video, ExternalLink, Sparkles } from 'lucide-react';
import { GradedAnswerResult } from '../../types';
import { sounds } from '../../services/audioEffects';

interface VideoRemediationCardProps {
  result: GradedAnswerResult;
  onOpenClassroom?: (lessonId: string, timestampSec: number) => void;
}

export const VideoRemediationCard: React.FC<VideoRemediationCardProps> = ({
  result,
  onOpenClassroom
}) => {
  const [isPlayingClip, setIsPlayingClip] = useState<boolean>(false);
  const [clipSeconds, setClipSeconds] = useState<number>(0);

  const startSec = result.remediation?.startSec || 252; // 04:12
  const endSec = result.remediation?.endSec || 288;     // 04:48
  const clipDuration = endSec - startSec;

  const toggleClip = () => {
    sounds.playClick();
    setIsPlayingClip(!isPlayingClip);
  };

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-5 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white dark:bg-[#171B26] shadow-md animate-in slide-in-from-top-4 duration-300">
      {/* Header Banner */}
      <div className={`p-4 flex flex-wrap items-center justify-between gap-2 border-b ${
        result.isConceptualBlindspot
          ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          : result.isCorrect
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
      }`}>
        <div className="flex items-center gap-2">
          {result.isConceptualBlindspot ? (
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          ) : result.isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          )}

          <div>
            <span className="font-bold text-xs uppercase tracking-wider block font-mono">
              {result.isConceptualBlindspot
                ? '🚨 Conceptual Blindspot Detected (100% Confident + Incorrect)'
                : result.isCorrect
                  ? '✓ Verified Concept Retention'
                  : '⚠️ Needs Targeted Remediation'}
            </span>
            <p className="text-xs opacity-90 mt-0.5">
              {result.isConceptualBlindspot
                ? 'You locked in with 100% certainty, but missed a core Raft invariant. Prioritizing for spaced review.'
                : result.isCorrect
                  ? 'Excellent mental calibration. Concept logged as mastered.'
                  : 'Enrolled in your personal Daily 3-Minute Spaced Review Deck.'}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/60 dark:bg-black/30 border border-current">
          + Enrolled in Memory Vault
        </span>
      </div>

      {/* Embedded Deep-Linked Video Remediation Player */}
      {result.remediation && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Mini Inline Video Player (5 Cols) */}
          <div className="md:col-span-5 rounded-xl bg-black overflow-hidden border border-black/10 dark:border-white/10 aspect-video relative flex flex-col justify-between p-3 text-white">
            {/* Top Chip */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-indigo-600 font-bold">
                DEEP-LINKED REMEDIATION
              </span>
              <span className="text-slate-400">
                {formatMinSec(startSec)} – {formatMinSec(endSec)} ({clipDuration}s)
              </span>
            </div>

            {/* Center Animated Visual Frame preview */}
            <div className="flex items-center justify-center my-auto">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-indigo-600/80 text-white flex items-center justify-center mx-auto hover:scale-110 cursor-pointer shadow-lg" onClick={toggleClip}>
                  {isPlayingClip ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white translate-x-0.5" />}
                </div>
                <p className="text-[10px] text-slate-300 font-mono">
                  {isPlayingClip ? 'Playing Clip...' : `Watch Instructor Explain This @ ${formatMinSec(startSec)}`}
                </p>
              </div>
            </div>

            {/* Mini Scrubber */}
            <div className="space-y-1">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: isPlayingClip ? '65%' : '0%' }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>04:12</span>
                <span>04:48</span>
              </div>
            </div>
          </div>

          {/* Right Written Breakdown (7 Cols) */}
          <div className="md:col-span-7 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Why Option A is Correct & Common Distractor Traps:
            </h4>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line bg-surface-secondary dark:bg-[#11141C] p-3.5 rounded-xl border border-black/5 dark:border-white/5">
              {result.explanationMarkdown}
            </div>

            {onOpenClassroom && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenClassroom(result.remediation!.lessonId, startSec);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1.5 pt-1"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Jump to full lecture stage at @ {formatMinSec(startSec)}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

