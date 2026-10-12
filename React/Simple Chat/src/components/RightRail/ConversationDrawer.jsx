import React, { useState } from 'react';
import {
  X,
  Bell,
  BellOff,
  Clock,
  UserPlus,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Shield,
  Activity,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function ConversationDrawer({
  conversation,
  participants = [],
  currentUser,
  onClose,
  onToggleMute,
  onToggleReadReceipts,
  readReceiptsEnabled,
  onOpenInviteModal,
  onOpenImage,
}) {
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'links' | 'members' | 'channel'

  const isGroup = conversation?.type === 'group';
  const primaryRecipient = !isGroup
    ? participants.find((p) => p.id !== currentUser.id)
    : null;

  // Extract shared media, links, and code from conversation messages
  const mediaItems = [];
  const linkItems = [];

  conversation?.messages?.forEach((msg) => {
    msg.attachments?.forEach((att) => {
      if (att.type === 'image') {
        mediaItems.push({ ...att, messageId: msg.id, date: msg.created_at });
      } else if (att.type === 'link') {
        linkItems.push({ ...att, messageId: msg.id, date: msg.created_at });
      }
    });
  });

  return (
    <div className="w-72 md:w-80 h-full border-l border-slate-200 dark:border-[#23262D] bg-white dark:bg-[#121316] flex flex-col flex-shrink-0 animate-pop-in select-none">
      {/* Top Header */}
      <div className="h-16 px-4 border-b border-slate-200 dark:border-[#23262D] flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8F9CAE]">
          Conversation Info
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181A20] transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-5">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 dark:bg-[#181A20] border border-slate-200/80 dark:border-[#23262D]">
          <div className="relative mb-2">
            <img
              src={isGroup ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80' : primaryRecipient?.avatar}
              alt={isGroup ? conversation.title : primaryRecipient?.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-[#121316] shadow-sm"
            />
            {!isGroup && (
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#181A20] ${
                  primaryRecipient?.status === 'online'
                    ? 'bg-emerald-500'
                    : primaryRecipient?.status === 'idle'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
            )}
          </div>

          <h4 className="font-semibold text-sm text-slate-900 dark:text-[#F8FAFC]">
            {isGroup ? conversation.title : primaryRecipient?.name}
          </h4>
          <p className="text-xs text-slate-500 dark:text-[#8F9CAE] mt-0.5">
            {isGroup ? `${participants.length} Active Participants` : primaryRecipient?.title}
          </p>
          {primaryRecipient?.bio && (
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 italic px-2">
              "{primaryRecipient.bio}"
            </p>
          )}

          {/* Timezone badge */}
          {primaryRecipient?.timezone && (
            <div className="mt-2.5 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-[10.5px] font-medium text-blue-600 dark:text-blue-400">
              <Clock className="w-3 h-3" />
              <span>{primaryRecipient.timezone}</span>
            </div>
          )}
        </div>

        {/* Action Controls & Privacy Toggles */}
        <div className="space-y-2">
          {/* Mute Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#181A20] border border-slate-200/80 dark:border-[#23262D]">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              {conversation.muted ? (
                <BellOff className="w-4 h-4 text-amber-500" />
              ) : (
                <Bell className="w-4 h-4 text-slate-500" />
              )}
              <span>Mute Notifications</span>
            </div>
            <button
              onClick={onToggleMute}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                conversation.muted ? 'bg-blue-600' : 'bg-slate-300 dark:bg-[#23262D]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  conversation.muted ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Read Receipts Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#181A20] border border-slate-200/80 dark:border-[#23262D]">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <div>
                <div>Read Receipts</div>
                <div className="text-[10px] text-slate-400 dark:text-[#8F9CAE]">
                  Sent ✓, Delivered ✓✓, Read ✓✓
                </div>
              </div>
            </div>
            <button
              onClick={onToggleReadReceipts}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                readReceiptsEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-[#23262D]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  readReceiptsEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Add Member / Convert to Group Button */}
          <button
            onClick={onOpenInviteModal}
            className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isGroup ? 'Invite Participants' : 'Convert into Group Thread'}</span>
          </button>
        </div>

        {/* Tabbed Shared Content Gallery & Participants */}
        <div>
          <div className="flex border-b border-slate-200 dark:border-[#23262D] text-xs font-medium mb-3">
            {[
              { id: 'media', label: `Media (${mediaItems.length})`, icon: ImageIcon },
              { id: 'links', label: `Links (${linkItems.length})`, icon: LinkIcon },
              { id: 'members', label: `Members (${participants.length})`, icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 pb-2 text-center transition border-b-2 text-[11px] ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'border-transparent text-slate-400 dark:text-[#8F9CAE] hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Media Grid Tab */}
          {activeTab === 'media' && (
            <div>
              {mediaItems.length === 0 ? (
                <p className="text-center text-xs text-slate-400 dark:text-[#8F9CAE] py-4">
                  No images shared in this chat yet.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {mediaItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => onOpenImage?.(item.url)}
                      className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-[#23262D] cursor-pointer hover:opacity-90 transition group relative"
                    >
                      <img
                        src={item.url}
                        alt="Shared"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <div className="space-y-2">
              {linkItems.length === 0 ? (
                <p className="text-center text-xs text-slate-400 dark:text-[#8F9CAE] py-4">
                  No links shared yet.
                </p>
              ) : (
                linkItems.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-[#181A20] border border-slate-200 dark:border-[#23262D] text-xs hover:border-blue-400 transition"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <div className="truncate">
                      <div className="font-medium truncate text-slate-900 dark:text-slate-100">
                        {item.title || item.url}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#8F9CAE]">
                        {item.domain}
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

          {/* Members List Tab */}
          {activeTab === 'members' && (
            <div className="space-y-2">
              {participants.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#181A20] border border-slate-200/80 dark:border-[#23262D]"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white dark:border-[#181A20] ${
                          user.status === 'online'
                            ? 'bg-emerald-500'
                            : user.status === 'idle'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {user.name} {user.id === currentUser.id && '(You)'}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#8F9CAE] truncate">
                        {user.title || user.email}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Laravel Echo & Pusher Channel Architecture Inspector */}
        <div className="p-3 rounded-2xl bg-slate-900 dark:bg-[#0B0C0E] text-slate-200 border border-slate-700/60 dark:border-[#23262D] text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wider text-blue-400 mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Broadcasting Channels</span>
          </div>
          <div className="space-y-1 font-mono text-[11px] opacity-90">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Private:</span>
              <span className="text-emerald-400">private-chat.{conversation.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Presence:</span>
              <span className="text-cyan-400">presence-chat.{conversation.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Auth Gate:</span>
              <span className="text-slate-300">/broadcasting/auth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
