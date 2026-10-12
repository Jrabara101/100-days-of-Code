import React from 'react';
import { Pin, Users, BellOff } from 'lucide-react';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (now - date) / (1000 * 60 * 60);

  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  if (diffHours < 48) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
}

export default function ConversationItem({
  conversation,
  isActive,
  primaryRecipient,
  onSelect,
  onTogglePin,
}) {
  const isGroup = conversation.type === 'group';
  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
  const lastTime = formatRelativeTime(lastMessage?.created_at || conversation.updatedAt);

  const presenceStatus = primaryRecipient?.status || 'online';
  const presenceColor =
    presenceStatus === 'online'
      ? 'bg-emerald-500'
      : presenceStatus === 'idle'
      ? 'bg-amber-500'
      : 'bg-slate-400';

  const previewSnippet = lastMessage
    ? lastMessage.content || (lastMessage.attachments?.length ? 'Shared an attachment' : '')
    : 'No messages yet';

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 select-none border-l-2 ${
        isActive
          ? 'bg-blue-500/10 border-blue-500 text-slate-900 dark:text-white'
          : 'border-transparent hover:bg-slate-100 dark:hover:bg-[#181A20] text-slate-700 dark:text-slate-300'
      }`}
    >
      {/* 44px Avatar with bottom-right presence ring */}
      <div className="relative flex-shrink-0 mr-3">
        {isGroup ? (
          <div className="w-11 h-11 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
            <Users className="w-5 h-5" />
          </div>
        ) : (
          <>
            <img
              src={primaryRecipient?.avatar}
              alt={primaryRecipient?.name}
              className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-[#23262D]"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#121316] ${presenceColor}`}
            />
          </>
        )}
      </div>

      {/* Title & Preview snippet */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1.5 truncate">
            <span className="font-semibold text-xs tracking-tight truncate">
              {isGroup ? conversation.title : primaryRecipient?.name}
            </span>
            {conversation.muted && (
              <BellOff className="w-3 h-3 text-slate-400 flex-shrink-0" />
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400 dark:text-[#8F9CAE] flex-shrink-0 ml-1">
            {lastTime}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p
            className={`text-xs truncate pr-2 ${
              conversation.unreadCount > 0
                ? 'font-semibold text-slate-900 dark:text-[#F8FAFC]'
                : 'text-slate-500 dark:text-[#8F9CAE]'
            }`}
          >
            {previewSnippet}
          </p>

          <div className="flex items-center space-x-1 flex-shrink-0">
            {conversation.pinned && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin?.(conversation.id);
                }}
                title="Pinned conversation"
                className="text-blue-500 p-0.5 hover:opacity-80"
              >
                <Pin className="w-3 h-3 fill-current rotate-45" />
              </button>
            )}

            {conversation.unreadCount > 0 && (
              <span className="bg-blue-600 text-white rounded-full text-[10.5px] font-bold px-1.5 py-0.2 min-w-4 text-center">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
