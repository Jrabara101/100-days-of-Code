import React from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import { MessageSquare } from 'lucide-react';

export default function PassagePin({ paragraphId, count }) {
  const { selectedParagraphId, setSelectedParagraphId } = useDiscussion();
  const isSelected = selectedParagraphId === paragraphId;

  return (
    <button
      onClick={() => setSelectedParagraphId(isSelected ? null : paragraphId)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
        isSelected
          ? 'bg-amber-500 text-white shadow-md scale-105'
          : count > 0
            ? 'bg-salon-nested hover:bg-amber-100 dark:hover:bg-amber-950/50 text-salon-ink-secondary hover:text-amber-800 dark:hover:text-amber-300 border border-salon-border'
            : 'opacity-40 hover:opacity-100 bg-salon-nested text-salon-ink-muted'
      }`}
      title={`${count} comments anchored to this passage`}
    >
      <MessageSquare className="w-3 h-3" />
      <span className="font-mono text-[11px] font-bold">{count}</span>
    </button>
  );
}

