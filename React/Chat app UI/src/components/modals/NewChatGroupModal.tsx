import { useEffect, useState } from 'react';
import { Check, Users, X, Sparkles } from 'lucide-react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useContacts, useConversationActions, useConversations } from '../../hooks/useConversations';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

export function NewChatGroupModal() {
  const isOpen = useChatWorkspaceStore((s) => s.isNewGroupModalOpen);
  const sourceConvId = useChatWorkspaceStore((s) => s.escalationSourceConvId);
  const closeModal = useChatWorkspaceStore((s) => s.closeNewGroupModal);
  const currentUserId = usePresenceStore((s) => s.currentUserId);

  const { data: contacts = [] } = useContacts();
  const { data: conversations = [] } = useConversations();
  const { startDirectChat, createGroup } = useConversationActions();

  const sourceConv = sourceConvId
    ? conversations.find((c) => c.id === sourceConvId)
    : undefined;
  const sourcePeer =
    sourceConv?.type === 'direct'
      ? sourceConv.participantUsers.find((u) => u.id !== currentUserId)
      : undefined;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [shareLast20, setShareLast20] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    if (sourcePeer) {
      setSelectedIds([sourcePeer.id]);
      setGroupTitle(`${sourcePeer.displayName.split(' ')[0]} + Team`);
      setShareLast20(true);
    } else {
      setSelectedIds([]);
      setGroupTitle('');
      setShareLast20(false);
    }
  }, [isOpen, sourcePeer]);

  if (!isOpen) return null;

  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');
  const isGroupMode = Boolean(sourceConvId) || selectedIds.length > 1;

  const toggleUser = (uid: string) => {
    setSelectedIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    if (!isGroupMode && selectedIds.length === 1) {
      startDirectChat.mutate(selectedIds[0]);
      closeModal();
      return;
    }

    createGroup.mutate({
      title: groupTitle.trim() || 'New Group Chat',
      memberUserIds: selectedIds,
      sourceConversationId: sourceConvId ?? undefined,
      shareLast20Messages: Boolean(sourceConvId && shareLast20),
    });
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={closeModal}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-divider bg-surface-elevated shadow-2xl overflow-hidden animate-bubble-in"
      >
        <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-txt-primary">
              {sourcePeer
                ? `Escalate Chat with ${sourcePeer.displayName.split(' ')[0]} to Group`
                : 'New Direct Message or Group'}
            </h3>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-1 rounded-lg hover:bg-surface-tertiary text-txt-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isGroupMode && (
            <div>
              <label className="block text-xs font-medium text-txt-muted mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="e.g. Q4 Launch Crew"
                className="w-full rounded-xl bg-surface-tertiary border border-divider px-3 py-2 text-xs text-txt-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          )}

          {sourceConvId && (
            <label className="flex items-start gap-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={shareLast20}
                onChange={(e) => setShareLast20(e.target.checked)}
                className="mt-0.5 rounded border-divider text-blue-600"
              />
              <div>
                <p className="font-semibold text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Share last 20 messages of context
                </p>
                <p className="text-[11px] text-txt-muted mt-0.5">
                  Newly invited members can read recent decisions immediately without screenshots.
                </p>
              </div>
            </label>
          )}

          <div>
            <p className="text-xs font-medium text-txt-muted mb-2">
              Select Contacts ({selectedIds.length} selected)
            </p>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {acceptedContacts.map((c) => {
                const checked = selectedIds.includes(c.contactUserId);
                return (
                  <button
                    key={c.contactUserId}
                    type="button"
                    onClick={() => toggleUser(c.contactUserId)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-colors',
                      checked
                        ? 'border-blue-500/40 bg-blue-500/10'
                        : 'border-transparent hover:bg-surface-tertiary'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar user={c.user} size={32} showPresence />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-txt-primary truncate">
                          {c.user.displayName}
                        </p>
                        <p className="text-[11px] text-txt-muted truncate">{c.user.handle}</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center border',
                        checked
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-divider'
                      )}
                    >
                      {checked && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-divider bg-surface-secondary flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={closeModal}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-txt-muted hover:text-txt-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={selectedIds.length === 0}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-45 text-white text-xs font-semibold"
          >
            {isGroupMode ? 'Create Group Chat' : 'Start Chat'}
          </button>
        </div>
      </form>
    </div>
  );
}

