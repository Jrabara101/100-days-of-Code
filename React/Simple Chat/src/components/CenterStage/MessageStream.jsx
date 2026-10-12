import React, { useRef, useEffect, useState, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import DateDivider from './DateDivider';
import UnreadDivider from './UnreadDivider';
import UnreadFloatingPill from './UnreadFloatingPill';

function formatDateLabel(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function MessageStream({
  messages = [],
  currentUserId,
  participantsMap = {},
  lastReadMessageId,
  unreadCount = 0,
  onQuoteReply,
  onRetryFailed,
  onAddReaction,
  onOpenImage,
  searchQuery = '',
}) {
  const containerRef = useRef(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const bottomAnchorRef = useRef(null);
  const isInitialMount = useRef(true);

  // Filter messages by search query if present
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content?.toLowerCase().includes(q) ||
        m.attachments?.some(
          (a) =>
            a.title?.toLowerCase().includes(q) ||
            a.caption?.toLowerCase().includes(q) ||
            a.code?.toLowerCase().includes(q)
        )
    );
  }, [messages, searchQuery]);

  // Scroll detection to trigger floating unread jump pill
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsScrolledUp(distanceFromBottom > 280);
  };

  // Scroll smoothly to bottom
  const scrollToBottom = (smooth = true) => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // Auto-scroll on initial load and when receiving messages if not scrolled up
  useEffect(() => {
    if (isInitialMount.current) {
      scrollToBottom(false);
      isInitialMount.current = false;
      return;
    }

    if (!isScrolledUp) {
      scrollToBottom(true);
    }
  }, [messages.length]);

  // Jump to quoted source message and highlight
  const handleJumpToQuoted = (sourceId) => {
    const el = document.getElementById(`message-${sourceId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(sourceId);
      setTimeout(() => setHighlightedId(null), 2000);
    }
  };

  return (
    <div className="relative flex-grow h-full overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 md:px-6 py-4 flex flex-col space-y-1"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-grow py-12 text-center text-slate-400 dark:text-[#8F9CAE]">
            <p className="text-sm">No messages yet. Say hello to get started!</p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isOutbound = msg.user_id === currentUserId;
            const sender = participantsMap[msg.user_id];

            // 1. Check Date Divider
            const prevMsg = filteredMessages[index - 1];
            const currentDateLabel = formatDateLabel(msg.created_at);
            const prevDateLabel = prevMsg ? formatDateLabel(prevMsg.created_at) : null;
            const showDateDivider = !prevMsg || currentDateLabel !== prevDateLabel;

            // 2. Check Unread Marker Ribbon:
            // Place red divider above the first incoming unread message
            const isFirstUnread =
              lastReadMessageId &&
              prevMsg &&
              prevMsg.id === lastReadMessageId &&
              !isOutbound;

            // 3. Consecutive Message Clustering:
            // Same author within 2 minutes = cluster together
            let isGroupFirst = true;
            if (prevMsg && prevMsg.user_id === msg.user_id) {
              const diffMinutes =
                (new Date(msg.created_at) - new Date(prevMsg.created_at)) / (1000 * 60);
              if (diffMinutes < 2 && !showDateDivider && !isFirstUnread) {
                isGroupFirst = false;
              }
            }

            return (
              <React.Fragment key={msg.id || msg.client_message_id || index}>
                {showDateDivider && <DateDivider dateLabel={currentDateLabel} />}
                {isFirstUnread && <UnreadDivider />}

                <MessageBubble
                  message={msg}
                  isOutbound={isOutbound}
                  sender={sender}
                  isGroupFirst={isGroupFirst}
                  isHighlighted={highlightedId === msg.id}
                  onQuoteReply={onQuoteReply}
                  onJumpToQuoted={handleJumpToQuoted}
                  onRetryFailed={onRetryFailed}
                  onAddReaction={onAddReaction}
                  onOpenImage={onOpenImage}
                />
              </React.Fragment>
            );
          })
        )}

        <div ref={bottomAnchorRef} className="h-1" />
      </div>

      {/* Floating Unread Jump Pill */}
      {isScrolledUp && (
        <UnreadFloatingPill
          unreadCount={unreadCount}
          onClick={() => scrollToBottom(true)}
        />
      )}
    </div>
  );
}
