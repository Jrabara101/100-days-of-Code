import { useState } from 'react';
import {
  MessageSquare,
  GitBranch,
  Users,
  Bookmark,
  FolderArchive,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Command,
  Check,
} from 'lucide-react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useContacts, useConversations, useContactMutations } from '../../hooks/useConversations';
import { useAllThreads } from '../../hooks/useThreadReplies';
import { wsClient } from '../../lib/wsClient';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import type { PresenceStatus, PrimaryZone } from '../../types/chat';

const PRESENCE_OPTIONS: Array<{ value: PresenceStatus; label: string; dot: string }> = [
  { value: 'online', label: 'Online', dot: 'bg-[#10B981]' },
  { value: 'idle', label: 'Away', dot: 'bg-[#F59E0B]' },
  { value: 'dnd', label: 'Do Not Disturb', dot: 'bg-[#F43F5E]' },
  { value: 'offline', label: 'Appear Offline', dot: 'bg-[#64748B]' },
];

export function ModeRail() {
  const activeZone = useChatWorkspaceStore((s) => s.activeZone);
  const setActiveZone = useChatWorkspaceStore((s) => s.setActiveZone);
  const theme = useChatWorkspaceStore((s) => s.theme);
  const toggleTheme = useChatWorkspaceStore((s) => s.toggleTheme);
  const bookmarkedIds = useChatWorkspaceStore((s) => s.bookmarkedIds);
  const pendingOutboxCount = useChatWorkspaceStore((s) => s.pendingOutboxCount);
  const setCommandOpen = useChatWorkspaceStore((s) => s.setCommandOpen);
  const setMobileStage = useChatWorkspaceStore((s) => s.setMobileStage);
  const pushToast = useChatWorkspaceStore((s) => s.pushToast);

  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const usersById = usePresenceStore((s) => s.usersById);
  const connectionState = usePresenceStore((s) => s.connectionState);
  const simulatedOffline = usePresenceStore((s) => s.simulatedOffline);
  const setSimulatedOffline = usePresenceStore((s) => s.setSimulatedOffline);

  const currentUser = usersById[currentUserId];
  const { data: conversations = [] } = useConversations();
  const { data: contacts = [] } = useContacts();
  const { data: threads = [] } = useAllThreads();
  const { updateMyPresence } = useContactMutations();

  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [customStatus, setCustomStatus] = useState('');

  const totalUnreadChats = conversations.reduce((acc, c) => {
    const me = c.members.find((m) => m.userId === currentUserId);
    return acc + (me && !me.isArchived && me.unreadCount > 0 ? me.unreadCount : 0);
  }, 0);

  const pendingRequests = contacts.filter((c) => c.status === 'pending_request').length;
  const activeThreadsCount = threads.filter((t) => t.isFollowing).length;

  const navItems: Array<{
    zone: PrimaryZone;
    label: string;
    icon: typeof MessageSquare;
    badge?: number;
    badgeTone?: 'blue' | 'violet' | 'rose';
  }> = [
    {
      zone: 'chats',
      label: 'Active Chats',
      icon: MessageSquare,
      badge: totalUnreadChats,
      badgeTone: 'blue',
    },
    {
      zone: 'threads',
      label: 'My Threads',
      icon: GitBranch,
      badge: activeThreadsCount,
      badgeTone: 'violet',
    },
    {
      zone: 'contacts',
      label: 'Contacts Directory',
      icon: Users,
      badge: pendingRequests,
      badgeTone: 'rose',
    },
    {
      zone: 'bookmarks',
      label: 'Saved Messages',
      icon: Bookmark,
      badge: bookmarkedIds.length,
      badgeTone: 'blue',
    },
    {
      zone: 'vault',
      label: 'Shared Files & Media Vault',
      icon: FolderArchive,
    },
  ];

  const handleToggleOffline = () => {
    const next = !simulatedOffline;
    setSimulatedOffline(next);
    if (next) {
      wsClient.disconnectForOfflineMode();
      pushToast('Offline simulation active — outbound messages queue in IndexedDB', 'warning');
    } else {
      wsClient.connect();
      pushToast('Reconnecting WebSocket & draining IndexedDB outbox...', 'info');
    }
  };

  return (
    <aside className="relative z-30 w-16 shrink-0 bg-surface-tertiary border-r border-divider flex flex-col items-center justify-between py-3 select-none">
      {/* Top: Current User Avatar + Clickable Presence */}
      <div className="relative flex flex-col items-center gap-3">
        <button
          onClick={() => {
            setCustomStatus(currentUser?.statusText ?? '');
            setStatusMenuOpen((v) => !v);
          }}
          className="relative group rounded-full p-0.5 hover:ring-2 hover:ring-blue-500/50 transition-all"
          title={
            currentUser
              ? `${currentUser.displayName} (${currentUser.presence}) — Click to change status`
              : 'Profile status'
          }
        >
          <Avatar
            user={currentUser}
            size={36}
            showPresence
            ringClass="ring-2 ring-surface-tertiary"
          />
        </button>

        {statusMenuOpen && currentUser && (
          <div className="absolute left-14 top-0 z-50 w-64 rounded-2xl border border-divider bg-surface-elevated p-3 shadow-2xl">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-divider">
              <Avatar user={currentUser} size={32} showPresence />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-txt-primary truncate">
                  {currentUser.displayName}
                </p>
                <p className="text-[11px] text-txt-muted truncate">{currentUser.handle}</p>
              </div>
            </div>

            <div className="py-2 space-y-1">
              {PRESENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    updateMyPresence.mutate({ presence: opt.value });
                    wsClient.emit('presence:update', { presence: opt.value });
                    setStatusMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-surface-tertiary text-txt-primary transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className={cn('w-2.5 h-2.5 rounded-full', opt.dot)} />
                    {opt.label}
                  </span>
                  {currentUser.presence === opt.value && (
                    <Check className="w-3.5 h-3.5 text-blue-500" />
                  )}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMyPresence.mutate({
                  presence: currentUser.presence,
                  statusText: customStatus.trim(),
                });
                setStatusMenuOpen(false);
              }}
              className="pt-2 border-t border-divider flex items-center gap-1.5"
            >
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="Set custom status..."
                className="flex-1 min-w-0 rounded-lg bg-surface-tertiary border border-divider px-2 py-1 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-medium hover:bg-blue-500"
              >
                Save
              </button>
            </form>
          </div>
        )}

        <div className="w-6 h-px bg-divider" />

        {/* Center Icon Stack */}
        <nav className="flex flex-col items-center gap-2" aria-label="Primary Workspace Modes">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeZone === item.zone;
            return (
              <button
                key={item.zone}
                onClick={() => {
                  setActiveZone(item.zone);
                  setMobileStage('list');
                }}
                title={item.label}
                aria-label={item.label}
                className={cn(
                  'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-txt-muted hover:text-txt-primary hover:bg-surface-secondary'
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                {Boolean(item.badge && item.badge > 0) && (
                  <span
                    className={cn(
                      'tabular-nums-meta absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-surface-tertiary',
                      item.badgeTone === 'violet'
                        ? 'bg-[#8B5CF6]'
                        : item.badgeTone === 'rose'
                          ? 'bg-[#EF4444]'
                          : 'bg-blue-600'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls: Connection Health, Cmd+K, Theme Toggle */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleToggleOffline}
          title={
            simulatedOffline
              ? `Offline Simulation (${pendingOutboxCount} queued) — Click to reconnect`
              : `Connection: ${connectionState.toUpperCase()} — Click to test Offline IDB Queue`
          }
          className={cn(
            'w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold border transition-colors',
            connectionState === 'live'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
              : connectionState === 'connecting'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
          )}
        >
          {connectionState === 'offline' ? (
            <WifiOff className="w-3.5 h-3.5" />
          ) : (
            <Wifi className="w-3.5 h-3.5" />
          )}
          <span>{connectionState === 'live' ? 'Live' : connectionState === 'connecting' ? 'Sync' : 'Off'}</span>
          {pendingOutboxCount > 0 && (
            <span className="tabular-nums-meta absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center">
              {pendingOutboxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCommandOpen(true)}
          title="Command Switcher (⌘K)"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-surface-secondary transition-colors"
        >
          <Command className="w-[18px] h-[18px]" />
        </button>

        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle color theme"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-surface-secondary transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px] text-amber-400" />
          ) : (
            <Moon className="w-[18px] h-[18px] text-slate-600" />
          )}
        </button>
      </div>
    </aside>
  );
}

