import React from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import ThreadCard from './ThreadCard';
import { MessageSquare, Sparkles } from 'lucide-react';

export default function TownSquareView() {
  const { visibleComments, activeLens, selectedParagraphId, setSelectedParagraphId } = useDiscussion();

  return (
    <div className="w-full space-y-5">
      {/* If filtering by a specific paragraph in margin mode or click */}
      {selectedParagraphId && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <span>
            Filtering discussion anchored to <strong className="font-mono">{selectedParagraphId.toUpperCase()}</strong>
          </span>
          <button
            onClick={() => setSelectedParagraphId(null)}
            className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
          >
            Show All Paragraphs
          </button>
        </div>
      )}

      {/* Comment List */}
      {visibleComments.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-salon-border bg-salon-nested/30 space-y-2">
          <MessageSquare className="w-8 h-8 text-salon-ink-muted mx-auto opacity-50" />
          <h4 className="text-sm font-semibold text-salon-ink-primary">
            No remarks match the current lens
          </h4>
          <p className="text-xs text-salon-ink-secondary max-w-sm mx-auto">
            Try switching to the <em>High-Signal</em> or <em>Newest</em> lens, or contribute the first perspective below.
          </p>
        </div>
      ) : (
        visibleComments.map(comment => (
          <ThreadCard
            key={comment.id}
            comment={comment}
            depth={0}
          />
        ))
      )}
    </div>
  );
}

