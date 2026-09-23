import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, CheckCheck, HelpCircle, Eye } from 'lucide-react';
import { ChatMessage, Player } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatStreamProps {
  messages: ChatMessage[];
  onSubmitGuess: (text: string) => void;
  isArtist: boolean;
  hasGuessedCorrectly: boolean;
  localPlayer: Player;
}

export const ChatStream: React.FC<ChatStreamProps> = ({
  messages,
  onSubmitGuess,
  isArtist,
  hasGuessedCorrectly,
  localPlayer,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    onSubmitGuess(text);
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-studio-aged/95 backdrop-blur-md border border-[#D5C7B0] rounded-2xl p-2.5 shadow-paper-lift overflow-hidden">
      {/* Chat Header */}
      <div className="px-2 py-1.5 border-b border-[#D5C7B0] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-serif font-bold text-studio-ink">
          <MessageSquare className="w-3.5 h-3.5 text-studio-sienna" />
          <span>Den Parchment Chat</span>
        </div>

        {hasGuessedCorrectly ? (
          <Badge variant="success" className="gap-1 font-sans text-[10px]">
            <Eye className="w-3 h-3 text-studio-moss" />
            <span>Spectator Channel</span>
          </Badge>
        ) : (
          <span className="text-[10px] text-studio-moss font-medium font-sans flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-studio-moss" /> Live ink
          </span>
        )}
      </div>

      {/* Messages Stream */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-2 overflow-y-auto space-y-1.5 custom-scrollbar text-xs"
      >
        {messages.map((msg) => {
          // System Alert
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center py-0.5">
                <span className="inline-block bg-white/80 text-studio-charcoal text-[10px] px-2.5 py-0.5 rounded-full border border-[#D5C7B0] font-serif italic shadow-xs">
                  {msg.text}
                </span>
              </div>
            );
          }

          // Correct guess announcement (Asymmetric secrecy: hides exact word text)
          if (msg.type === 'correct') {
            return (
              <div
                key={msg.id}
                className="flex items-center gap-1.5 bg-emerald-100/80 border border-emerald-300/70 px-2.5 py-1.5 rounded-xl shadow-xs animate-in fade-in"
              >
                <CheckCheck className="w-3.5 h-3.5 text-studio-moss shrink-0" />
                <span className="font-serif font-bold text-studio-moss">{msg.senderName}:</span>
                <span className="text-emerald-950 font-bold text-[11px] font-sans">
                  {msg.text}
                </span>
                {msg.pointsAwarded && (
                  <span className="ml-auto font-mono text-[9px] font-bold bg-studio-moss text-white px-1.5 py-0.5 rounded-full shadow-xs">
                    +{msg.pointsAwarded}
                  </span>
                )}
              </div>
            );
          }

          // Warm near-miss guess
          if (msg.type === 'warm') {
            const isLocal = msg.senderId === localPlayer.id;
            return (
              <div
                key={msg.id}
                className="flex items-center gap-1.5 bg-amber-100/80 border border-amber-300/70 px-2 py-1 rounded-xl animate-pulse"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="font-serif font-bold text-amber-900">{msg.senderName}:</span>
                <span className="text-amber-950 font-sans">{msg.text}</span>
                <span className="ml-auto text-[9px] font-bold font-hand text-amber-800 bg-amber-200/90 px-1.5 py-0.5 rounded border border-amber-300">
                  {isLocal ? "You're super close! 🔥" : 'Super close!'}
                </span>
              </div>
            );
          }

          // Normal guess message
          return (
            <div key={msg.id} className="flex items-baseline gap-1.5 font-serif py-0.5">
              <span
                className={cn(
                  'font-bold',
                  msg.senderId === localPlayer.id ? 'text-studio-sienna' : 'text-studio-ink'
                )}
              >
                {msg.senderName}:
              </span>
              <span className="text-studio-charcoal font-sans">{msg.text}</span>
            </div>
          );
        })}
      </div>

      {/* Guess Input Form */}
      <form onSubmit={handleSubmit} className="mt-2 pt-2 border-t border-[#D5C7B0] flex items-center gap-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isArtist}
          placeholder={
            isArtist
              ? 'You are currently at the easel...'
              : hasGuessedCorrectly
              ? 'You solved it! Chat with spectators...'
              : 'Whisper your deduction...'
          }
          className="flex-1 bg-white border border-[#D5C7B0] rounded-xl px-3 py-1.5 text-xs text-studio-ink placeholder-studio-charcoal/60 focus:outline-none focus:ring-1 focus:ring-studio-sienna focus:border-studio-sienna font-sans transition shadow-inner disabled:bg-studio-paper disabled:text-stone-400"
        />
        <button
          type="submit"
          disabled={isArtist || !inputText.trim()}
          className="bg-studio-sienna hover:bg-studio-siennaLight active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center shrink-0 shadow-sm"
          title="Send Deduction"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
