import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Pin,
  Moon,
  Sun,
  Activity,
  MessageSquare,
  Sparkles,
  Sliders,
} from 'lucide-react';
import ConversationItem from './ConversationItem';

export default function ConversationList({
  conversations = [],
  activeConversationId,
  currentUser,
  participantsMap = {},
  onSelectConversation,
  onTogglePin,
  onOpenNewChatModal,
  onOpenPusherModal,
  darkMode,
  onToggleDarkMode,
  connectionState,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'direct' | 'group'

  // Filtered and partitioned conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // 1. Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const otherParticipant =
          c.type === 'direct'
            ? c.participantIds
                .map((id) => participantsMap[id]?.name?.toLowerCase())
                .find((n) => n && n.includes(q))
            : null;
        const matchesTitle = c.title?.toLowerCase().includes(q);
        const matchesMessage = c.messages?.some((m) =>
          m.content?.toLowerCase().includes(q)
        );
        if (!otherParticipant && !matchesTitle && !matchesMessage) return false;
      }

      // 2. Tab Filter
      if (filter === 'unread' && c.unreadCount === 0) return false;
      if (filter === 'direct' && c.type !== 'direct') return false;
      if (filter === 'group' && c.type !== 'group') return false;

      return true;
    });
  }, [conversations, search, filter, participantsMap]);

  const pinnedConversations = filteredConversations.filter((c) => c.pinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.pinned);

  return (
    <div className="w-full md:w-80 h-full flex flex-col bg-slate-50 dark:bg-[#121316] border-r border-slate-200 dark:border-[#23262D] flex-shrink-0 select-none">
      {/* Top Header: Current User + Workspace + New Message */}
      <div className="p-3.5 border-b border-slate-200 dark:border-[#23262D] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#23262D]"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-50 dark:border-[#121316]" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
              Pulse Messenger
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-[#8F9CAE]">
              {currentUser.name}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewChatModal}
          title="New Direct Message (Cmd+N)"
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input Bar (Cmd+K) */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-[#8F9CAE] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations... (Cmd+K)"
            className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs bg-white dark:bg-[#181A20] border border-slate-200 dark:border-[#23262D] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#8F9CAE] focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center space-x-1 mt-2.5 text-[11px] font-medium text-slate-500 dark:text-[#8F9CAE]">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'direct', label: 'DMs' },
            { id: 'group', label: 'Groups' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition ${
                filter === tab.id
                  ? 'bg-white dark:bg-[#181A20] text-blue-600 dark:text-blue-400 font-semibold shadow-xs border border-slate-200 dark:border-[#23262D]'
                  : 'hover:bg-slate-200/50 dark:hover:bg-[#181A20]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Stream */}
      <div className="flex-grow overflow-y-auto px-2 py-1 space-y-4">
        {/* Pinned Section */}
        {pinnedConversations.length > 0 && (
          <div>
            <div className="flex items-center space-x-1.5 px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8F9CAE]">
              <Pin className="w-3 h-3 rotate-45" />
              <span>Pinned Discussions</span>
            </div>
            <div className="space-y-0.5">
              {pinnedConversations.map((conv) => {
                const primaryRecipient =
                  conv.type === 'direct'
                    ? conv.participantIds
                        .filter((id) => id !== currentUser.id)
                        .map((id) => participantsMap[id])[0]
                    : null;

                return (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    primaryRecipient={primaryRecipient}
                    onSelect={() => onSelectConversation(conv.id)}
                    onTogglePin={onTogglePin}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* All / Recent Section */}
        <div>
          {pinnedConversations.length > 0 && unpinnedConversations.length > 0 && (
            <div className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8F9CAE]">
              Recent Conversations
            </div>
          )}
          <div className="space-y-0.5">
            {unpinnedConversations.map((conv) => {
              const primaryRecipient =
                conv.type === 'direct'
                  ? conv.participantIds
                      .filter((id) => id !== currentUser.id)
                      .map((id) => participantsMap[id])[0]
                  : null;

              return (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  primaryRecipient={primaryRecipient}
                  onSelect={() => onSelectConversation(conv.id)}
                  onTogglePin={onTogglePin}
                />
              );
            })}
          </div>
        </div>

        {filteredConversations.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-[#8F9CAE]">
            No conversations match your search.
          </div>
        )}
      </div>

      {/* Bottom Footer: Theme Switcher & Pusher Connection status */}
      <div className="p-3 border-t border-slate-200 dark:border-[#23262D] bg-white dark:bg-[#0B0C0E] flex items-center justify-between text-xs">
        <button
          onClick={onOpenPusherModal}
          className="flex items-center space-x-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#181A20] text-slate-600 dark:text-slate-300 font-mono text-[11px] transition"
          title="Inspect Pusher WebSockets & Laravel Echo Channel Architecture"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === 'connected'
                ? 'bg-emerald-500'
                : connectionState === 'reconnecting'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-red-500'
            }`}
          />
          <span>Pusher / Echo</span>
        </button>

        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Obsidian Dark'}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181A20] transition"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </div>
  );
}
