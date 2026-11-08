import React from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import ThreadCard from '../ThreadStream/ThreadCard';
import { MessageSquare, X, Filter } from 'lucide-react';

export default function MarginAnnotationDrawer() {
  const { 
    visibleComments, 
    selectedParagraphId, 
    setSelectedParagraphId,
    comments 
  } = useDiscussion();

  // Filter comments specifically for the active margin selection if one is active
  const marginComments = selectedParagraphId
    ? comments.filter(c => c.paragraphId === selectedParagraphId)
    : visibleComments;

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Drawer Header */}
      <div className="p-4 rounded-2xl bg-salon-card border border-salon-border shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-salon-ink-primary">
            {selectedParagraphId ? `Passage ${selectedParagraphId.toUpperCase()} Notes` : "Live Margin Feed"}
          </h3>
          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-salon-nested text-salon-ink-muted">
            {marginComments.length}
          </span>
        </div>

        {selectedParagraphId && (
          <button
            onClick={() => setSelectedParagraphId(null)}
            className="text-xs text-salon-ink-muted hover:text-salon-ink-primary flex items-center gap-1"
          >
            <span>All Pins</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Margin Comments List */}
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
        {marginComments.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-salon-nested/40 border border-dashed border-salon-border text-xs text-salon-ink-secondary">
            No remarks anchored to this paragraph yet. Highlight any sentence to start a note.
          </div>
        ) : (
          marginComments.map(comment => (
            <ThreadCard
              key={comment.id}
              comment={comment}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  );
}

