import type { Conversation } from '../../types/chat';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

interface VipDockProps {
  conversations: Conversation[];
}

export function VipDock({ conversations }: VipDockProps) {
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const activeConversationId = useChatWorkspaceStore((s) => s.activeConversationId);
  const selectConversation = useChatWorkspaceStore((s) => s.selectConversation);

  const pinned = conversations
    .filter((c) => {
      const me = c.members.find((m) => m.userId === currentUserId);
      return me?.isPinned && !me.isArchived;
    })
    .slice(0, 8);

  if (pinned.length === 0) return null;

  return (
    <div className="px-3 py-2.5 border-b border-divider">
      <div className="grid grid-cols-4 gap-2">
        {pinned.map((conv) => {
          const me = conv.members.find((m) => m.userId === currentUserId);
          const peer =
            conv.type === 'direct'
              ? conv.participantUsers.find((u) => u.id !== currentUserId)
              : undefined;
          const label =
            conv.type === 'group'
              ? (conv.title ?? 'Group').split(' ')[0]
              : (peer?.displayName ?? 'Chat').split(' ')[0];
          const isSelected = activeConversationId === conv.id;
          const unread = me?.unreadCount ?? 0;

          return (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={cn(
                'group flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all',
                isSelected
                  ? 'bg-blue-500/15 ring-1 ring-blue-500/40'
                  : 'hover:bg-surface-tertiary'
              )}
              title={conv.type === 'group' ? conv.title ?? 'Group' : peer?.displayName}
            >
              <div className="relative">
                <Avatar
                  user={peer}
                  users={conv.participantUsers.filter((u) => u.id !== currentUserId)}
                  isGroup={conv.type === 'group'}
                  title={conv.title}
                  size={44}
                  showPresence={conv.type === 'direct'}
                  ringClass="ring-2 ring-surface-secondary"
                />
                {unread > 0 && (
                  <span className="tabular-nums-meta absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-secondary">
                    {unread}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium truncate w-full text-center',
                  isSelected ? 'text-blue-500 font-semibold' : 'text-txt-muted group-hover:text-txt-primary'
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

