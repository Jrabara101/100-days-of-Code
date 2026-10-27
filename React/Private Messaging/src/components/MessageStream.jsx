import React, { useEffect, useRef } from 'react';
import { Shield, Lock, Flame, CheckCheck } from 'lucide-react';
import DisappearingMessageBubble from './DisappearingMessageBubble';

export default function MessageStream({ 
  messages, 
  activeContact, 
  onShredMessage,
  shieldActive 
}) {
  const bottomRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const activeMessages = messages.filter(m => !m.isShredded);

  const getTtlLabel = (ttl) => {
    if (!ttl || ttl <= 0) return 'Permanent (Manual Purge)';
    if (ttl === 5) return '5 seconds';
    if (ttl === 60) return '1 minute';
    if (ttl === 3600) return '1 hour';
    if (ttl === 86400) return '24 hours';
    return `${ttl} seconds`;
  };

  return (
    <div className={`flex-1 p-4 md:p-6 overflow-y-auto space-y-1 relative copy-lockdown transition-all duration-300 ${
      shieldActive ? 'shield-active' : ''
    }`}>
      {/* Sticky Cryptographic Verification Banner */}
      <div className="sticky top-0 z-20 flex justify-center pb-4 pt-1 pointer-events-none">
        <div className="pointer-events-auto px-4 py-1.5 rounded-full bg-[#0E1015]/90 backdrop-blur-md border border-[#1D222D] shadow-lg flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>E2EE Active. Zero-knowledge shredding: {getTtlLabel(activeContact?.defaultTtl)}</span>
        </div>
      </div>

      {/* Messages */}
      {activeMessages.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
            <Flame className="w-6 h-6 text-red-400/60" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">Sanctuary Mailbox Clean</h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Prior messages have completed their lifetime and disintegrated. Send a message to initiate an ephemeral exchange.
          </p>
        </div>
      ) : (
        activeMessages.map((msg) => (
          <DisappearingMessageBubble
            key={msg.id}
            message={msg}
            onShred={onShredMessage}
          />
        ))
      )}

      <div ref={bottomRef} />
    </div>
  );
}
