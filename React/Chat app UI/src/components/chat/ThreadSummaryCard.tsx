import { ChevronRight } from 'lucide-react';
import type { Message } from '../../types/chat';
import { cn, formatRelativeTime } from '../../lib/utils';

interface ThreadSummaryCardProps {
  message: Message;
  isActiveThread: boolean;
  onOpenThread: () => void;
}

export function ThreadSummaryCard({
  message,
  isActiveThread,
  onOpenThread,
}: ThreadSummaryCardProps) {
  if (message.replyCount <= 0) return null;

  const participants = message.threadParticipants.slice(0, 4);

  return (
    <button
      type="button"
      onClick={onOpenThread}
      className={cn(
        'mt-1.5 w-full max-w-[440px] rounded-xl border px-3 py-2 flex items-center gap-2.5 text-left transition-all duration-150 group',
        isActiveThread
          ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 ring-1 ring-[#8B5CF6]/40'
          : 'border-[#8B5CF6]/30 bg-[#8B5CF6]/5 hover:bg-[#8B5CF6]/10'
      )}
    >
      {/* Curved SVG Branch Connector */}
      <svg
        width="14"
        height="16"
        viewBox="0 0 14 16"
        fill="none"
        className="shrink-0 text-[#8B5CF6]"
        aria-hidden="true"
      >
        <path
          d="M2 1V9C2 11.7614 4.23858 14 7 14H13"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>

      {/* Overlapping Participant Mini-Avatars (20px) */}
      {participants.length > 0 && (
        <div className="flex items-center -space-x-1.5 shrink-0">
          {participants.map((p) => (
            <img
              key={p.id}
              src={p.avatarUrl}
              alt={p.displayName}
              title={p.displayName}
              className="w-5 h-5 rounded-full object-cover ring-2 ring-canvas"
            />
          ))}
        </div>
      )}

      {/* Reply Count & Latest Snippet */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="tabular-nums-meta font-bold text-[#8B5CF6] shrink-0">
            {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
          </span>
          {message.lastThreadReplyAt && (
            <span className="tabular-nums-meta text-[10px] text-txt-muted shrink-0">
              {formatRelativeTime(message.lastThreadReplyAt)}
            </span>
          )}
        </div>
        {message.latestThreadSnippet && (
          <p className="text-[11px] text-txt-muted truncate mt-0.5">
            {message.latestThreadSnippet}
          </p>
        )}
      </div>

      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#8B5CF6] shrink-0 group-hover:translate-x-0.5 transition-transform">
        <span className="hidden sm:inline">View thread</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}

