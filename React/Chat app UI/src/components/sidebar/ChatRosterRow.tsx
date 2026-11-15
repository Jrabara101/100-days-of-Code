import { useState } from 'react';
import {
  Pin,
  BellOff,
  Check,
  CheckCheck,
  Archive,
  MoreHorizontal,
  MailOpen,
  Clock,
} from 'lucide-react';
import type { Conversation, DraftData, TypingWhisper } from '../../types/chat';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { useConversationActions } from '../../hooks/useConversations';
import { cn, formatShortTime } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

interface ChatRosterRowProps {
  conversation: Conversation;
  isSelected: boolean;
  draft?: DraftData;
  whispers: TypingWhisper[];
  onSelect: () => void;
}

export function ChatRosterRow({
  conversation,
  isSelected,
  draft,
  whispers,
  onSelect,
}: ChatRosterRowProps) {
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const { updateMember, markRead } = useConversationActions();
  const pushToast = useChatWorkspaceStore((s) => s.pushToast);

  const [menuOpen, setMenuOpen] = useState(false);

  const me = conversation.members.find((m) => m.userId === currentUserId);
  const peer =
    conversation.type === 'direct'
      ? conversation.participantUsers.find((u) => u.id !== currentUserId)
      : undefined;

  const title =
    conversation.type === 'group'
      ? conversation.title ?? 'Group Chat'
      : peer?.displayName ?? 'Direct Message';

  const unread = me?.unreadCount ?? 0;
  const mentions = me?.unreadMentionsCount ?? 0;
  const activeWhisper = whispers[0];
  const lastPreview = conversation.lastMessagePreview;

  const renderBottomLine = () => {
    if (activeWhisper) {
      if (activeWhisper.kind === 'recording') {
        return (
          <span className="text-xs font-medium text-blue-500 animate-pulse truncate">
            🎙️ {activeWhisper.userName} is recording audio...
          </span>
        );
      }
      if (activeWhisper.kind === 'thread_typing') {
        return (
          <span className="text-xs font-medium text-[#8B5CF6] animate-pulse truncate">
            🧵 {activeWhisper.userName} replying in thread...
          </span>
        );
      }
      return (
        <span className="text-xs font-medium text-emerald-500 animate-pulse truncate">
          ✍️ {activeWhisper.userName} is typing...
        </span>
      );
    }

    if (draft && draft.text.trim()) {
      return (
        <span className="text-xs text-txt-muted truncate">
          <span className="text-[#EF4444] font-semibold mr-1">[Draft]</span>
          {draft.text}
        </span>
      );
    }

    if (lastPreview?.hasThreadActivity && lastPreview.threadReplyCount && unread > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8B5CF6] truncate">
          <span className="px-1.5 py-0.2 rounded bg-[#8B5CF6]/15 text-[11px]">
            🧵 {lastPreview.threadReplyCount} replies
          </span>
          <span className="text-txt-muted truncate">{lastPreview.content}</span>
        </span>
      );
    }

    if (lastPreview) {
      return (
        <span className="text-xs text-txt-muted truncate flex items-center gap-1">
          {lastPreview.senderId === currentUserId && (
            <span className="shrink-0">
              {lastPreview.deliveryState === 'sending' ? (
                <Clock className="w-3 h-3 text-amber-500 inline" />
              ) : lastPreview.deliveryState === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#38BDF8] inline" />
              ) : lastPreview.deliveryState === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#94A3B8] inline" />
              ) : (
                <Check className="w-3.5 h-3.5 text-[#94A3B8] inline" />
              )}
            </span>
          )}
          <span className="truncate">
            {conversation.type === 'group' && lastPreview.senderId !== currentUserId
              ? `${lastPreview.senderName}: `
              : lastPreview.senderId === currentUserId
                ? 'You: '
                : ''}
            {lastPreview.content}
          </span>
        </span>
      );
    }

    return <span className="text-xs text-txt-muted italic">No messages yet</span>;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen((v) => !v);
      }}
      className={cn(
        'relative group h-[68px] px-3 flex items-center gap-3 cursor-pointer select-none transition-colors border-l-2',
        isSelected
          ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500'
          : 'border-transparent hover:bg-surface-tertiary/70'
      )}
    >
      <Avatar
        user={peer}
        users={conversation.participantUsers.filter((u) => u.id !== currentUserId)}
        isGroup={conversation.type === 'group'}
        title={title}
        size={46}
        showPresence={conversation.type === 'direct'}
        ringClass="ring-2 ring-surface-secondary"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-semibold text-txt-primary truncate tracking-[-0.01em]">
              {title}
            </span>
            {me?.isPinned && <Pin className="w-3 h-3 text-blue-500 shrink-0" />}
            {me?.isMuted && <BellOff className="w-3 h-3 text-txt-muted shrink-0" />}
          </div>
          <span className="tabular-nums-meta text-[11px] text-txt-muted shrink-0">
            {lastPreview ? formatShortTime(lastPreview.createdAt) : ''}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">{renderBottomLine()}</div>

          <div className="flex items-center gap-1 shrink-0">
            {mentions > 0 && (
              <span className="tabular-nums-meta px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">
                @
              </span>
            )}
            {unread > 0 && (
              <span
                className={cn(
                  'tabular-nums-meta min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center',
                  me?.isMuted
                    ? 'bg-surface-tertiary text-txt-muted'
                    : 'bg-blue-600 text-white'
                )}
              >
                {unread}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-surface-elevated text-txt-muted hover:text-txt-primary transition-opacity"
              aria-label="Conversation actions"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Context Menu */}
      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-14 z-40 w-44 rounded-xl border border-divider bg-surface-elevated p-1 shadow-xl text-xs"
        >
          <button
            onClick={() => {
              updateMember.mutate({
                conversationId: conversation.id,
                patch: { isPinned: !me?.isPinned },
              });
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-tertiary text-txt-primary"
          >
            <Pin className="w-3.5 h-3.5" />
            {me?.isPinned ? 'Unpin from VIPs' : 'Pin to VIPs'}
          </button>
          <button
            onClick={() => {
              if (unread > 0) {
                markRead.mutate(conversation.id);
              } else {
                updateMember.mutate({
                  conversationId: conversation.id,
                  patch: { unreadCount: 1 },
                });
              }
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-tertiary text-txt-primary"
          >
            <MailOpen className="w-3.5 h-3.5" />
            {unread > 0 ? 'Mark as Read' : 'Mark Unread'}
          </button>
          <button
            onClick={() => {
              updateMember.mutate({
                conversationId: conversation.id,
                patch: { isMuted: !me?.isMuted },
              });
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-tertiary text-txt-primary"
          >
            <BellOff className="w-3.5 h-3.5" />
            {me?.isMuted ? 'Unmute Notifications' : 'Mute Chat'}
          </button>
          <button
            onClick={() => {
              const nextArchived = !me?.isArchived;
              updateMember.mutate({
                conversationId: conversation.id,
                patch: { isArchived: nextArchived },
              });
              pushToast(nextArchived ? 'Chat archived' : 'Restored from archive', 'info');
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-tertiary text-txt-primary"
          >
            <Archive className="w-3.5 h-3.5" />
            {me?.isArchived ? 'Unarchive' : 'Archive Chat'}
          </button>
        </div>
      )}
    </div>
  );
}

