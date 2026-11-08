import React from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import { ArrowDown, Sparkles } from 'lucide-react';

export default function ActivityPill() {
  const { pendingDeltaBuffer, flowInPendingBuffer } = useDiscussion();

  if (!pendingDeltaBuffer || pendingDeltaBuffer.length === 0) {
    return null;
  }

  const count = pendingDeltaBuffer.length;
  // Get unique avatars of authors in pending buffer
  const authors = Array.from(new Set(pendingDeltaBuffer.map(item => item.author?.avatar).filter(Boolean))).slice(0, 3);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
      <button
        onClick={flowInPendingBuffer}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-900/90 dark:bg-zinc-800/95 text-white shadow-2xl backdrop-blur-md border border-white/15 hover:bg-zinc-900 transition-all active:scale-95 group hover:ring-2 hover:ring-emerald-400/50"
      >
        {/* Pulsing emerald live dot */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>

        {/* Mini avatar stack */}
        <div className="flex -space-x-1.5 overflow-hidden">
          {authors.map((avatar, idx) => (
            <img
              key={idx}
              src={avatar}
              alt="Contributor"
              className="inline-block h-5 w-5 rounded-full ring-1 ring-zinc-900 object-cover"
            />
          ))}
        </div>

        {/* Text */}
        <span className="text-xs font-semibold tracking-wide">
          <span className="font-mono text-emerald-400 mr-1">+{count}</span>
          <span>New {count === 1 ? 'Reply' : 'Replies'} in thread</span>
          <span className="text-zinc-400 ml-1.5 font-normal hidden sm:inline">— Click to Flow In</span>
        </span>

        <ArrowDown className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
}

