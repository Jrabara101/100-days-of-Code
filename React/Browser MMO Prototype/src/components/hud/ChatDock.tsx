import React, { useState, useRef, useEffect } from 'react';
import type { MMOGameState, ChatChannel, ChatMessage } from '../../types/mmo.js';
import { Send, Smile, Hash, Sparkles } from 'lucide-react';

interface ChatDockProps {
  state: MMOGameState;
  onSendChat: (channel: string, content: string, recipientId?: string) => void;
  onSendEmote: (emoji: string) => void;
  whisperTarget: { name: string; id: string } | null;
  onClearWhisperTarget: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const EMOTE_LIST = ['⚔️', '🛡️', '✨', '🔥', '👑', '🪙', '👋', '🍺', '💀', '❤️', '🧙‍♂️', '⚡'];

export const ChatDock: React.FC<ChatDockProps> = ({
  state,
  onSendChat,
  onSendEmote,
  whisperTarget,
  onClearWhisperTarget,
  inputRef,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOCAL' | 'PARTY' | 'WHISPER' | 'SYSTEM'>('ALL');
  const [inputText, setInputText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel>('LOCAL');
  const [showEmotes, setShowEmotes] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-switch to WHISPER channel if whisper target selected
  useEffect(() => {
    if (whisperTarget) {
      setSelectedChannel('WHISPER');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [whisperTarget, inputRef]);

  // Auto scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.chatHistory, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    // Check for slash commands e.g. /w or /p or /g or /s
    if (text.startsWith('/w ') && text.split(' ').length > 2) {
      const parts = text.split(' ');
      const targetName = parts[1];
      const whisperContent = parts.slice(2).join(' ');
      // Look up target player
      const foundTarget = Object.values(state.players).find(
        p => p.username.toLowerCase() === targetName.toLowerCase()
      );
      if (foundTarget) {
        onSendChat('WHISPER', whisperContent, foundTarget.id);
      } else {
        onSendChat('LOCAL', text);
      }
    } else if (text.startsWith('/g ') || text.startsWith('/all ')) {
      onSendChat('GLOBAL', text.replace(/^\/(g|all)\s+/, ''));
    } else if (text.startsWith('/p ')) {
      onSendChat('PARTY', text.replace(/^\/p\s+/, ''));
    } else {
      const channel = whisperTarget ? 'WHISPER' : selectedChannel;
      onSendChat(channel, text, whisperTarget?.id);
    }

    setInputText('');
  };

  // Filter messages based on active tab
  const filteredMessages = state.chatHistory.filter(msg => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'LOCAL') return msg.channel === 'LOCAL' || msg.channel === 'SYSTEM';
    if (activeTab === 'PARTY') return msg.channel === 'PARTY' || msg.channel === 'SYSTEM';
    if (activeTab === 'WHISPER') return msg.channel === 'WHISPER';
    if (activeTab === 'SYSTEM') return msg.channel === 'SYSTEM';
    return true;
  });

  return (
    <div className="pointer-events-auto flex flex-col w-[380px] max-w-[92vw] h-[220px] rounded-2xl bg-[#0B0F19]/85 hover:bg-[#0B0F19]/95 backdrop-blur-md border border-slate-700/60 shadow-2xl transition-all select-none overflow-hidden group">
      {/* Header Channel Tabs */}
      <div className="flex items-center justify-between px-2.5 pt-2 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-1">
          {(['ALL', 'LOCAL', 'PARTY', 'WHISPER', 'SYSTEM'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-0.5 rounded text-[11px] font-sans font-semibold tracking-wider transition ${
                activeTab === tab
                  ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Quick Emotes Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmotes(!showEmotes)}
            className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
            title="Expressive World Emotes"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {/* Emote Popover Wheel */}
          {showEmotes && (
            <div className="absolute bottom-full right-0 mb-2 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl grid grid-cols-4 gap-1.5 z-50">
              {EMOTE_LIST.map(em => (
                <button
                  key={em}
                  onClick={() => {
                    onSendEmote(em);
                    setShowEmotes(false);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-lg hover:scale-110 active:scale-95 transition"
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Feed ScrollArea */}
      <div
        ref={scrollRef}
        className="flex-1 p-2.5 overflow-y-auto space-y-1 text-xs font-sans scrollbar-thin scrollbar-thumb-slate-700"
      >
        {filteredMessages.length === 0 ? (
          <div className="text-slate-500 italic text-[11px] py-4 text-center">
            No transmissions in this channel yet.
          </div>
        ) : (
          filteredMessages.map(msg => renderMessageRow(msg, state.myPlayerId))
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 p-1.5 border-t border-slate-800/80 bg-slate-950/60"
      >
        {/* Channel Dropdown / Whisper Badge */}
        {whisperTarget ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-fuchsia-950/80 border border-fuchsia-500/40 text-[10px] font-mono font-bold text-fuchsia-300">
            <span>To: {whisperTarget.name}</span>
            <button
              type="button"
              onClick={onClearWhisperTarget}
              className="text-fuchsia-400 hover:text-white ml-0.5"
            >
              ×
            </button>
          </div>
        ) : (
          <select
            value={selectedChannel}
            onChange={e => setSelectedChannel(e.target.value as ChatChannel)}
            className="px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
          >
            <option value="LOCAL">LOCAL</option>
            <option value="GLOBAL">GLOBAL</option>
            <option value="PARTY">PARTY</option>
          </select>
        )}

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={
            whisperTarget
              ? `Whisper to ${whisperTarget.name}...`
              : selectedChannel === 'LOCAL'
              ? 'Local proximity speech... [Enter]'
              : 'Broadcast to realm... [Enter]'
          }
          maxLength={140}
          className="flex-1 px-2 py-1 rounded bg-slate-900/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />

        <button
          type="submit"
          className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition active:scale-95 shadow"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

// Render Individual Chat Message Row
function renderMessageRow(msg: ChatMessage, myId: string) {
  const isMe = msg.senderId === myId;

  // Channel badge colors
  let badgeStyle = 'text-slate-400 bg-slate-800';
  let badgeLabel = msg.channel;
  let textColor = 'text-slate-200';

  if (msg.channel === 'LOCAL') {
    badgeStyle = 'text-slate-100 bg-slate-800/80';
    textColor = 'text-slate-100';
  } else if (msg.channel === 'GLOBAL') {
    badgeStyle = 'text-amber-300 bg-amber-950/60 border border-amber-600/30';
    textColor = 'text-amber-100';
  } else if (msg.channel === 'PARTY') {
    badgeStyle = 'text-emerald-300 bg-emerald-950/60 border border-emerald-600/30';
    textColor = 'text-emerald-100';
  } else if (msg.channel === 'WHISPER') {
    badgeStyle = 'text-fuchsia-300 bg-fuchsia-950/60 border border-fuchsia-600/30';
    textColor = 'text-fuchsia-100';
  } else if (msg.channel === 'SYSTEM') {
    badgeStyle = 'text-cyan-300 bg-cyan-950/60 border border-cyan-600/30';
    textColor = 'text-cyan-200 font-medium';
  }

  // Calculate dynamic proximity opacity for local speech
  let proximityOpacity = 1.0;
  if (msg.channel === 'LOCAL' && msg.proximityDist !== undefined) {
    // 0px = 1.0 opacity, 400px = 0.45 opacity
    proximityOpacity = Math.max(0.45, 1 - (msg.proximityDist / 400) * 0.55);
  }

  return (
    <div
      key={msg.id}
      style={{ opacity: proximityOpacity }}
      className="leading-snug break-words flex items-start gap-1.5"
    >
      {/* Channel Pill */}
      <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold flex-shrink-0 ${badgeStyle}`}>
        [{badgeLabel}]
      </span>

      {/* Proximity Distance Pill if Local */}
      {msg.channel === 'LOCAL' && msg.proximityDist !== undefined && (
        <span className="text-[9px] font-mono text-slate-400 flex-shrink-0">
          ({Math.round(msg.proximityDist / 10)}m)
        </span>
      )}

      {/* Sender Name */}
      {msg.senderName && (
        <span className={`font-semibold ${isMe ? 'text-amber-400' : 'text-slate-300'} flex-shrink-0`}>
          {msg.senderName}:
        </span>
      )}

      {/* Content */}
      <span className={`${textColor}`}>{msg.content}</span>
    </div>
  );
}
