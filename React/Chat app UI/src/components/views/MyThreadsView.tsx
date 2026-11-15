import { GitBranch, ArrowRight, Bell } from 'lucide-react';
import { useAllThreads } from '../../hooks/useThreadReplies';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { formatRelativeTime } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

export function MyThreadsView() {
  const { data: threads = [], isLoading } = useAllThreads();
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const usersById = usePresenceStore((s) => s.usersById);
  const selectConversation = useChatWorkspaceStore((s) => s.selectConversation);
  const openThreadDrawer = useChatWorkspaceStore((s) => s.openThreadDrawer);

  return (
    <div className="flex-1 h-full bg-canvas flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-divider bg-canvas/85 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-txt-primary">My Threads</h1>
            <p className="text-xs text-txt-muted">
              All active side-by-side message threads across your workspace
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3 max-w-4xl">
        {isLoading ? (
          <p className="text-xs text-txt-muted">Loading threads...</p>
        ) : threads.length === 0 ? (
          <p className="text-xs text-txt-muted">No active threads yet.</p>
        ) : (
          threads.map(({ parent, conversation, isFollowing }) => {
            const sender = usersById[parent.senderId];
            const peer =
              conversation.type === 'direct'
                ? conversation.participantUsers.find((u) => u.id !== currentUserId)
                : undefined;
            const convTitle =
              conversation.type === 'group'
                ? conversation.title ?? 'Group'
                : peer?.displayName ?? 'Direct Chat';

            return (
              <div
                key={parent.id}
                onClick={() => {
                  selectConversation(conversation.id);
                  openThreadDrawer(parent.id);
                }}
                className="group cursor-pointer rounded-2xl border border-divider bg-surface-elevated p-4 hover:border-[#8B5CF6]/50 transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-surface-tertiary text-[11px] font-semibold text-txt-primary">
                      {convTitle}
                    </span>
                    {isFollowing && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#8B5CF6] font-medium">
                        <Bell className="w-3 h-3" /> Following
                      </span>
                    )}
                  </div>
                  <span className="tabular-nums-meta text-[11px] text-txt-muted">
                    {formatRelativeTime(parent.lastThreadReplyAt ?? parent.createdAt)}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <Avatar user={sender} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-txt-primary">
                      {sender?.displayName ?? 'Member'}
                    </p>
                    <p className="text-sm text-txt-primary mt-0.5 line-clamp-2">
                      {parent.content}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#8B5CF6]/5 border border-[#8B5CF6]/25 px-3 py-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex -space-x-1.5 shrink-0">
                      {parent.threadParticipants.slice(0, 4).map((p) => (
                        <img
                          key={p.id}
                          src={p.avatarUrl}
                          alt={p.displayName}
                          className="w-5 h-5 rounded-full ring-2 ring-surface-elevated"
                        />
                      ))}
                    </div>
                    <span className="tabular-nums-meta text-xs font-bold text-[#8B5CF6] shrink-0">
                      {parent.replyCount} replies
                    </span>
                    <span className="text-xs text-txt-muted truncate">
                      {parent.latestThreadSnippet}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B5CF6] shrink-0 group-hover:translate-x-0.5 transition-transform">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

