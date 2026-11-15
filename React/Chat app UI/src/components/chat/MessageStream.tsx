import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import type { Conversation, Message } from '../../types/chat';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { formatDateCapsule } from '../../lib/utils';
import { MessageBubble } from './MessageBubble';

type StreamItem =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'unread_horizon'; key: string; count: number }
  | { kind: 'message'; key: string; message: Message; showHeader: boolean };

interface MessageStreamProps {
  conversation: Conversation;
  messages: Message[];
  hasPreviousPage?: boolean;
  isFetchingPreviousPage?: boolean;
  onLoadMorePrevious?: () => void;
  onQuote: (msg: Message) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onEditMessage: (msgId: string, content: string) => void;
  onVotePoll: (msgId: string, optionId: string) => void;
  onTogglePin: (msgId: string) => void;
  onToggleBookmark: (msgId: string) => void;
  jumpTargetId: string | null;
  onClearJumpTarget: () => void;
}

export function MessageStream({
  conversation,
  messages,
  hasPreviousPage,
  isFetchingPreviousPage,
  onLoadMorePrevious,
  onQuote,
  onToggleReaction,
  onEditMessage,
  onVotePoll,
  onTogglePin,
  onToggleBookmark,
  jumpTargetId,
  onClearJumpTarget,
}: MessageStreamProps) {
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const usersById = usePresenceStore((s) => s.usersById);
  const whispers = usePresenceStore((s) => s.whispers[conversation.id] ?? []);

  const activeThreadId = useChatWorkspaceStore((s) => s.activeThreadId);
  const rightPaneMode = useChatWorkspaceStore((s) => s.rightPaneMode);
  const openThreadDrawer = useChatWorkspaceStore((s) => s.openThreadDrawer);
  const highlightedMessageId = useChatWorkspaceStore((s) => s.highlightedMessageId);
  const flashMessageAnchor = useChatWorkspaceStore((s) => s.flashMessageAnchor);
  const bookmarkedIds = useChatWorkspaceStore((s) => s.bookmarkedIds);
  const scrollOffsets = useChatWorkspaceStore((s) => s.scrollOffsets);
  const setScrollOffset = useChatWorkspaceStore((s) => s.setScrollOffset);

  const meMember = conversation.members.find((m) => m.userId === currentUserId);
  const [sessionAnchorByConv, setSessionAnchorByConv] = useState<Record<string, string | null>>({});
  const [showBottomJump, setShowBottomJump] = useState(false);

  // Capture unread anchor once per conversation visit so "N New Messages" remains visible
  useEffect(() => {
    setSessionAnchorByConv((prev) => {
      if (conversation.id in prev) return prev;
      return {
        ...prev,
        [conversation.id]:
          (meMember?.unreadCount ?? 0) > 0 ? meMember?.lastReadMessageId ?? null : null,
      };
    });
  }, [conversation.id, meMember?.unreadCount, meMember?.lastReadMessageId]);

  const activeLastReadId = sessionAnchorByConv[conversation.id] ?? null;

  const messageById = useMemo(() => {
    const map = new Map<string, Message>();
    for (const m of messages) map.set(m.id, m);
    return map;
  }, [messages]);

  const { items, unreadCount, firstUnreadIdx, firstMentionId } = useMemo(() => {
    const out: StreamItem[] = [];
    let lastDateStr = '';
    let prevSenderId = '';
    let prevTimeMs = 0;

    const anchorIdx = activeLastReadId
      ? messages.findIndex((m) => m.id === activeLastReadId)
      : -1;
    const unreadSlice =
      anchorIdx !== -1 && anchorIdx < messages.length - 1
        ? messages.slice(anchorIdx + 1)
        : [];
    const unreadTotal = unreadSlice.length;
    let unreadHorizonIndex = -1;
    let mentionMsgId: string | null = null;

    const myUser = usersById[currentUserId];
    const myHandle = myUser?.handle.toLowerCase() ?? '@river';

    messages.forEach((msg, idx) => {
      const d = new Date(msg.createdAt);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (dayKey !== lastDateStr) {
        out.push({
          kind: 'date',
          key: `date-${dayKey}`,
          label: formatDateCapsule(msg.createdAt),
        });
        lastDateStr = dayKey;
        prevSenderId = '';
      }

      if (anchorIdx !== -1 && idx === anchorIdx + 1 && unreadTotal > 0) {
        unreadHorizonIndex = out.length;
        out.push({
          kind: 'unread_horizon',
          key: `unread-horizon-${msg.id}`,
          count: unreadTotal,
        });
        prevSenderId = '';
      }

      if (
        !mentionMsgId &&
        msg.senderId !== currentUserId &&
        msg.content.toLowerCase().includes(myHandle)
      ) {
        mentionMsgId = msg.id;
      }

      const timeMs = d.getTime();
      const within3Min = timeMs - prevTimeMs <= 3 * 60_000;
      const showHeader = msg.senderId !== prevSenderId || !within3Min;

      out.push({
        kind: 'message',
        key: msg.id,
        message: msg,
        showHeader,
      });

      prevSenderId = msg.senderId;
      prevTimeMs = timeMs;
    });

    return {
      items: out,
      unreadCount: unreadTotal,
      firstUnreadIdx: unreadHorizonIndex,
      firstMentionId: mentionMsgId,
    };
  }, [messages, activeLastReadId, currentUserId, usersById]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const item = items[index];
      if (!item) return 76;
      if (item.kind === 'date' || item.kind === 'unread_horizon') return 40;
      return item.message.attachments.length > 0 ? 220 : item.message.replyCount > 0 ? 140 : 78;
    },
    overscan: 10,
  });

  // Restore saved scroll position or scroll to unread horizon / latest on conversation switch
  const lastConvScrolledRef = useRef<string | null>(null);
  useEffect(() => {
    if (items.length === 0) return;
    if (lastConvScrolledRef.current === conversation.id) return;
    lastConvScrolledRef.current = conversation.id;

    const savedOffset = scrollOffsets[conversation.id];
    requestAnimationFrame(() => {
      if (typeof savedOffset === 'number' && savedOffset > 0 && scrollRef.current) {
        scrollRef.current.scrollTop = savedOffset;
      } else if (firstUnreadIdx !== -1) {
        virtualizer.scrollToIndex(Math.max(0, firstUnreadIdx - 1), { align: 'start' });
      } else {
        virtualizer.scrollToIndex(items.length - 1, { align: 'end' });
      }
    });
  }, [conversation.id, items.length, firstUnreadIdx, scrollOffsets, virtualizer]);

  // Auto-scroll on newly arrived message if already near bottom
  const prevLenRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      const el = scrollRef.current;
      const nearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 220 : true;
      if (nearBottom && items.length > 0) {
        requestAnimationFrame(() => {
          virtualizer.scrollToIndex(items.length - 1, { align: 'end', behavior: 'smooth' });
        });
      }
    }
    prevLenRef.current = messages.length;
  }, [messages.length, items.length, virtualizer]);

  // External Jump Target handler
  const jumpToMessage = (messageId: string) => {
    const idx = items.findIndex((it) => it.kind === 'message' && it.message.id === messageId);
    if (idx !== -1) {
      virtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
      flashMessageAnchor(messageId);
    }
  };

  useEffect(() => {
    if (jumpTargetId) {
      jumpToMessage(jumpTargetId);
      onClearJumpTarget();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpTargetId]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollOffset(conversation.id, el.scrollTop);
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowBottomJump(distFromBottom > 260);
  };

  const activeWhispers = whispers.filter((w) => w.kind !== 'thread_typing');

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      {/* Floating Mention / Unread Jump Pills */}
      <div className="pointer-events-none absolute top-3 right-5 z-20 flex flex-col items-end gap-1.5">
        {firstMentionId && (
          <button
            type="button"
            onClick={() => jumpToMessage(firstMentionId)}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444] hover:bg-rose-500 text-white text-[11px] font-semibold shadow-lg transition-transform active:scale-95"
          >
            <ArrowUp className="w-3 h-3" />
            <span>1 Mention</span>
          </button>
        )}
        {unreadCount > 0 && showBottomJump && (
          <button
            type="button"
            onClick={() => {
              if (firstUnreadIdx !== -1) {
                virtualizer.scrollToIndex(firstUnreadIdx, { align: 'start', behavior: 'smooth' });
              }
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold shadow-lg transition-transform active:scale-95"
          >
            <ArrowDown className="w-3 h-3" />
            <span className="tabular-nums-meta">{unreadCount} Unread</span>
          </button>
        )}
      </div>

      {/* Virtualized Stream */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-3"
      >
        {hasPreviousPage && (
          <div className="flex justify-center py-2">
            <button
              type="button"
              onClick={onLoadMorePrevious}
              disabled={isFetchingPreviousPage}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-divider bg-surface-secondary text-xs text-txt-muted hover:text-txt-primary"
            >
              {isFetchingPreviousPage && <Loader2 className="w-3 h-3 animate-spin" />}
              Load earlier messages
            </button>
          </div>
        )}

        <div
          style={{ height: `${virtualizer.getTotalSize()}px` }}
          className="relative w-full"
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];
            return (
              <div
                key={item.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {item.kind === 'date' && (
                  <div className="sticky top-2 z-10 flex justify-center py-2">
                    <span className="px-3 py-1 rounded-full bg-surface-secondary/90 backdrop-blur-md border border-divider text-[11px] font-medium text-txt-muted shadow-sm">
                      {item.label}
                    </span>
                  </div>
                )}

                {item.kind === 'unread_horizon' && (
                  <div className="px-6 py-2.5 flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#EF4444]/60" />
                    <span className="tabular-nums-meta px-2.5 py-0.5 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-[11px] font-bold">
                      {item.count} New Message{item.count === 1 ? '' : 's'}
                    </span>
                    <div className="flex-1 h-px bg-[#EF4444]/60" />
                  </div>
                )}

                {item.kind === 'message' && (
                  <MessageBubble
                    message={item.message}
                    sender={usersById[item.message.senderId]}
                    quotedMessage={
                      item.message.quoteReplyId
                        ? messageById.get(item.message.quoteReplyId)
                        : undefined
                    }
                    quotedSender={
                      item.message.quoteReplyId
                        ? usersById[
                            messageById.get(item.message.quoteReplyId)?.senderId ?? ''
                          ]
                        : undefined
                    }
                    showSenderHeader={item.showHeader}
                    isHighlighted={highlightedMessageId === item.message.id}
                    isPinned={conversation.pinnedMessageIds.includes(item.message.id)}
                    isBookmarked={bookmarkedIds.includes(item.message.id)}
                    isActiveThread={
                      rightPaneMode === 'thread' && activeThreadId === item.message.id
                    }
                    onQuote={onQuote}
                    onOpenThread={openThreadDrawer}
                    onJumpToMessage={jumpToMessage}
                    onToggleReaction={onToggleReaction}
                    onEditMessage={onEditMessage}
                    onVotePoll={onVotePoll}
                    onTogglePin={onTogglePin}
                    onToggleBookmark={onToggleBookmark}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Live Typing / Recording Whisper Bar */}
        {activeWhispers.length > 0 && (
          <div className="px-6 py-2 flex items-center gap-2 text-xs text-txt-muted">
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:120ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:240ms]" />
            </span>
            <span>
              {activeWhispers[0].kind === 'recording'
                ? `${activeWhispers[0].userName} is recording a voice note...`
                : `${activeWhispers[0].userName} is typing...`}
            </span>
          </div>
        )}
      </div>

      {/* Floating Scroll-to-Latest Pill */}
      {showBottomJump && (
        <button
          type="button"
          onClick={() => {
            if (items.length > 0) {
              virtualizer.scrollToIndex(items.length - 1, { align: 'end', behavior: 'smooth' });
            }
          }}
          className="absolute bottom-4 right-5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-divider bg-surface-elevated/95 backdrop-blur-md text-xs font-medium text-txt-primary shadow-lg hover:border-blue-500/40"
        >
          <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
          <span>Latest</span>
        </button>
      )}
    </div>
  );
}

