import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  GitBranch,
  Send,
  X,
} from 'lucide-react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useConversations } from '../../hooks/useConversations';
import { useThread, useThreadMutations } from '../../hooks/useThreadReplies';
import { QUICK_REACTIONS } from '../../lib/constants';
import { wsClient } from '../../lib/wsClient';
import { cn, formatShortTime } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

export function ThreadDrawerPane() {
  const activeThreadId = useChatWorkspaceStore((s) => s.activeThreadId);
  const closeRightPane = useChatWorkspaceStore((s) => s.closeRightPane);
  const setMobileStage = useChatWorkspaceStore((s) => s.setMobileStage);
  const flashMessageAnchor = useChatWorkspaceStore((s) => s.flashMessageAnchor);

  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const usersById = usePresenceStore((s) => s.usersById);
  const currentUser = usersById[currentUserId];

  const { data: conversations = [] } = useConversations();
  const { data: threadData, isLoading } = useThread(activeThreadId);
  const { dispatchReply, toggleFollow, toggleThreadReaction } =
    useThreadMutations(activeThreadId);

  const whispers = usePresenceStore((s) =>
    threadData?.parent ? s.whispers[threadData.parent.conversationId] ?? [] : []
  );
  const threadWhispers = whispers.filter(
    (w) => w.kind === 'thread_typing' && (!w.threadId || w.threadId === activeThreadId)
  );

  const [replyText, setReplyText] = useState('');
  const [alsoBroadcast, setAlsoBroadcast] = useState(false);
  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadData?.replies.items.length]);

  const parent = threadData?.parent;
  const replies = threadData?.replies.items ?? [];
  const conv = conversations.find((c) => c.id === parent?.conversationId);
  const peer =
    conv?.type === 'direct'
      ? conv.participantUsers.find((u) => u.id !== currentUserId)
      : undefined;

  const chatLabel =
    conv?.type === 'group'
      ? `in #${(conv.title ?? 'group').toLowerCase().replace(/\s+/g, '-')}`
      : `with ${peer?.displayName ?? 'Contact'}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || !parent) return;
    dispatchReply(parent.conversationId, parent.id, trimmed, alsoBroadcast);
    setReplyText('');
    setAlsoBroadcast(false);
  };

  return (
    <aside className="w-full md:w-[380px] shrink-0 h-full border-l border-divider bg-surface-secondary flex flex-col">
      {/* Drawer Header */}
      <div className="h-16 px-4 border-b border-divider flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileStage('chat')}
            className="md:hidden p-1 rounded-lg hover:bg-surface-tertiary text-txt-muted"
            aria-label="Back to chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <GitBranch className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-txt-primary leading-tight">Thread</h3>
            <p className="text-[11px] text-txt-muted truncate">{chatLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => toggleFollow.mutate()}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
              threadData?.isFollowing
                ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#8B5CF6]'
                : 'border-divider bg-surface-tertiary text-txt-muted hover:text-txt-primary'
            )}
          >
            {threadData?.isFollowing ? (
              <>
                <Bell className="w-3 h-3" />
                <span>Following</span>
              </>
            ) : (
              <>
                <BellOff className="w-3 h-3" />
                <span>Follow</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={closeRightPane}
            aria-label="Close thread drawer"
            className="p-1.5 rounded-lg hover:bg-surface-tertiary text-txt-muted hover:text-txt-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Parent Anchor Message Card */}
      {isLoading || !parent ? (
        <div className="p-6 text-xs text-txt-muted">Loading thread...</div>
      ) : (
        <>
          <div className="p-4 bg-surface-tertiary/50 border-b border-divider shrink-0">
            <button
              type="button"
              onClick={() => flashMessageAnchor(parent.id)}
              className="w-full text-left group"
              title="Highlight parent message in main stream"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <Avatar user={usersById[parent.senderId]} size={32} showPresence />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-txt-primary group-hover:text-[#8B5CF6] transition-colors">
                      {usersById[parent.senderId]?.displayName ?? 'Member'}
                    </span>
                    <span className="tabular-nums-meta text-[11px] text-txt-muted">
                      {formatShortTime(parent.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[13.5px] leading-relaxed text-txt-primary line-clamp-4">
                {parent.content || '[Media / Attachment]'}
              </p>
            </button>

            <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#8B5CF6]">
              <span className="tabular-nums-meta">
                {parent.replyCount} {parent.replyCount === 1 ? 'Reply' : 'Replies'}
              </span>
              <div className="flex-1 h-px bg-divider" />
            </div>
          </div>

          {/* Chronological Thread Reply Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {replies.length === 0 ? (
              <div className="py-10 text-center text-xs text-txt-muted">
                No replies yet. Start a focused discussion without cluttering the main chat.
              </div>
            ) : (
              replies.map((reply) => {
                const sender = usersById[reply.senderId];
                const isMine = reply.senderId === currentUserId;
                const reactions = Object.entries(reply.reactions ?? {}).filter(
                  ([, uids]) => uids.length > 0
                );

                return (
                  <div key={reply.id} className="group flex gap-2.5 animate-bubble-in">
                    <Avatar user={sender} size={32} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-txt-primary truncate">
                          {sender?.displayName ?? 'Member'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="tabular-nums-meta text-[10.5px] text-txt-muted">
                            {formatShortTime(reply.createdAt)}
                          </span>
                          {isMine && (
                            <span>
                              {reply.deliveryState === 'sending' ? (
                                <Clock className="w-3 h-3 text-amber-400" />
                              ) : reply.deliveryState === 'read' ? (
                                <CheckCheck className="w-3 h-3 text-[#38BDF8]" />
                              ) : (
                                <Check className="w-3 h-3 text-txt-muted" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {reply.alsoBroadcastToMain && (
                        <span className="mt-0.5 inline-block text-[10px] font-medium text-[#8B5CF6]">
                          Also sent to main chat
                        </span>
                      )}

                      <p className="mt-0.5 text-[13.5px] leading-relaxed text-txt-primary whitespace-pre-wrap break-words">
                        {reply.content}
                      </p>

                      {/* Inline reactions + quick add */}
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {reactions.map(([em, uids]) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() =>
                              toggleThreadReaction.mutate({ messageId: reply.id, emoji: em })
                            }
                            className={cn(
                              'tabular-nums-meta inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border',
                              uids.includes(currentUserId)
                                ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-[#8B5CF6]'
                                : 'bg-surface-tertiary border-divider text-txt-muted'
                            )}
                          >
                            <span>{em}</span>
                            <span>{uids.length}</span>
                          </button>
                        ))}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                          {QUICK_REACTIONS.slice(0, 3).map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() =>
                                toggleThreadReaction.mutate({ messageId: reply.id, emoji: em })
                              }
                              className="w-5 h-5 rounded hover:bg-surface-tertiary text-xs flex items-center justify-center"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {threadWhispers.length > 0 && (
              <p className="text-[11px] text-[#8B5CF6] animate-pulse">
                🧵 {threadWhispers[0].userName} is typing in thread...
              </p>
            )}
            <div ref={streamEndRef} />
          </div>

          {/* Dedicated Thread Composer */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-divider bg-surface-secondary shrink-0 space-y-2">
            <div className="rounded-xl border border-divider bg-surface-tertiary p-2 focus-within:ring-2 focus-within:ring-[#8B5CF6]/40">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  if (e.target.value.trim()) {
                    wsClient.emit('thread:typing', {
                      conversationId: parent.conversationId,
                      threadId: parent.id,
                      userId: currentUserId,
                      userName: currentUser?.displayName.split(' ')[0] ?? 'River',
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Reply to thread..."
                className="w-full resize-none bg-transparent text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none"
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 text-[11px] text-txt-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={alsoBroadcast}
                    onChange={(e) => setAlsoBroadcast(e.target.checked)}
                    className="rounded border-divider text-[#8B5CF6] focus:ring-[#8B5CF6]"
                  />
                  <span>
                    Also send to main chat ({peer?.displayName ?? conv?.title ?? 'Chat'})
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8B5CF6] hover:bg-violet-500 disabled:opacity-45 text-white text-xs font-semibold transition-colors"
                >
                  <Send className="w-3 h-3" />
                  Reply
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </aside>
  );
}

