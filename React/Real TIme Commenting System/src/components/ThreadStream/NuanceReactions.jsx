import React from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import { MessageSquare } from 'lucide-react';

export default function NuanceReactions({ comment, onReplyClick }) {
  const { toggleReaction } = useDiscussion();
  const reactions = comment.reactions || { changedMyMind: 0, spotOn: 0, greatSource: 0, goodQuestion: 0 };
  const userReactions = comment.userReactions || [];

  const reactionConfigs = [
    {
      key: 'changedMyMind',
      label: 'Changed My Mind',
      icon: '💡',
      activeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700 font-bold',
      weightTooltip: 'Highest quality signal (3.5x weight in High-Signal lens)'
    },
    {
      key: 'spotOn',
      label: 'Spot On',
      icon: '🎯',
      activeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-700 font-bold',
      weightTooltip: 'Resonates strongly with domain experience'
    },
    {
      key: 'greatSource',
      label: 'Great Source',
      icon: '📎',
      activeColor: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700 font-bold',
      weightTooltip: 'External citation, paper, or code repository (3.0x weight)'
    },
    {
      key: 'goodQuestion',
      label: 'Good Question',
      icon: '🤔',
      activeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700 font-bold',
      weightTooltip: 'Thoughtful provocation advancing the debate'
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2">
      {reactionConfigs.map(cfg => {
        const count = reactions[cfg.key] || 0;
        const isActive = userReactions.includes(cfg.key);

        return (
          <button
            key={cfg.key}
            onClick={() => toggleReaction(comment.id, cfg.key)}
            title={cfg.weightTooltip}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all duration-150 border select-none active:scale-95 ${
              isActive
                ? cfg.activeColor
                : 'bg-salon-nested/80 hover:bg-salon-nested border-salon-border text-salon-ink-secondary hover:text-salon-ink-primary'
            }`}
          >
            <span className="text-[13px]">{cfg.icon}</span>
            <span className="font-medium hidden sm:inline">{cfg.label}</span>
            <span className="font-mono text-[11px] font-semibold ml-0.5 tabular-nums">
              {count}
            </span>
          </button>
        );
      })}

      {/* Reply Action Pill */}
      {onReplyClick && (
        <button
          onClick={onReplyClick}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-salon-nested hover:bg-black/10 dark:hover:bg-white/10 text-salon-ink-primary border border-salon-border ml-auto transition-colors active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5 text-salon-ink-muted" />
          <span>Reply</span>
        </button>
      )}
    </div>
  );
}

