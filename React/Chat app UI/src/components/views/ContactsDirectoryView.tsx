import { useMemo, useState } from 'react';
import {
  MessageSquare,
  Phone,
  QrCode,
  Search,
  Star,
  UserPlus,
  Clock,
  ShieldAlert,
  Check,
  X,
} from 'lucide-react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../../stores/usePresenceStore';
import {
  useContactMutations,
  useContacts,
  useConversationActions,
} from '../../hooks/useConversations';
import { useLiveClock } from '../../hooks/useLiveClock';
import { getContactTimezoneInfo } from '../../lib/timezone';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

export function ContactsDirectoryView() {
  const now = useLiveClock(30_000);
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const usersById = usePresenceStore((s) => s.usersById);
  const currentUser = usersById[currentUserId];

  const selectedCircle = useChatWorkspaceStore((s) => s.selectedContactCircle);
  const setSelectedCircle = useChatWorkspaceStore((s) => s.setSelectedContactCircle);
  const setContactExchangeOpen = useChatWorkspaceStore((s) => s.setContactExchangeOpen);
  const setActiveCall = useChatWorkspaceStore((s) => s.setActiveCall);
  const pushToast = useChatWorkspaceStore((s) => s.pushToast);

  const { data: contacts = [] } = useContacts();
  const { updateContact } = useContactMutations();
  const { startDirectChat } = useConversationActions();

  const [query, setQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const accepted = useMemo(
    () => contacts.filter((c) => c.status === 'accepted'),
    [contacts]
  );
  const pending = useMemo(
    () => contacts.filter((c) => c.status === 'pending_request'),
    [contacts]
  );

  const customCircles = useMemo(() => {
    const set = new Set<string>();
    for (const c of accepted) {
      for (const tag of c.circleTags) set.add(tag);
    }
    return Array.from(set).sort();
  }, [accepted]);

  const onlineNowCount = useMemo(
    () => accepted.filter((c) => c.user.presence === 'online').length,
    [accepted]
  );
  const favoritesCount = useMemo(
    () => accepted.filter((c) => c.isFavorite).length,
    [accepted]
  );

  const filteredContacts = useMemo(() => {
    if (selectedCircle === 'Message Requests') return pending;

    const q = query.trim().toLowerCase();
    return accepted.filter((c) => {
      if (selectedCircle === 'Online Now' && c.user.presence !== 'online') return false;
      if (selectedCircle === 'Favorites' && !c.isFavorite) return false;
      if (
        selectedCircle !== 'All Contacts' &&
        selectedCircle !== 'Online Now' &&
        selectedCircle !== 'Favorites' &&
        !c.circleTags.includes(selectedCircle)
      ) {
        return false;
      }

      if (selectedLetter && !c.user.displayName.toUpperCase().startsWith(selectedLetter)) {
        return false;
      }

      if (!q) return true;
      return (
        c.user.displayName.toLowerCase().includes(q) ||
        c.user.handle.toLowerCase().includes(q) ||
        c.user.timezone.toLowerCase().includes(q) ||
        c.privateNotes.toLowerCase().includes(q) ||
        c.circleTags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [accepted, pending, selectedCircle, selectedLetter, query]);

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    for (const c of accepted) {
      letters.add(c.user.displayName[0]?.toUpperCase() ?? 'A');
    }
    return Array.from(letters).sort();
  }, [accepted]);

  return (
    <div className="flex-1 min-w-0 h-full flex bg-canvas overflow-hidden">
      {/* Left Pane (320px): Circle & Filter Tree */}
      <aside className="w-72 lg:w-80 shrink-0 border-r border-divider bg-surface-secondary flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-divider flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-txt-primary">Contacts Directory</h1>
            <p className="text-[11px] text-txt-muted">Living Address Book</p>
          </div>
          <button
            type="button"
            onClick={() => setContactExchangeOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          <div className="space-y-1">
            {[
              { key: 'All Contacts', label: 'All Contacts', count: accepted.length, icon: '👥' },
              { key: 'Online Now', label: 'Online Now', count: onlineNowCount, icon: '🟢' },
              { key: 'Favorites', label: 'Favorites', count: favoritesCount, icon: '⭐' },
              {
                key: 'Message Requests',
                label: 'Message Requests',
                count: pending.length,
                icon: '📥',
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setSelectedCircle(item.key);
                  setSelectedLetter(null);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                  selectedCircle === item.key
                    ? 'bg-blue-500/15 text-blue-500 font-semibold'
                    : 'text-txt-primary hover:bg-surface-tertiary'
                )}
              >
                <span className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                <span className="tabular-nums-meta px-1.5 py-0.5 rounded-full bg-surface-tertiary text-[11px] text-txt-muted">
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-txt-muted">
              Custom Circles
            </p>
            <div className="space-y-1">
              {customCircles.map((circle) => {
                const count = accepted.filter((c) => c.circleTags.includes(circle)).length;
                return (
                  <button
                    key={circle}
                    type="button"
                    onClick={() => {
                      setSelectedCircle(circle);
                      setSelectedLetter(null);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                      selectedCircle === circle
                        ? 'bg-blue-500/15 text-blue-500 font-semibold'
                        : 'text-txt-primary hover:bg-surface-tertiary'
                    )}
                  >
                    <span>#{circle}</span>
                    <span className="tabular-nums-meta text-[11px] text-txt-muted">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shareable QR / Link Identity Card Trigger */}
          <div className="rounded-2xl border border-divider bg-surface-elevated p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-txt-primary">
              <QrCode className="w-4 h-4 text-blue-500" />
              <span>Share Your Relay Card</span>
            </div>
            <p className="text-[11px] text-txt-muted leading-relaxed">
              Let teammates scan your QR identity or search <span className="font-mono text-txt-primary">{currentUser?.handle ?? '@river'}</span>.
            </p>
            <button
              type="button"
              onClick={() => setContactExchangeOpen(true)}
              className="w-full py-1.5 rounded-xl border border-divider bg-surface-tertiary hover:bg-blue-500/10 text-xs font-medium text-txt-primary transition-colors"
            >
              Open QR &amp; @Handle Exchange
            </button>
          </div>
        </div>
      </aside>

      {/* Center Stage: Search + A-Z Index + Contact Cards */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-divider bg-canvas/85 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-txt-primary">{selectedCircle}</h2>
            <span className="tabular-nums-meta text-xs text-txt-muted">
              {filteredContacts.length} contact{filteredContacts.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-txt-muted absolute left-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, @handle, note, circle, or timezone..."
              className="w-full rounded-xl bg-surface-secondary border border-divider pl-10 pr-4 py-2 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Alphabetical Index Bar */}
          {selectedCircle !== 'Message Requests' && (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedLetter(null)}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[11px] font-semibold',
                  selectedLetter === null
                    ? 'bg-blue-600 text-white'
                    : 'text-txt-muted hover:text-txt-primary'
                )}
              >
                All
              </button>
              {availableLetters.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() =>
                    setSelectedLetter((prev) => (prev === letter ? null : letter))
                  }
                  className={cn(
                    'w-6 h-6 rounded-md text-[11px] font-semibold transition-colors',
                    selectedLetter === letter
                      ? 'bg-blue-600 text-white'
                      : 'text-txt-muted hover:bg-surface-tertiary hover:text-txt-primary'
                  )}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {selectedCircle === 'Message Requests' && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3.5 flex items-center gap-3 text-xs text-amber-300 mb-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Quarantined requests protect your live timezone and presence visibility until you explicitly accept.
              </span>
            </div>
          )}

          {filteredContacts.length === 0 ? (
            <div className="py-16 text-center text-xs text-txt-muted">
              No contacts match your current filter.
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const tzInfo = getContactTimezoneInfo(
                contact.user.timezone,
                contact.user.workingHours,
                currentUser?.timezone ?? 'Asia/Singapore',
                now
              );

              return (
                <div
                  key={contact.contactUserId}
                  className="rounded-2xl border border-divider bg-surface-elevated p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-blue-500/40 transition-all"
                >
                  {/* Left: Avatar + Identity + Status */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar
                      user={contact.user}
                      size={52}
                      showPresence={contact.status === 'accepted'}
                      ringClass="ring-2 ring-surface-elevated"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-txt-primary truncate">
                          {contact.aliasName || contact.user.displayName}
                        </h3>
                        <span className="text-xs text-txt-muted">{contact.user.handle}</span>
                      </div>
                      <p className="text-xs text-txt-muted truncate mt-0.5">
                        {contact.user.statusEmoji} {contact.user.statusText}
                      </p>
                      {contact.privateNotes && (
                        <p className="text-[11px] text-txt-muted/80 truncate mt-1 max-w-md">
                          📝 {contact.privateNotes}
                        </p>
                      )}
                      {contact.status === 'pending_request' && contact.requestPreview && (
                        <p className="text-xs text-txt-primary bg-surface-tertiary rounded-xl px-3 py-2 mt-2 border border-divider">
                          “{contact.requestPreview}”
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Center Metadata: Local Timezone Pill + Circles + Mutuals */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'tabular-nums-meta inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border',
                        tzInfo.isSleeping
                          ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400'
                          : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      {tzInfo.isSleeping ? '🌙' : '🕒'} {tzInfo.localTime24h} {tzInfo.city} •{' '}
                      {tzInfo.statusLabel}
                    </span>

                    {contact.circleTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-surface-tertiary border border-divider text-[11px] font-medium text-txt-muted"
                      >
                        {tag}
                      </span>
                    ))}

                    <span className="tabular-nums-meta text-[11px] text-txt-muted">
                      {contact.mutualCount} mutual{contact.mutualCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Right Quick Actions */}
                  {contact.status === 'pending_request' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          updateContact.mutate({
                            userId: contact.contactUserId,
                            patch: { status: 'accepted' },
                          });
                          startDirectChat.mutate(contact.contactUserId);
                          pushToast(`Accepted ${contact.user.displayName}`, 'success');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept &amp; Message
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateContact.mutate({
                            userId: contact.contactUserId,
                            patch: { status: 'blocked' },
                          })
                        }
                        className="p-2 rounded-xl bg-surface-tertiary hover:bg-rose-500/15 text-txt-muted hover:text-rose-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateContact.mutate({
                            userId: contact.contactUserId,
                            patch: { isFavorite: !contact.isFavorite },
                          })
                        }
                        title="Toggle Favorite"
                        className={cn(
                          'p-2 rounded-xl border border-divider transition-colors',
                          contact.isFavorite
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-surface-tertiary text-txt-muted hover:text-txt-primary'
                        )}
                      >
                        <Star
                          className={cn('w-4 h-4', contact.isFavorite && 'fill-current')}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveCall({
                            conversationId: contact.contactUserId,
                            title: contact.user.displayName,
                            participants: [contact.user],
                            mode: 'audio',
                            startedAt: Date.now(),
                          })
                        }
                        title="Call"
                        className="p-2 rounded-xl bg-surface-tertiary border border-divider text-txt-muted hover:text-txt-primary"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startDirectChat.mutate(contact.contactUserId)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

