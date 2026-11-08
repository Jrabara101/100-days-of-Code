import React from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import { Sparkles, UserCheck, Scale, Flame, Clock } from 'lucide-react';

export default function PerspectiveLenses() {
  const { activeLens, setActiveLens, activeTypingThreadIds } = useDiscussion();

  const lenses = [
    {
      id: 'high-signal',
      label: 'High-Signal & Nuanced',
      icon: Sparkles,
      description: 'Weighted by changed minds and epistemic citations'
    },
    {
      id: 'author-expert',
      label: 'Author & Expert Replies',
      icon: UserCheck,
      description: 'Threads where the author or verified architects replied'
    },
    {
      id: 'counterpoints',
      label: 'Constructive Counterpoints',
      icon: Scale,
      description: 'Respectful devil\'s-advocate and alternative paradigms'
    },
    {
      id: 'live-now',
      label: 'Live Right Now',
      icon: Flame,
      badge: activeTypingThreadIds.length > 0 ? `${activeTypingThreadIds.length} active` : null,
      description: 'High real-time back-and-forth typing velocity'
    },
    {
      id: 'newest',
      label: 'Newest',
      icon: Clock,
      description: 'Strict chronological stream'
    }
  ];

  return (
    <div className="w-full mb-6">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {lenses.map((lens) => {
          const Icon = lens.icon;
          const isActive = activeLens === lens.id;
          return (
            <button
              key={lens.id}
              onClick={() => setActiveLens(lens.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-salon-ink-primary text-salon-card shadow-sm scale-[1.02]'
                  : 'bg-salon-nested text-salon-ink-secondary hover:text-salon-ink-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.05] border border-salon-border'
              }`}
              title={lens.description}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300 dark:text-amber-400' : 'text-salon-ink-muted'}`} />
              <span>{lens.label}</span>
              {lens.badge && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  {lens.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

