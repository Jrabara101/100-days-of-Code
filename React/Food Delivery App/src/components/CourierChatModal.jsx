import React, { useState } from 'react';
import { X, Send, Shield } from 'lucide-react';
import { COURIER_QUICK_CHIPS } from '../data/telemetry';

export function CourierChatModal({
  isOpen,
  onClose,
  courier
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'courier',
      text: "Hi! I've secured your order in the heated thermal bag. Be there in about 10 minutes!",
      time: '6:32 PM'
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  if (!isOpen) return null;

  const handleSend = (textToSend = inputVal) => {
    if (!textToSend.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'customer',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputVal('');

    // Simulated automated courier reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'courier',
          text: `Got it! Thanks for letting me know. I will follow your instructions carefully.`,
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        }
      ]);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <img
              src={courier.avatar_url}
              alt={courier.name}
              className="w-10 h-10 rounded-full object-cover border border-rose-500/30"
            />
            <div>
              <div className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                <span>{courier.name}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                  ★ {courier.rating}
                </span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-blue-500" /> Masked in-app courier relay
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => {
            const isMe = m.sender === 'customer';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                    isMe
                      ? 'bg-rose-600 text-white rounded-br-xs'
                      : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1 font-mono">
                  {m.time}
                </span>
              </div>
            );
          })}
        </div>

        {/* Quick Chips */}
        <div className="px-4 py-2 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {COURIER_QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSend(chip)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-rose-500 transition-colors shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message to Marcus..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
