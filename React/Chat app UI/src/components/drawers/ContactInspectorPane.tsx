import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BellOff,
  Bell,
  ExternalLink,
  FileText,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Star,
  UserPlus,
  Users,
  Video,
  X,
  Check,
} from 'lucide-react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../../stores/usePresenceStore';
import {
  useContactMutations,
  useContacts,
  useConversationActions,
  useConversations,
} from '../../hooks/useConversations';
import { useMessages } from '../../hooks/useMessages';
import { useLiveClock } from '../../hooks/useLiveClock';
import { getContactTimezoneInfo } from '../../lib/timezone';
import { cn, formatBytes, formatDuration, formatShortTime } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

type VaultTab = 'media' | 'files' | 'links' | 'voice';

export function ContactInspectorPane() {
  const now = useLiveClock(30_000);
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const usersById = usePresenceStore((s) => s.usersById);
  const currentUser = usersById[currentUserId];

  const activeConversationId = useChatWorkspaceStore((s) => s.activeConversationId);
  const closeRightPane = useChatWorkspaceStore((s) => s.closeRightPane);
  const setMobileStage = useChatWorkspaceStore((s) => s.setMobileStage);
  const selectConversation = useChatWorkspaceStore((s) => s.selectConversation);
  const openNewGroupModal = useChatWorkspaceStore((s) => s.openNewGroupModal);
  const setLightboxMedia = useChatWorkspaceStore((s) => s.setLightboxMedia);
  const setActiveCall = useChatWorkspaceStore((s) => s.setActiveCall);
  const pushToast = useChatWorkspaceStore((s) => s.pushToast);

  const { data: conversations = [] } = useConversations();
  const { data: contacts = [] } = useContacts();
  const { updateMember } = useConversationActions();
  const { updateContact } = useContactMutations();

  const conversation = conversations.find((c) => c.id === activeConversationId);
  const { data: messagesData } = useMessages(conversation?.id ?? null);

  const peer =
    conversation?.type === 'direct'
      ? conversation.participantUsers.find((u) => u.id !== currentUserId)
      : undefined;
  const contact = peer
    ? contacts.find((c) => c.contactUserId === peer.id)
    : undefined;
  const meMember = conversation?.members.find((m) => m.userId === currentUserId);

  const [notes, setNotes] = useState(contact?.privateNotes ?? '');
  const [editingAlias, setEditingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState(contact?.aliasName ?? '');
  const [newTagInput, setNewTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [vaultTab, setVaultTab] = useState<VaultTab>('media');

  useEffect(() => {
    setNotes(contact?.privateNotes ?? '');
    setAliasInput(contact?.aliasName ?? '');
    setEditingAlias(false);
  }, [contact?.contactUserId, contact?.privateNotes, contact?.aliasName]);

  const sharedGroups = useMemo(() => {
    if (!peer) return [];
    return conversations.filter(
      (c) =>
        c.type === 'group' &&
        c.participantUsers.some((u) => u.id === peer.id)
    );
  }, [conversations, peer]);

  const vaultItems = useMemo(() => {
    const msgs = messagesData?.pages.flatMap((p) => p.items) ?? [];
    const media: Array<{ msgId: string; createdAt: string; senderId: string; att: any }> = [];
    const files: Array<{ msgId: string; createdAt: string; senderId: string; att: any }> = [];
    const links: Array<{ msgId: string; createdAt: string; senderId: string; att: any }> = [];
    const voice: Array<{ msgId: string; createdAt: string; senderId: string; att: any }> = [];

    for (const m of msgs) {
      for (const att of m.attachments) {
        const entry = { msgId: m.id, createdAt: m.createdAt, senderId: m.senderId, att };
        if (att.kind === 'image' || att.kind === 'video') media.push(entry);
        else if (att.kind === 'file') files.push(entry);
        else if (att.kind === 'link') links.push(entry);
        else if (att.kind === 'voice') voice.push(entry);
      }
    }
    return { media, files, links, voice };
  }, [messagesData]);

  if (!conversation) return null;

  const title =
    conversation.type === 'group'
      ? conversation.title ?? 'Group Chat'
      : contact?.aliasName || peer?.displayName || 'Contact';

  const tzInfo = peer
    ? getContactTimezoneInfo(
        peer.timezone,
        peer.workingHours,
        currentUser?.timezone ?? 'Asia/Singapore',
        now
      )
    : null;

  const saveNotes = () => {
    if (!peer || !contact || notes === contact.privateNotes) return;
    updateContact.mutate({ userId: peer.id, patch: { privateNotes: notes } });
    pushToast('Saved private relationship note', 'success');
  };

  return (
    <aside className="w-full md:w-[340px] shrink-0 h-full border-l border-divider bg-surface-secondary flex flex-col">
      {/* Header */}
      <div className="h-16 px-4 border-b border-divider flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileStage('chat')}
            className="md:hidden p-1 rounded-lg hover:bg-surface-tertiary text-txt-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-bold text-txt-primary">
            {conversation.type === 'group' ? 'Group Inspector' : 'Contact Inspector'}
          </h3>
        </div>
        <button
          type="button"
          onClick={closeRightPane}
          className="p-1.5 rounded-lg hover:bg-surface-tertiary text-txt-muted hover:text-txt-primary"
          aria-label="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero Card */}
        <div className="p-5 border-b border-divider flex flex-col items-center text-center">
          <Avatar
            user={peer}
            users={conversation.participantUsers.filter((u) => u.id !== currentUserId)}
            isGroup={conversation.type === 'group'}
            title={title}
            size={80}
            showPresence={conversation.type === 'direct'}
            ringClass="ring-4 ring-surface-secondary"
          />

          <div className="mt-3 flex items-center gap-1.5">
            {editingAlias ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (peer) {
                    updateContact.mutate({
                      userId: peer.id,
                      patch: { aliasName: aliasInput.trim() || null },
                    });
                  }
                  setEditingAlias(false);
                }}
                className="flex items-center gap-1"
              >
                <input
                  type="text"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  placeholder={peer?.displayName}
                  autoFocus
                  className="w-36 rounded-lg bg-surface-tertiary border border-divider px-2 py-0.5 text-xs text-txt-primary"
                />
                <button type="submit" className="p-1 rounded bg-blue-600 text-white">
                  <Check className="w-3 h-3" />
                </button>
              </form>
            ) : (
              <>
                <h4 className="text-base font-bold text-txt-primary">{title}</h4>
                {peer && contact && (
                  <button
                    type="button"
                    onClick={() => setEditingAlias(true)}
                    title="Edit custom alias"
                    className="p-1 rounded hover:bg-surface-tertiary text-txt-muted"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </>
            )}
          </div>

          {peer ? (
            <>
              <p className="text-xs text-txt-muted mt-0.5">
                {peer.handle} {peer.roleTitle ? `• ${peer.roleTitle}` : ''}
              </p>
              {tzInfo && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-tertiary border border-divider text-[11px] text-txt-primary">
                  <MapPin className="w-3 h-3 text-blue-500" />
                  <span className="tabular-nums-meta">
                    {tzInfo.city} • {tzInfo.localTime12h} ({tzInfo.statusLabel})
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="tabular-nums-meta text-xs text-txt-muted mt-1">
              {conversation.participantUsers.length} members
            </p>
          )}

          {/* 4 Quick Action Buttons */}
          <div className="mt-4 grid grid-cols-4 gap-2 w-full">
            <button
              type="button"
              onClick={() =>
                setActiveCall({
                  conversationId: conversation.id,
                  title,
                  participants: conversation.participantUsers.filter((u) => u.id !== currentUserId),
                  mode: 'audio',
                  startedAt: Date.now(),
                })
              }
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-tertiary hover:bg-blue-500/15 text-txt-muted hover:text-blue-500 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-[10px] font-medium">Audio</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveCall({
                  conversationId: conversation.id,
                  title,
                  participants: conversation.participantUsers.filter((u) => u.id !== currentUserId),
                  mode: 'video',
                  startedAt: Date.now(),
                })
              }
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-tertiary hover:bg-blue-500/15 text-txt-muted hover:text-blue-500 transition-colors"
            >
              <Video className="w-4 h-4" />
              <span className="text-[10px] font-medium">Video</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateMember.mutate({
                  conversationId: conversation.id,
                  patch: { isMuted: !meMember?.isMuted },
                })
              }
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-tertiary transition-colors',
                meMember?.isMuted
                  ? 'text-amber-500 bg-amber-500/10'
                  : 'text-txt-muted hover:text-txt-primary'
              )}
            >
              {meMember?.isMuted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              <span className="text-[10px] font-medium">
                {meMember?.isMuted ? 'Unmute' : 'Mute'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => openNewGroupModal(conversation.id)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-tertiary hover:bg-blue-500/15 text-txt-muted hover:text-blue-500 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-[10px] font-medium">Group</span>
            </button>
          </div>
        </div>

        {/* Relationship Context & Circles (Direct Contacts) */}
        {peer && contact && (
          <div className="p-4 border-b border-divider space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-txt-muted">
                Circles &amp; Context
              </span>
              <button
                type="button"
                onClick={() =>
                  updateContact.mutate({
                    userId: peer.id,
                    patch: { isFavorite: !contact.isFavorite },
                  })
                }
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                  contact.isFavorite
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-surface-tertiary border-divider text-txt-muted'
                )}
              >
                <Star className={cn('w-3 h-3', contact.isFavorite && 'fill-current')} />
                Favorite
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {contact.circleTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-500 text-[11px] font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      updateContact.mutate({
                        userId: peer.id,
                        patch: { circleTags: contact.circleTags.filter((t) => t !== tag) },
                      })
                    }
                    className="hover:text-rose-500"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}

              {addingTag ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const t = newTagInput.trim();
                    if (t && !contact.circleTags.includes(t)) {
                      updateContact.mutate({
                        userId: peer.id,
                        patch: { circleTags: [...contact.circleTags, t] },
                      });
                    }
                    setNewTagInput('');
                    setAddingTag(false);
                  }}
                >
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onBlur={() => setAddingTag(false)}
                    autoFocus
                    placeholder="Circle name..."
                    className="w-24 rounded-full bg-surface-tertiary border border-divider px-2 py-0.5 text-[11px] text-txt-primary focus:outline-none"
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingTag(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-tertiary border border-divider text-[11px] text-txt-muted hover:text-txt-primary"
                >
                  <Plus className="w-3 h-3" /> Add Tag
                </button>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-txt-muted mb-1">
                Private Relationship Note
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="Met at Config • Add preferences or context..."
                className="w-full rounded-xl bg-surface-tertiary border border-divider p-2.5 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Shared Groups Overlap */}
            <div>
              <p className="text-[11px] font-medium text-txt-muted flex items-center gap-1.5 mb-1.5">
                <Users className="w-3.5 h-3.5" />
                {sharedGroups.length} Group{sharedGroups.length === 1 ? '' : 's'} in Common
              </p>
              <div className="space-y-1">
                {sharedGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => selectConversation(g.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-surface-tertiary/70 hover:bg-surface-tertiary text-xs text-txt-primary transition-colors"
                  >
                    <span className="font-medium truncate">{g.title}</span>
                    <span className="tabular-nums-meta text-[10px] text-txt-muted">
                      {g.participantUsers.length} members
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabbed Shared Memory Vault */}
        <div className="p-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-txt-muted">
            Shared Memory Vault
          </p>

          <div className="grid grid-cols-4 gap-1 rounded-xl bg-surface-tertiary p-1 text-[11px]">
            {(
              [
                ['media', `Media (${vaultItems.media.length})`],
                ['files', `Files (${vaultItems.files.length})`],
                ['links', `Links (${vaultItems.links.length})`],
                ['voice', `Voice (${vaultItems.voice.length})`],
              ] as Array<[VaultTab, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setVaultTab(key)}
                className={cn(
                  'tabular-nums-meta py-1 rounded-lg font-medium transition-colors truncate px-1',
                  vaultTab === key
                    ? 'bg-surface-elevated text-txt-primary shadow-sm'
                    : 'text-txt-muted hover:text-txt-primary'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {vaultTab === 'media' && (
            vaultItems.media.length === 0 ? (
              <p className="py-6 text-center text-xs text-txt-muted">No shared images yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {vaultItems.media.map((item) => (
                  <button
                    key={item.att.id}
                    type="button"
                    onClick={() => setLightboxMedia(item.att)}
                    className="aspect-square rounded-lg overflow-hidden border border-divider hover:opacity-90 cursor-zoom-in"
                  >
                    <img
                      src={item.att.url}
                      alt={item.att.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )
          )}

          {vaultTab === 'files' && (
            vaultItems.files.length === 0 ? (
              <p className="py-6 text-center text-xs text-txt-muted">No files shared yet.</p>
            ) : (
              <div className="space-y-2">
                {vaultItems.files.map((item) => (
                  <div
                    key={item.att.id}
                    className="rounded-xl border border-divider bg-surface-tertiary/70 p-2.5 flex items-center gap-2.5 text-xs"
                  >
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-txt-primary truncate">{item.att.name}</p>
                      <p className="tabular-nums-meta text-[10px] text-txt-muted">
                        {item.att.ext} • {formatBytes(item.att.sizeBytes)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {vaultTab === 'links' && (
            vaultItems.links.length === 0 ? (
              <p className="py-6 text-center text-xs text-txt-muted">No links shared yet.</p>
            ) : (
              <div className="space-y-2">
                {vaultItems.links.map((item) => (
                  <a
                    key={item.att.id}
                    href={item.att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-divider bg-surface-tertiary/70 hover:border-blue-500/40 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-blue-500">
                      <span>{item.att.domain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                    <p className="font-semibold text-txt-primary line-clamp-1">{item.att.title}</p>
                  </a>
                ))}
              </div>
            )
          )}

          {vaultTab === 'voice' && (
            vaultItems.voice.length === 0 ? (
              <p className="py-6 text-center text-xs text-txt-muted">No voice notes yet.</p>
            ) : (
              <div className="space-y-2">
                {vaultItems.voice.map((item) => (
                  <div
                    key={item.att.id}
                    className="rounded-xl border border-divider bg-surface-tertiary/70 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-txt-primary">
                        🎙️ {usersById[item.senderId]?.displayName.split(' ')[0] ?? 'Voice'}
                      </span>
                      <span className="tabular-nums-meta text-[10px] text-txt-muted">
                        {formatDuration(item.att.durationSec)} • {formatShortTime(item.createdAt)}
                      </span>
                    </div>
                    {item.att.transcript && (
                      <p className="text-[11px] text-txt-muted line-clamp-2">
                        “{item.att.transcript}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </aside>
  );
}

