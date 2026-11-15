import { useState } from 'react';
import { ArrowUpRight, Pin, X } from 'lucide-react';
import type { Conversation, Message } from '../../types/chat';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';

interface PinnedMessageBarProps {
  conversation: Conversation;
  messages: Message[];
  onJumpToMessage: (messageId: string) => void;
}

export function PinnedMessageBar({
  conversation,
  messages,
  onJumpToMessage,
}: PinnedMessageBarProps) {
  const [pinIndex, setPinIndex] = useState(0);
  const dismissed = useChatWorkspaceStore(
    (s) => s.dismissedPinnedBannerByConv[conversation.id]
  );
  const dismissPinnedBanner = useChatWorkspaceStore((s) => s.dismissPinnedBanner);

  const pinnedMessages = conversation.pinnedMessageIds
    .map((id) => messages.find((m) => m.id === id))
    .filter((m): m is Message => Boolean(m));

  if (dismissed || pinnedMessages.length === 0) return null;

  const safeIdx = pinIndex % pinnedMessages.length;
  const activePin = pinnedMessages[safeIdx];

  return (
    <div className="shrink-0 h-9 px-4 md:px-5 bg-surface-secondary/90 border-b border-divider flex items-center justify-between gap-3 text-xs">
      <button
        type="button"
        onClick={() => setPinIndex((i) => (i + 1) % pinnedMessages.length)}
        className="flex items-center gap-2.5 min-w-0 text-left group"
        title="Click to cycle pinned messages"
      >
        <span className="w-1 h-4 rounded-full bg-blue-500 shrink-0" />
        <span className="tabular-nums-meta inline-flex items-center gap-1 font-semibold text-blue-500 shrink-0">
          <Pin className="w-3 h-3" />
          Pinned #{safeIdx + 1} of {pinnedMessages.length}:
        </span>
        <span className="text-txt-primary truncate group-hover:text-blue-400 transition-colors">
          {activePin.content || '[Attachment]'}
        </span>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onJumpToMessage(activePin.id)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-medium transition-colors"
        >
          <span className="hidden sm:inline">Jump to message</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => dismissPinnedBanner(conversation.id)}
          aria-label="Dismiss pinned bar"
          className="p-1 rounded hover:bg-surface-tertiary text-txt-muted hover:text-txt-primary"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

