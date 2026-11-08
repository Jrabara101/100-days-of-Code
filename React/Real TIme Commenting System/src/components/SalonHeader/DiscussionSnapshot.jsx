import React, { useState } from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import { Sparkles, ChevronDown, ChevronUp, CornerDownRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

export default function DiscussionSnapshot() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { jumpToComment } = useDiscussion();

  return (
    <div className="w-full mb-5 rounded-2xl border border-salon-border bg-salon-nested/70 overflow-hidden transition-all">
      {/* Header bar of the Snapshot */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Intelligence Synthesis
            </span>
            <h3 className="text-sm font-semibold text-salon-ink-primary">
              "Catch Me Up" Discussion Snapshot
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-salon-ink-secondary">
          <span className="hidden sm:inline">Synthesized from 84 remarks</span>
          <div className="p-1 rounded-md text-salon-ink-muted">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expandable synthesis content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 text-xs leading-relaxed border-t border-salon-border/60">
          {/* Point 1: Core Consensus */}
          <div className="p-3 rounded-xl bg-salon-card border border-salon-border/80 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-semibold text-salon-ink-primary block">
                  Core Consensus: Indentation Depth Caps
                </span>
                <p className="text-salon-ink-secondary mt-0.5">
                  Universal agreement that indentation past level 2 degrades reading ergonomics, with eye-tracking studies proving line widths below 35ch drop comprehension speed by 42%.
                </p>
              </div>
            </div>
            <button
              onClick={() => jumpToComment('c-102')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 self-end sm:self-center"
            >
              <span>Jump to comment</span>
              <CornerDownRight className="w-3 h-3" />
            </button>
          </div>

          {/* Point 2: Key Counterpoint */}
          <div className="p-3 rounded-xl bg-salon-card border border-salon-border/80 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 p-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-semibold text-salon-ink-primary block">
                  Key Point of Debate: Viewport Buffer vs Immediate Synchronization
                </span>
                <p className="text-salon-ink-secondary mt-0.5">
                  Tension between zero-jank reading buffers and real-time collaborative speed in live settings, addressed by the author's dual-threshold delta proposal.
                </p>
              </div>
            </div>
            <button
              onClick={() => jumpToComment('c-103')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 self-end sm:self-center"
            >
              <span>Jump to comment</span>
              <CornerDownRight className="w-3 h-3" />
            </button>
          </div>

          {/* Point 3: Unanswered Inquiry */}
          <div className="p-3 rounded-xl bg-salon-card border border-salon-border/80 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 p-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-semibold text-salon-ink-primary block">
                  Top Inquiry: Gaming Semantic Intent Tags
                </span>
                <p className="text-salon-ink-secondary mt-0.5">
                  How community moderation prevents bad-faith sarcastic use of constructive tags like [🌱 Building on this].
                </p>
              </div>
            </div>
            <button
              onClick={() => jumpToComment('c-105')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 self-end sm:self-center"
            >
              <span>Jump to comment</span>
              <CornerDownRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

