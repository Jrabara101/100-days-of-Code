import React from 'react';
import { RotateCcw, X, Sparkles, BookOpen } from 'lucide-react';
import { usePodcast } from '../context/PodcastContext';

export const ResumeBanner: React.FC = () => {
  const { 
    showResumeBanner, 
    lastPausedChapter, 
    resumeAndRecap, 
    dismissResumeBanner,
    currentEpisode
  } = usePodcast();

  if (!showResumeBanner || !lastPausedChapter) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 via-[var(--canvas-console)] to-amber-500/5 border-b border-amber-500/20 px-4 sm:px-8 py-3 transition-all animate-fadeIn">
      <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        
        {/* Left Info & Chapter Summary */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--text-primary)]">
                Welcome back to EP. {currentEpisode.number}
              </span>
              <span className="font-mono-tabular text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                Paused at {lastPausedChapter.title}
              </span>
            </div>
            <p className="text-[var(--text-secondary)] mt-0.5 line-clamp-1">
              <span className="text-amber-500/80 font-medium">Recap: </span>
              {lastPausedChapter.summary || 'Picking up where the conversation explored tactical founder leverage.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            onClick={resumeAndRecap}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Rewind 30s & Resume</span>
          </button>
          
          <button
            onClick={dismissResumeBanner}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
