import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Eye, EyeOff, Flame, Check, CheckCheck, Clock, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DisappearingMessageBubble({ message, onShred }) {
  const [revealed, setRevealed] = useState(!message.isSensitive);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!message.expiresAt || message.ttl <= 0) return null;
    const remaining = Math.max(0, Math.floor((message.expiresAt - Date.now()) / 1000));
    return remaining;
  });
  const [isShredding, setIsShredding] = useState(false);
  const timerRef = useRef(null);

  const isMe = message.sender === 'me';

  // Live countdown calculation
  useEffect(() => {
    if (!message.expiresAt || message.ttl <= 0 || message.isShredded) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((message.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        triggerShred();
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => clearInterval(timerRef.current);
  }, [message.expiresAt, message.ttl, message.isShredded]);

  const triggerShred = () => {
    setIsShredding(true);

    // Subtle spark particle effect
    try {
      confetti({
        particleCount: 15,
        spread: 30,
        startVelocity: 8,
        origin: { y: 0.6 },
        colors: ['#EF4444', '#717888', '#10B981'],
        disableForReducedMotion: true
      });
    } catch {}

    setTimeout(() => {
      onShred?.(message.id);
    }, 600);
  };

  if (message.isShredded) {
    return null;
  }

  // Format seconds into readable countdown string
  const formatCountdown = (seconds) => {
    if (seconds === null) return null;
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // SVG circular countdown calculation
  const totalTtl = message.ttl || 1;
  const currentRemaining = timeLeft !== null ? timeLeft : totalTtl;
  const progressRatio = Math.max(0, Math.min(1, currentRemaining / totalTtl));
  const strokeDashoffset = 28.27 * (1 - progressRatio); // 2 * PI * r (r = 4.5)

  const timeFormatted = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div 
      className={`flex flex-col mb-3 select-none transition-all duration-500 ${
        isMe ? 'items-end' : 'items-start'
      } ${isShredding ? 'opacity-0 scale-90 translate-y-3 blur-md' : 'opacity-100 scale-100'}`}
    >
      {/* Polymorphic Bubble */}
      <div 
        className={`relative group max-w-[85%] md:max-w-[70%] rounded-2xl p-3.5 shadow-md transition-all duration-200 border ${
          isMe 
            ? 'rounded-tr-sm bg-[#0F3B2E] border-emerald-500/30 text-white shadow-emerald-950/20' 
            : 'rounded-tl-sm bg-[#191D26] border-[#252B37] text-[#F3F4F6] shadow-black/40'
        }`}
      >
        {/* Tap-to-Reveal Sensitive Lens */}
        {message.isSensitive && !revealed ? (
          <div 
            onClick={() => setRevealed(true)}
            onMouseDown={() => setRevealed(true)}
            className="flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer bg-black/60 backdrop-blur-xl border border-slate-700/60 hover:border-emerald-500/40 transition-all text-center select-none"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2.5 text-emerald-400">
              <Lock className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <p className="text-xs font-medium text-slate-200">Tap or hold to reveal sensitive content</p>
            <span className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> Shoulder-surfing shield active
            </span>
          </div>
        ) : (
          <div className="relative">
            {/* If sensitive and revealed, show re-obscure toggle */}
            {message.isSensitive && (
              <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/10 text-[10px] font-mono text-emerald-300">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" /> Sensitive Media Lens
                </span>
                <button 
                  onClick={() => setRevealed(false)} 
                  className="hover:underline flex items-center gap-0.5 text-slate-400 hover:text-slate-200"
                  title="Hide again"
                >
                  <EyeOff className="w-3 h-3" /> Re-shield
                </button>
              </div>
            )}

            {/* Media Attachment if present */}
            {message.media && (
              <div className="mb-2.5 p-3 rounded-lg bg-black/40 border border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-200 truncate">{message.media.title || 'Encrypted Attachment'}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{message.media.hash || 'AES-256-GCM Blob'}</div>
                </div>
              </div>
            )}

            {/* Message Text */}
            <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap selection:bg-transparent">
              {message.text}
            </p>
          </div>
        )}

        {/* Bubble Footer: Timestamp, Countdown Ring, Delivery Status */}
        <div className={`flex items-center gap-2 mt-2 pt-1 border-t ${
          isMe ? 'border-emerald-600/20 text-emerald-200/70' : 'border-slate-800 text-slate-400'
        } text-[11px] font-mono justify-end select-none`}>
          <span>{timeFormatted}</span>

          {/* Ephemeral Countdown Meter */}
          {message.ttl > 0 && timeLeft !== null && (
            <div 
              className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-full ${
                timeLeft < 10 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' 
                  : 'bg-black/30 text-slate-300 border border-white/5'
              }`}
              title={`Disappears in ${formatCountdown(timeLeft)}`}
            >
              {/* Miniature SVG Countdown Ring */}
              <svg className="w-3.5 h-3.5 transform -rotate-90 shrink-0" viewBox="0 0 12 12">
                <circle 
                  cx="6" 
                  cy="6" 
                  r="4.5" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  fill="transparent" 
                  className="opacity-25" 
                />
                <circle 
                  cx="6" 
                  cy="6" 
                  r="4.5" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  fill="transparent" 
                  strokeDasharray="28.27" 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000"
                />
              </svg>
              <span className="text-[10px] font-semibold">{formatCountdown(timeLeft)}</span>
            </div>
          )}

          {/* Delivery tick marks for outbound */}
          {isMe && (
            <span className="text-emerald-400">
              {message.status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 inline" />
              ) : (
                <Check className="w-3.5 h-3.5 inline" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
