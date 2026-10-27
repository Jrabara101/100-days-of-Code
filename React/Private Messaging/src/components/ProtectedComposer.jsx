import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Flame, Paperclip, Eye, EyeOff, Shield, AlertTriangle, 
  Lock, Clock, X, Image as ImageIcon 
} from 'lucide-react';
import { sounds } from '../sound/soundEffects';

export default function ProtectedComposer({ 
  activeContact, 
  onSendMessage, 
  onVerifyPrompt 
}) {
  const [text, setText] = useState('');
  const [ttl, setTtl] = useState(activeContact?.defaultTtl || 3600);
  const [isSensitive, setIsSensitive] = useState(false);
  const [showTtlMenu, setShowTtlMenu] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const textareaRef = useRef(null);

  // Sync with contact default TTL
  useEffect(() => {
    if (activeContact) {
      setTtl(activeContact.defaultTtl);
    }
  }, [activeContact]);

  // Auto-resize textarea
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !attachment) return;

    if (activeContact?.keyChanged) {
      sounds.playKeyAlertSound();
      onVerifyPrompt?.();
      return;
    }

    onSendMessage({
      text: text.trim(),
      ttl,
      isSensitive,
      media: attachment
    });

    setText('');
    setAttachment(null);
    setIsSensitive(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSimulateAttachment = () => {
    sounds.playTapSound();
    setAttachment({
      type: 'document',
      title: 'Decrypted_Session_Spec.enc',
      hash: 'SHA256: 3a9e14...' + Math.random().toString(36).substring(2, 6),
      size: '48.2 KB'
    });
    setIsSensitive(true); // default attachments to sensitive lens
  };

  const ttlPresets = [
    { label: '5s', value: 5, desc: 'Burn in 5 seconds' },
    { label: '1m', value: 60, desc: 'Burn in 1 minute' },
    { label: '1h', value: 3600, desc: 'Burn in 1 hour' },
    { label: '24h', value: 86400, desc: 'Burn in 24 hours' },
    { label: 'Off', value: 0, desc: 'Permanent (Manual Purge)' },
  ];

  const currentPresetLabel = ttlPresets.find(p => p.value === ttl)?.label || `${ttl}s`;

  return (
    <div className="p-4 border-t border-[#1D222D] bg-[#0E1015]/90 backdrop-blur-md relative">
      {/* Key Mismatch Sentinel Lock Alert */}
      {activeContact?.keyChanged ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 flex items-center justify-between gap-3 animate-key-alert">
          <div className="flex items-center gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Composer Locked: {activeContact.alias}'s security keys changed. Re-verify identity.</span>
          </div>
          <button
            onClick={onVerifyPrompt}
            className="py-1.5 px-3 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition-colors shrink-0"
          >
            Verify Keys
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Active Attachment Chip */}
          {attachment && (
            <div className="mb-2 p-2 rounded-lg bg-[#14171E] border border-white/10 flex items-center justify-between gap-2 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-200 truncate">
                <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                {attachment.title} ({attachment.size})
              </span>
              <button
                onClick={() => setAttachment(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Integrated Capsule */}
          <div className="rounded-2xl border border-[#1D222D] bg-[#14171E] p-2 flex items-end gap-2 focus-within:border-emerald-500/40 transition-colors shadow-inner">
            {/* Attachment Trigger */}
            <button
              type="button"
              onClick={handleSimulateAttachment}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-colors shrink-0"
              title="Attach Encrypted File"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Quick TTL Horizon Selector */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowTtlMenu(!showTtlMenu)}
                className={`flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-mono font-medium transition-colors ${
                  ttl > 0 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-white/5 text-slate-400 border border-white/5'
                }`}
                title="Self-Destruct Horizon"
              >
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>{currentPresetLabel}</span>
              </button>

              {/* TTL Popover Menu */}
              {showTtlMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-44 rounded-xl bg-[#0E1015] border border-[#1D222D] shadow-2xl p-1.5 z-30 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 px-2 py-1 border-b border-white/5">
                    Self-Destruct Horizon
                  </div>
                  {ttlPresets.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => { setTtl(p.value); setShowTtlMenu(false); sounds.playTapSound(); }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between ${
                        ttl === p.value 
                          ? 'bg-emerald-500/15 text-emerald-400 font-semibold' 
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="text-[10px] text-slate-500">{p.desc.split(' ')[2]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tap-to-Reveal Sensitive Lens Toggle */}
            <button
              type="button"
              onClick={() => { setIsSensitive(!isSensitive); sounds.playTapSound(); }}
              className={`p-2 rounded-xl text-xs transition-colors shrink-0 ${
                isSensitive 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title={isSensitive ? "Sensitive Lens Armed (tap-to-reveal)" : "Make Sensitive (Tap-to-reveal)"}
            >
              {isSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Send zero-knowledge message..."
              className="flex-1 bg-transparent border-0 text-sm text-[#F3F4F6] placeholder-slate-500 focus:outline-none focus:ring-0 py-2 resize-none max-h-32 min-h-[38px] leading-relaxed copy-lockdown"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim() && !attachment}
              className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white transition-all shadow-md glow-emerald shrink-0"
              title="Encrypt & Send (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
