import React, { useState } from 'react';
import { MessageSquare, Send, CheckCheck, Lock, ArrowLeft, LogOut, Coffee, ShoppingBag, BookOpen } from 'lucide-react';
import { DECOY_THREADS } from '../storage/vaultStore';

export default function DecoyVaultView({ onExitDecoy }) {
  const [threads] = useState(DECOY_THREADS);
  const [activeThreadId, setActiveThreadId] = useState(DECOY_THREADS[0].id);
  const [inputText, setInputText] = useState('');
  const [activeMessages, setActiveMessages] = useState(() => {
    const map = {};
    threads.forEach(t => {
      map[t.id] = [...t.messages];
    });
    return map;
  });

  const activeThread = threads.find(t => t.id === activeThreadId);
  const messages = activeMessages[activeThreadId] || [];

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: `d-${Date.now()}`,
      sender: 'me',
      text: inputText.trim(),
      timestamp: Date.now()
    };

    setActiveMessages(prev => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), newMsg]
    }));

    setInputText('');
  };

  const getThreadIcon = (id) => {
    if (id.includes('mom')) return <Coffee className="w-5 h-5 text-amber-500" />;
    if (id.includes('grocer')) return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
    return <BookOpen className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              M
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Messages</h2>
              <span className="text-[11px] text-slate-500">3 conversations</span>
            </div>
          </div>
          <button
            onClick={onExitDecoy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Lock Messenger"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>

        {/* Thread Roster */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {threads.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveThreadId(t.id)}
              className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                activeThreadId === t.id ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                {getThreadIcon(t.id)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-medium text-slate-900 truncate">{t.alias}</h3>
                  <span className="text-[10px] text-slate-400">14:02</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{t.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Discreet decoy footer */}
        <div className="p-3 border-t border-slate-200 text-center">
          <button
            onClick={onExitDecoy}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 w-full"
          >
            <LogOut className="w-3.5 h-3.5" /> Lock Application
          </button>
        </div>
      </div>

      {/* Main Chat Stage */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              {getThreadIcon(activeThread.id)}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{activeThread.alias}</h2>
              <span className="text-xs text-emerald-600 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          {messages.map((m) => {
            const isMe = m.sender === 'me';
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}>
                  <p>{m.text}</p>
                  <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                    14:05 <CheckCheck className="w-3 h-3 inline ml-1" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Decoy Composer */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
