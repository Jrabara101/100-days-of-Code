import React from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import { Clock, ArrowRight, X, Sparkles } from 'lucide-react';

export default function TimeTravelBanner() {
  const { 
    unreadList, 
    timeTravelIndex, 
    showTimeTravelBanner, 
    stepTimeTravel, 
    dismissTimeTravel 
  } = useDiscussion();

  if (!showTimeTravelBanner || unreadList.length === 0) {
    return null;
  }

  const currentStep = timeTravelIndex + 1;
  const totalUnread = unreadList.length;

  return (
    <div className="w-full mb-4 p-3.5 rounded-xl bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-salon-ink-primary flex items-center gap-2">
            <span>Since You Last Visited</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold">
              +{totalUnread} new comments
            </span>
          </div>
          <p className="text-xs text-salon-ink-secondary mt-0.5">
            Key threads have evolved since your last session at 3:15 PM.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          onClick={stepTimeTravel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition-all active:scale-95"
        >
          <span>Step Through New Replies</span>
          <span className="font-mono bg-amber-700/80 px-1.5 py-0.2 rounded text-[11px]">
            ({currentStep}/{totalUnread})
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={dismissTimeTravel}
          className="p-1.5 rounded-lg text-salon-ink-muted hover:text-salon-ink-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Mark all as caught up"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

