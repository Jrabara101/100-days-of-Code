import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  MessageSquare,
  GitBranch,
  User as UserIcon,
  FileText,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useContacts, useConversationActions, useConversations } from '../../hooks/useConversations';
import { useAllThreads } from '../../hooks/useThreadReplies';
import { cn } from '../../lib/utils';

interface CommandItem {
  id: string;
  kind: 'chat' | 'contact' | 'thread' | 'file';
  title: string;
  subtitle: string;
  onSelect: () => void;
}

export function CommandSwitcherModal() {
  const isOpen = useChatWorkspaceStore((s) => s.isCommandOpen);
  const setCommandOpen = useChatWorkspaceStore((s) => s.setCommandOpen);
  const selectConversation = useChatWorkspaceStore((s) => s.selectConversation);
  const openThreadDrawer = useChatWorkspaceStore((s) => s.openThreadDrawer);
  const currentUserId = usePresenceStore((s) => s.currentUserId);

  const { data: conversations = [] } = useConversations();
  const { data: contacts = [] } = useContacts();
  const { data: threads = [] } = useAllThreads();
  const { data: vaultMsgs = [] } = useQuery({
    queryKey: ['vault'],
    queryFn: api.getVault,
    enabled: isOpen,
  });
  const { startDirectChat } = useConversationActions();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const results = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    for (const c of conversations) {
      const peer =
        c.type === 'direct'
          ? c.participantUsers.find((u) => u.id !== currentUserId)
          : undefined;
      const title = c.type === 'group' ? c.title ?? 'Group' : peer?.displayName ?? 'Chat';
      items.push({
        id: `conv-${c.id}`,
        kind: 'chat',
        title,
        subtitle: c.lastMessagePreview?.content ?? 'Active conversation',
        onSelect: () => {
          selectConversation(c.id);
          setCommandOpen(false);
        },
      });
    }

    for (const contact of contacts.filter((ct) => ct.status === 'accepted')) {
      items.push({
        id: `contact-${contact.contactUserId}`,
        kind: 'contact',
        title: contact.user.displayName,
        subtitle: `${contact.user.handle} • ${contact.circleTags.join(', ')}`,
        onSelect: () => {
          startDirectChat.mutate(contact.contactUserId);
          setCommandOpen(false);
        },
      });
    }

    for (const t of threads) {
      items.push({
        id: `thread-${t.parent.id}`,
        kind: 'thread',
        title: `Thread: ${t.parent.content.slice(0, 48)}`,
        subtitle: `${t.parent.replyCount} replies • ${t.parent.latestThreadSnippet ?? ''}`,
        onSelect: () => {
          selectConversation(t.parent.conversationId);
          openThreadDrawer(t.parent.id);
          setCommandOpen(false);
        },
      });
    }

    for (const vm of vaultMsgs) {
      for (const att of vm.attachments) {
        const name =
          att.kind === 'image' || att.kind === 'video' || att.kind === 'file'
            ? att.name
            : att.kind === 'link'
              ? att.title
              : att.kind === 'code'
                ? att.filename ?? att.language
                : null;
        if (name) {
          items.push({
            id: `file-${vm.id}-${att.id}`,
            kind: 'file',
            title: name,
            subtitle: `Shared ${att.kind} in chat`,
            onSelect: () => {
              selectConversation(vm.conversationId);
              setCommandOpen(false);
            },
          });
        }
      }
    }

    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 10);
    return items
      .filter(
        (it) =>
          it.title.toLowerCase().includes(q) || it.subtitle.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [
    conversations,
    contacts,
    threads,
    vaultMsgs,
    query,
    currentUserId,
    selectConversation,
    openThreadDrawer,
    setCommandOpen,
    startDirectChat,
  ]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      results[selectedIndex].onSelect();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setCommandOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl rounded-2xl border border-divider bg-surface-elevated shadow-2xl overflow-hidden animate-bubble-in"
      >
        <div className="px-4 py-3 border-b border-divider flex items-center gap-3">
          <Search className="w-4 h-4 text-blue-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Jump to chat, contact, @handle, thread, or shared file..."
            className="flex-1 bg-transparent text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCommandOpen(false)}
            className="p-1 rounded-lg hover:bg-surface-tertiary text-txt-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
          {results.length === 0 ? (
            <p className="py-10 text-center text-xs text-txt-muted">No matching results.</p>
          ) : (
            results.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onSelect}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                  idx === selectedIndex
                    ? 'bg-blue-600/15 text-txt-primary'
                    : 'hover:bg-surface-tertiary text-txt-primary'
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center shrink-0">
                  {item.kind === 'chat' ? (
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                  ) : item.kind === 'thread' ? (
                    <GitBranch className="w-4 h-4 text-[#8B5CF6]" />
                  ) : item.kind === 'contact' ? (
                    <UserIcon className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{item.title}</p>
                  <p className="text-[11px] text-txt-muted truncate">{item.subtitle}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-txt-muted">
                  {item.kind}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-divider bg-surface-secondary flex items-center justify-between text-[11px] text-txt-muted">
          <span>↑↓ Navigate • ↵ Open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

