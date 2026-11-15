import { useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { useConversationActions, useConversations } from '../../hooks/useConversations';
import { useMessageMutations, useMessages } from '../../hooks/useMessages';
import type { Message } from '../../types/chat';
import { ChatHeader } from './ChatHeader';
import { PinnedMessageBar } from './PinnedMessageBar';
import { MessageStream } from './MessageStream';
import { ComposerDock } from './ComposerDock';

export function ActiveChatStage() {
  const activeConversationId = useChatWorkspaceStore((s) => s.activeConversationId);
  const chatSearchQuery = useChatWorkspaceStore((s) => s.chatSearchQuery);
  const setPollModalOpen = useChatWorkspaceStore((s) => s.setPollModalOpen);

  const { data: conversations = [] } = useConversations();
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? conversations[0] ?? null,
    [conversations, activeConversationId]
  );

  const {
    data: pagesData,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
  } = useMessages(activeConversation?.id ?? null);

  const { togglePinMessage } = useConversationActions();
  const {
    dispatchMessage,
    toggleReaction,
    editMessage,
    votePoll,
    toggleBookmark,
  } = useMessageMutations(activeConversation?.id ?? null);

  const [quoteMessage, setQuoteMessage] = useState<Message | null>(null);
  const [jumpTargetId, setJumpTargetId] = useState<string | null>(null);

  const allMessages = useMemo(() => {
    const flat = pagesData?.pages.flatMap((p) => p.items) ?? [];
    if (!chatSearchQuery.trim()) return flat;
    const q = chatSearchQuery.toLowerCase();
    return flat.filter((m) => m.content.toLowerCase().includes(q));
  }, [pagesData, chatSearchQuery]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-canvas text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-surface-secondary border border-divider flex items-center justify-center mb-4">
          <MessageSquare className="w-7 h-7 text-blue-500" />
        </div>
        <h2 className="text-base font-semibold text-txt-primary">Select a conversation</h2>
        <p className="text-xs text-txt-muted mt-1 max-w-xs">
          Pick an active chat on the left or press <kbd className="px-1.5 py-0.5 rounded bg-surface-tertiary border border-divider">⌘K</kbd> to jump anywhere.
        </p>
      </div>
    );
  }

  return (
    <main className="flex-1 min-w-0 h-full bg-canvas flex flex-col">
      <ChatHeader conversation={activeConversation} messages={allMessages} />

      <PinnedMessageBar
        conversation={activeConversation}
        messages={allMessages}
        onJumpToMessage={(id) => setJumpTargetId(id)}
      />

      <MessageStream
        conversation={activeConversation}
        messages={allMessages}
        hasPreviousPage={hasPreviousPage}
        isFetchingPreviousPage={isFetchingPreviousPage}
        onLoadMorePrevious={() => void fetchPreviousPage()}
        onQuote={(msg) => setQuoteMessage(msg)}
        onToggleReaction={(messageId, emoji) => toggleReaction.mutate({ messageId, emoji })}
        onEditMessage={(messageId, content) => editMessage.mutate({ messageId, content })}
        onVotePoll={(messageId, optionId) => votePoll.mutate({ messageId, optionId })}
        onTogglePin={(messageId) =>
          togglePinMessage.mutate({ conversationId: activeConversation.id, messageId })
        }
        onToggleBookmark={(messageId) => toggleBookmark.mutate(messageId)}
        jumpTargetId={jumpTargetId}
        onClearJumpTarget={() => setJumpTargetId(null)}
      />

      <ComposerDock
        conversation={activeConversation}
        quoteMessage={quoteMessage}
        onClearQuote={() => setQuoteMessage(null)}
        onOpenPollModal={() => setPollModalOpen(true)}
        onSend={({ content, attachments, quoteReplyId, isSilent, scheduledFor }) => {
          dispatchMessage({
            conversationId: activeConversation.id,
            content,
            attachments,
            quoteReplyId,
            isSilent,
            scheduledFor,
          });
        }}
      />
    </main>
  );
}

