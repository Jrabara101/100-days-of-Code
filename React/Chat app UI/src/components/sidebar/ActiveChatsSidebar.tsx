import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, Search, ShieldAlert, Check, X } from 'lucide-react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../../stores/usePresenceStore';
import {
  useContacts,
  useContactMutations,
  useConversationActions,
  useConversations,
} from '../../hooks/useConversations';
import type { InboxFilterLens } from '../../types/chat';
import { cn } from '../../lib/utils';
import { VipDock } from './VipDock';
import { ChatRosterRow } from './ChatRosterRow';
import { Avatar } from '../ui/Avatar';

export function ActiveChatsSidebar() {
  const sidebarWidth = useChatWorkspaceStore((s) => s.sidebarWidth);
  const activeConversationId = useChatWorkspaceStore((s) => s.activeConversationId);
  const selectConversation = useChatWorkspaceStore((s) => s.selectConversation);
  const inboxFilter = useChatWorkspaceStore((s) => s.inboxFilter);
  const setInboxFilter = useChatWorkspaceStore((s) => s.setInboxFilter);
  const searchQuery = useChatWorkspaceStore((s) => s.searchQuery);
  const setSearchQuery = useChatWorkspaceStore((s) => s.setSearchQuery);
  const drafts = useChatWorkspaceStore((s) => s.drafts);
  const setCommandOpen = useChatWorkspaceStore((s) => s.setCommandOpen);
  const openNewGroupModal = useChatWorkspaceStore((s) => s.openNewGroupModal);
  const pushToast = useChatWorkspaceStore((s) => s.pushToast);

  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const whispers = usePresenceStore((s) => s.whispers);

  const { data: conversations = [] } = useConversations();
  const { data: contacts = [] } = useContacts();
  const { updateContact } = useContactMutations();
  const { startDirectChat, markRead } = useConversationActions();

  const pendingRequests = useMemo(
    () => contacts.filter((c) => c.status === 'pending_request'),
    [contacts]
  );

  const unreadChatsCount = useMemo(
    () =>
      conversations.filter((c) => {
        const me = c.members.find((m) => m.userId === currentUserId);
        return me && !me.isArchived && me.unreadCount > 0;
      }).length,
    [conversations, currentUserId]
  );

  const threadChatsCount = useMemo(
    () =>
      conversations.filter((c) => {
        const me = c.members.find((m) => m.userId === currentUserId);
        return (
          me &&
          !me.isArchived &&
          (c.lastMessagePreview?.hasThreadActivity || (c.unreadThreadsCount ?? 0) > 0)
        );
      }).length,
    [conversations, currentUserId]
  );

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter((conv) => {
      const me = conv.members.find((m) => m.userId === currentUserId);
      if (!me) return false;

      if (inboxFilter === 'archived') {
        if (!me.isArchived) return false;
      } else {
        if (me.isArchived) return false;
      }

      if (inboxFilter === 'unread' && me.unreadCount === 0) return false;
      if (
        inboxFilter === 'threads' &&
        !conv.lastMessagePreview?.hasThreadActivity &&
        !(conv.unreadThreadsCount && conv.unreadThreadsCount > 0)
      ) {
        return false;
      }
      if (inboxFilter === 'mentions' && me.unreadMentionsCount === 0) return false;

      if (!q) return true;
      const peer = conv.participantUsers.find((u) => u.id !== currentUserId);
      const nameMatch =
        (conv.title ?? '').toLowerCase().includes(q) ||
        (peer?.displayName ?? '').toLowerCase().includes(q) ||
        (peer?.handle ?? '').toLowerCase().includes(q);
      const previewMatch = (conv.lastMessagePreview?.content ?? '').toLowerCase().includes(q);
      return nameMatch || previewMatch;
    });
  }, [conversations, currentUserId, inboxFilter, searchQuery]);

  const scrollParentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredConversations.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 68,
    overscan: 6,
  });

  const lenses: Array<{ key: InboxFilterLens; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: unreadChatsCount > 0 ? `Unread (${unreadChatsCount})` : 'Unread' },
    { key: 'threads', label: threadChatsCount > 0 ? `🧵 Threads (${threadChatsCount})` : '🧵 Threads' },
    { key: 'mentions', label: '@Mentions' },
    {
      key: 'requests',
      label: pendingRequests.length > 0 ? `Requests (${pendingRequests.length})` : 'Requests',
    },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <aside
      style={{ width: sidebarWidth }}
      className="h-full shrink-0 bg-surface-secondary border-r border-divider flex flex-col w-full md:w-auto"
    >
      {/* Top Header & Command Search */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold tracking-tight text-txt-primary">Chats</h1>
          <span className="tabular-nums-meta text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-surface-tertiary text-txt-muted">
            {conversations.filter((c) => !c.members.find((m) => m.userId === currentUserId)?.isArchived).length}
          </span>
        </div>
        <button
          onClick={() => openNewGroupModal(null)}
          title="New Chat / Group (⌘N)"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Search Pill */}
      <div className="px-3 pb-2.5">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-txt-muted absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats, contacts, or messages..."
            className="w-full rounded-xl bg-surface-tertiary border border-divider pl-8 pr-12 py-1.5 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="tabular-nums-meta absolute right-2 px-1.5 py-0.5 rounded bg-surface-elevated border border-divider text-[10px] font-medium text-txt-muted hover:text-txt-primary"
            title="Open Command Switcher"
          >
            ⌘K
          </button>
        </div>
      </div>

      {/* Pinned VIP Contacts Dock */}
      <VipDock conversations={conversations} />

      {/* Segmented Filter Lenses */}
      <div className="px-3 py-2 border-b border-divider flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {lenses.map((lens) => {
          const active = inboxFilter === lens.key;
          return (
            <button
              key={lens.key}
              onClick={() => setInboxFilter(lens.key)}
              className={cn(
                'tabular-nums-meta shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-surface-tertiary text-txt-muted hover:text-txt-primary'
              )}
            >
              {lens.label}
            </button>
          );
        })}
      </div>

      {/* Quarantine Message Requests Triage View OR Virtualized Chat Roster */}
      {inboxFilter === 'requests' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2 text-xs text-amber-400">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Unknown senders are quarantined here. Your presence &amp; local time stay hidden until you accept.
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-txt-muted">
              No pending message requests.
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.contactUserId}
                className="rounded-2xl border border-divider bg-surface-elevated p-3 space-y-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar user={req.user} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-txt-primary truncate">
                      {req.user.displayName}
                    </p>
                    <p className="text-[11px] text-txt-muted truncate">
                      {req.user.handle} • {req.mutualCount} mutual{req.mutualCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {req.requestPreview && (
                  <p className="text-xs text-txt-muted bg-surface-tertiary rounded-xl p-2.5 border border-divider leading-relaxed">
                    “{req.requestPreview}”
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateContact.mutate({
                        userId: req.contactUserId,
                        patch: { status: 'accepted' },
                      });
                      startDirectChat.mutate(req.contactUserId);
                      pushToast(`Accepted ${req.user.displayName}`, 'success');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept &amp; Chat
                  </button>
                  <button
                    onClick={() => {
                      updateContact.mutate({
                        userId: req.contactUserId,
                        patch: { status: 'blocked' },
                      });
                      pushToast(`Declined request from ${req.user.displayName}`, 'info');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-surface-tertiary hover:bg-rose-500/15 text-txt-muted hover:text-rose-500 text-xs font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div ref={scrollParentRef} className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="py-16 px-6 text-center text-xs text-txt-muted">
              No conversations match this filter.
            </div>
          ) : (
            <div
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
              className="relative w-full"
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const conv = filteredConversations[virtualRow.index];
                return (
                  <div
                    key={conv.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <ChatRosterRow
                      conversation={conv}
                      isSelected={activeConversationId === conv.id}
                      draft={drafts[conv.id]}
                      whispers={whispers[conv.id] ?? []}
                      onSelect={() => {
                        selectConversation(conv.id);
                        const me = conv.members.find((m) => m.userId === currentUserId);
                        if (me && me.unreadCount > 0) {
                          markRead.mutate(conv.id);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

