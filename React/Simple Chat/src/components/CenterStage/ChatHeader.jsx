import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Search,
  Bell,
  BellOff,
  Sidebar,
  Radio,
  Sparkles,
  Wifi,
  MoreVertical,
  Users,
} from 'lucide-react';

function getLocalTimeInfo(timeZone) {
  if (!timeZone) return null;
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
    const timeStr = formatter.format(now);

    // Estimate hour in target timezone for sleep prompt
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(hourFormatter.format(now), 10);
    const mayBeSleeping = hour >= 23 || hour < 7;

    return { timeStr, mayBeSleeping };
  } catch {
    return null;
  }
}

export default function ChatHeader({
  conversation,
  otherParticipants = [],
  isMobile,
  onBack,
  onToggleDrawer,
  isDrawerOpen,
  onToggleSearch,
  isSearchOpen,
  onToggleMute,
  onSimulateInbound,
  onToggleSimulateDisconnect,
  connectionState,
}) {
  const [timeInfo, setTimeInfo] = useState(null);

  const isGroup = conversation?.type === 'group';
  const primaryRecipient = !isGroup ? otherParticipants[0] : null;

  // Refresh recipient local time every 30 seconds
  useEffect(() => {
    if (primaryRecipient?.timezone) {
      setTimeInfo(getLocalTimeInfo(primaryRecipient.timezone));
      const interval = setInterval(() => {
        setTimeInfo(getLocalTimeInfo(primaryRecipient.timezone));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [primaryRecipient]);

  // Presence state
  const presenceStatus = primaryRecipient?.status || 'online';
  const presenceColor =
    presenceStatus === 'online'
      ? 'bg-emerald-500'
      : presenceStatus === 'idle'
      ? 'bg-amber-500'
      : 'bg-slate-400';

  const presenceLabel = isGroup
    ? `${otherParticipants.length + 1} members • ${otherParticipants.filter((p) => p.status === 'online').length + 1} online`
    : presenceStatus === 'online'
    ? 'Active now'
    : presenceStatus === 'idle'
    ? 'Away'
    : 'Offline';

  return (
    <div className="h-16 px-4 border-b border-slate-200 dark:border-[#23262D] bg-white dark:bg-[#0B0C0E] flex items-center justify-between flex-shrink-0 z-10">
      {/* Left: Avatar + Back Button + Name + Status */}
      <div className="flex items-center space-x-3 truncate">
        {isMobile && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#181A20] transition"
            title="Back to conversations"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {isGroup ? (
            <div className="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
              <Users className="w-5 h-5" />
            </div>
          ) : (
            <>
              <img
                src={primaryRecipient?.avatar}
                alt={primaryRecipient?.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-[#23262D]"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#0B0C0E] ${presenceColor}`}
              />
            </>
          )}
        </div>

        {/* Title and ambient presence details */}
        <div className="flex flex-col truncate">
          <div className="flex items-center space-x-2 truncate">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">
              {isGroup ? conversation.title : primaryRecipient?.name}
            </h2>
            {conversation?.muted && (
              <BellOff className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-[#8F9CAE] truncate font-medium">
            <span>{presenceLabel}</span>
            {timeInfo && (
              <>
                <span className="opacity-60">•</span>
                <span className="truncate">
                  {timeInfo.timeStr} (Local Time)
                </span>
                {timeInfo.mayBeSleeping && (
                  <span className="text-amber-500 dark:text-amber-400 text-[11px] hidden sm:inline">
                    • May be sleeping 🌙
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Action Clusters */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
        {/* Simulate incoming live Pusher broadcast (test utility) */}
        <button
          onClick={onSimulateInbound}
          title="Simulate Inbound Pusher Message"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Simulate Incoming</span>
        </button>

        {/* Simulate network drop / reconnection */}
        <button
          onClick={onToggleSimulateDisconnect}
          title={`Simulate Network: Current is ${connectionState}`}
          className={`p-2 rounded-lg text-xs font-medium transition ${
            connectionState === 'connected'
              ? 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#181A20]'
              : 'text-amber-500 bg-amber-500/10 border border-amber-500/30'
          }`}
        >
          <Wifi className="w-4 h-4" />
        </button>

        {/* Toggle search */}
        <button
          onClick={onToggleSearch}
          title="Search conversation"
          className={`p-2 rounded-lg transition ${
            isSearchOpen
              ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#181A20]'
          }`}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Toggle Mute */}
        <button
          onClick={onToggleMute}
          title={conversation?.muted ? 'Unmute' : 'Mute'}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#181A20] transition"
        >
          {conversation?.muted ? (
            <BellOff className="w-4 h-4 text-amber-500" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
        </button>

        {/* Toggle Right Details Drawer */}
        <button
          onClick={onToggleDrawer}
          title="Conversation Details"
          className={`p-2 rounded-lg transition ${
            isDrawerOpen
              ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#181A20]'
          }`}
        >
          <Sidebar className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
