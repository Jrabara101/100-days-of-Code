import {
  ArrowLeft,
  Phone,
  Video,
  GitBranch,
  Search,
  Info,
  UserPlus,
  X,
} from 'lucide-react';
import type { Conversation, Message } from '../../types/chat';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { useLiveClock } from '../../hooks/useLiveClock';
import { getContactTimezoneInfo } from '../../lib/timezone';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

interface ChatHeaderProps {
  conversation: Conversation;
  messages: Message[];
}

export function ChatHeader({ conversation, messages }: ChatHeaderProps) {
  const now = useLiveClock(30_000);
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const usersById = usePresenceStore((s) => s.usersById);
  const currentUser = usersById[currentUserId];

  const rightPaneMode = useChatWorkspaceStore((s) => s.rightPaneMode);
  const openInspectorDrawer = useChatWorkspaceStore((s) => s.openInspectorDrawer);
  const openThreadDrawer = useChatWorkspaceStore((s) => s.openThreadDrawer);
  const openNewGroupModal = useChatWorkspaceStore((s) => s.openNewGroupModal);
  const isChatSearchOpen = useChatWorkspaceStore((s) => s.isChatSearchOpen);
  const setChatSearchOpen = useChatWorkspaceStore((s) => s.setChatSearchOpen);
  const chatSearchQuery = useChatWorkspaceStore((s) => s.chatSearchQuery);
  const setChatSearchQuery = useChatWorkspaceStore((s) => s.setChatSearchQuery);
  const setMobileStage = useChatWorkspaceStore((s) => s.setMobileStage);
  const setActiveCall = useChatWorkspaceStore((s) => s.setActiveCall);

  const peer =
    conversation.type === 'direct'
      ? conversation.participantUsers.find((u) => u.id !== currentUserId)
      : undefined;

  const title =
    conversation.type === 'group'
      ? conversation.title ?? 'Group Chat'
      : peer?.displayName ?? 'Direct Message';

  const tzInfo = peer
    ? getContactTimezoneInfo(
        peer.timezone,
        peer.workingHours,
        currentUser?.timezone ?? 'Asia/Singapore',
        now
      )
    : null;

  const activeThreads = messages.filter((m) => m.replyCount > 0);
  const onlineMembersCount = conversation.participantUsers.filter(
    (u) => u.id !== currentUserId && u.presence === 'online'
  ).length;

  const startCall = (mode: 'audio' | 'video') => {
    setActiveCall({
      conversationId: conversation.id,
      title,
      participants: conversation.participantUsers.filter((u) => u.id !== currentUserId),
      mode,
      startedAt: Date.now(),
    });
  };

  return (
    <header className="shrink-0 border-b border-divider bg-canvas/85 backdrop-blur-md">
      <div className="h-16 px-4 md:px-5 flex items-center justify-between gap-3">
        {/* Left Identity Cluster */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileStage('list')}
            className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-surface-tertiary text-txt-muted"
            aria-label="Back to chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Avatar
            user={peer}
            users={conversation.participantUsers.filter((u) => u.id !== currentUserId)}
            isGroup={conversation.type === 'group'}
            title={title}
            size={40}
            showPresence={conversation.type === 'direct'}
            ringClass="ring-2 ring-canvas"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-txt-primary truncate">{title}</h2>
              {peer?.statusEmoji && (
                <span className="text-xs" title={peer.statusText}>
                  {peer.statusEmoji}
                </span>
              )}
            </div>

            {/* Ambient Presence + Local Time Bar */}
            {conversation.type === 'direct' && peer && tzInfo ? (
              <p className="text-[11.5px] text-txt-muted truncate flex items-center gap-1.5">
                <span className="tabular-nums-meta">
                  {tzInfo.isSleeping
                    ? `🌙 ${peer.presence === 'offline' ? 'Offline' : 'Away'} • ${tzInfo.localTime12h} in ${tzInfo.city} (Sleeping)`
                    : `${peer.presence === 'online' ? '🟢 Active now' : peer.presence === 'dnd' ? '⛔ DND' : '🟡 Away'} • ${tzInfo.localTime12h} in ${tzInfo.city} (${tzInfo.offsetDeltaLabel})`}
                </span>
              </p>
            ) : (
              <p className="tabular-nums-meta text-[11.5px] text-txt-muted truncate">
                {conversation.participantUsers.length} members • {onlineMembersCount} active now
              </p>
            )}
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => startCall('audio')}
            title="Start Audio Call"
            className="p-2 rounded-xl text-txt-muted hover:text-txt-primary hover:bg-surface-tertiary transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => startCall('video')}
            title="Start Video Call"
            className="p-2 rounded-xl text-txt-muted hover:text-txt-primary hover:bg-surface-tertiary transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>

          {conversation.type === 'direct' && (
            <button
              type="button"
              onClick={() => openNewGroupModal(conversation.id)}
              title="Escalate 1-on-1 to Group Chat"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-txt-muted hover:text-txt-primary hover:bg-surface-tertiary transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Add to Group</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (activeThreads[0]) {
                openThreadDrawer(activeThreads[0].id);
              } else if (messages[messages.length - 1]) {
                openThreadDrawer(messages[messages.length - 1].id);
              }
            }}
            title="View Threads in this chat"
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors',
              rightPaneMode === 'thread'
                ? 'bg-[#8B5CF6]/15 text-[#8B5CF6]'
                : 'text-txt-muted hover:text-txt-primary hover:bg-surface-tertiary'
            )}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="tabular-nums-meta hidden lg:inline">
              Threads ({activeThreads.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setChatSearchOpen(!isChatSearchOpen)}
            title="Search inside conversation"
            className={cn(
              'p-2 rounded-xl transition-colors',
              isChatSearchOpen
                ? 'bg-blue-500/15 text-blue-500'
                : 'text-txt-muted hover:text-txt-primary hover:bg-surface-tertiary'
            )}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={openInspectorDrawer}
            title="Contact Info & Shared Memory Vault"
            className={cn(
              'p-2 rounded-xl transition-colors',
              rightPaneMode === 'inspector'
                ? 'bg-blue-500/15 text-blue-500'
                : 'text-txt-muted hover:text-txt-primary hover:bg-surface-tertiary'
            )}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline In-Chat Search Strip */}
      {isChatSearchOpen && (
        <div className="px-5 py-2 border-t border-divider bg-surface-secondary flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-txt-muted" />
          <input
            type="text"
            autoFocus
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            placeholder="Filter messages in this conversation..."
            className="flex-1 bg-transparent text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none"
          />
          {chatSearchQuery && (
            <button
              type="button"
              onClick={() => setChatSearchQuery('')}
              className="text-[11px] text-txt-muted hover:text-txt-primary"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setChatSearchOpen(false);
              setChatSearchQuery('');
            }}
            className="p-1 rounded hover:bg-surface-tertiary text-txt-muted"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
}

