import { useQuery } from '@tanstack/react-query';
import { Bookmark, ArrowUpRight } from 'lucide-react';
import { api } from '../../lib/api';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { useConversations } from '../../hooks/useConversations';
import { formatShortTime } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

export function BookmarksView() {
  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: api.getBookmarks,
  });
  const { data: conversations = [] } = useConversations();
  const usersById = usePresenceStore((s) => s.usersById);
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const selectConversation = useChatWorkspaceStore((s) => s.selectConversation);
  const flashMessageAnchor = useChatWorkspaceStore((s) => s.flashMessageAnchor);

  return (
    <div className="flex-1 h-full bg-canvas flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-divider bg-canvas/85 backdrop-blur-md flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
          <Bookmark className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-base font-bold text-txt-primary">Saved Messages</h1>
          <p className="text-xs text-txt-muted">Bookmarked decisions, links, and specs</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3 max-w-4xl">
        {isLoading ? (
          <p className="text-xs text-txt-muted">Loading bookmarks...</p>
        ) : bookmarks.length === 0 ? (
          <p className="text-xs text-txt-muted">
            Hover any message bubble and click ••• → Save Bookmark to keep it here.
          </p>
        ) : (
          bookmarks.map((msg) => {
            const sender = usersById[msg.senderId];
            const conv = conversations.find((c) => c.id === msg.conversationId);
            const peer =
              conv?.type === 'direct'
                ? conv.participantUsers.find((u) => u.id !== currentUserId)
                : undefined;
            const convLabel =
              conv?.type === 'group' ? conv.title : peer?.displayName ?? 'Chat';

            return (
              <div
                key={msg.id}
                className="rounded-2xl border border-divider bg-surface-elevated p-4 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar user={sender} size={36} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-txt-primary">
                        {sender?.displayName ?? 'Member'}
                      </span>
                      <span className="text-txt-muted">in {convLabel}</span>
                      <span className="tabular-nums-meta text-txt-muted">
                        {formatShortTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-txt-primary leading-relaxed">
                      {msg.content || '[Media / Attachment]'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    selectConversation(msg.conversationId);
                    setTimeout(() => flashMessageAnchor(msg.id), 120);
                  }}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-tertiary hover:bg-blue-500/15 text-xs font-medium text-blue-500"
                >
                  Jump <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

