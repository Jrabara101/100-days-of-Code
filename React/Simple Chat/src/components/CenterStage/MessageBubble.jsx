import React, { useState } from 'react';
import { Check, CheckCheck, Clock, AlertCircle, CornerUpLeft, Copy, ExternalLink, Smile } from 'lucide-react';

const QUICK_EMOJIS = ['❤️', '👍', '😂', '🔥', '🚀', '👏'];

export default function MessageBubble({
  message,
  isOutbound,
  sender,
  isGroupFirst,
  isHighlighted,
  onQuoteReply,
  onJumpToQuoted,
  onRetryFailed,
  onAddReaction,
  onOpenImage,
}) {
  const [showActions, setShowActions] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';
  const isDelivered = message.status === 'delivered';
  const isRead = message.status === 'read';

  return (
    <div
      id={`message-${message.id}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`relative group flex flex-col my-1 transition-all duration-300 ${
        isOutbound ? 'items-end' : 'items-start'
      } ${isHighlighted ? 'bg-blue-500/10 ring-2 ring-blue-500 rounded-2xl p-1' : ''}`}
    >
      {/* Cluster Header (Sender name on inbound group messages) */}
      {!isOutbound && isGroupFirst && sender && (
        <div className="flex items-center space-x-2 ml-10 mb-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {sender.name}
          </span>
          {sender.title && (
            <span className="text-[10px] text-slate-400 dark:text-[#8F9CAE]">
              • {sender.title}
            </span>
          )}
        </div>
      )}

      <div className={`flex items-end space-x-2 max-w-[85%] md:max-w-[72%] ${isOutbound ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        {/* Avatar for Inbound (Shown only on first message of cluster) */}
        {!isOutbound && (
          <div className="w-8 h-8 flex-shrink-0">
            {isGroupFirst && sender ? (
              <img
                src={sender.avatar}
                alt={sender.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-[#23262D]"
              />
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        )}

        {/* Message Bubble Body */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 shadow-sm text-[14.5px] leading-relaxed transition-all duration-150 animate-pop-in ${
            isOutbound
              ? isFailed
                ? 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 border-2 border-red-500/80 rounded-tr-sm'
                : 'bg-blue-600 dark:bg-[#3B82F6] text-white rounded-tr-sm'
              : 'bg-slate-100 dark:bg-[#1E2026] text-slate-900 dark:text-[#F8FAFC] border border-slate-200/80 dark:border-[#23262D] rounded-tl-sm'
          }`}
        >
          {/* Contextual Quoted Message Strip inside bubble */}
          {message.reply_to && (
            <div
              onClick={() => onJumpToQuoted?.(message.reply_to.id)}
              className={`mb-2.5 p-2 rounded-lg text-xs cursor-pointer select-none transition-all duration-150 border-l-2 ${
                isOutbound
                  ? 'bg-black/15 text-white/90 border-blue-200 hover:bg-black/25'
                  : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-blue-500 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-1.5 font-semibold text-[11px] mb-0.5 opacity-90">
                <CornerUpLeft className="w-3 h-3" />
                <span>{message.reply_to.userName || 'Replying to message'}</span>
              </div>
              <p className="line-clamp-2 italic opacity-85">{message.reply_to.content}</p>
            </div>
          )}

          {/* Message Text */}
          {message.content && (
            <div className="break-words select-text">
              {message.content}
            </div>
          )}

          {/* Rich Media Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((att, idx) => {
                if (att.type === 'image') {
                  return (
                    <div
                      key={idx}
                      onClick={() => onOpenImage?.(att.url)}
                      className="cursor-pointer overflow-hidden rounded-xl border border-black/10 dark:border-white/10 group/img relative"
                    >
                      <img
                        src={att.url}
                        alt={att.caption || 'Attachment'}
                        className="max-h-72 w-full object-cover rounded-xl transition duration-200 group-hover/img:scale-[1.02]"
                      />
                      {att.caption && (
                        <div className="p-2 text-xs opacity-90 backdrop-blur-sm bg-black/40 text-white absolute bottom-0 inset-x-0">
                          {att.caption}
                        </div>
                      )}
                    </div>
                  );
                }

                if (att.type === 'code') {
                  return (
                    <div
                      key={idx}
                      className="rounded-xl overflow-hidden bg-slate-900 dark:bg-[#121316] text-slate-100 border border-slate-700/60 dark:border-[#23262D] text-xs font-mono"
                    >
                      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 dark:bg-[#181A20] border-b border-slate-700/50">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          {att.language || 'code'}
                        </span>
                        <button
                          onClick={() => handleCopyCode(att.code)}
                          className="flex items-center space-x-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-700/50 hover:bg-slate-700 transition"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-3 overflow-x-auto text-[12px] leading-relaxed">
                        <code>{att.code}</code>
                      </pre>
                    </div>
                  );
                }

                if (att.type === 'link') {
                  return (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block rounded-xl overflow-hidden border transition duration-150 ${
                        isOutbound
                          ? 'bg-blue-700/40 hover:bg-blue-700/60 border-blue-400/30 text-white'
                          : 'bg-white dark:bg-[#181A20] hover:bg-slate-50 dark:hover:bg-[#1c1f26] border-slate-200 dark:border-[#23262D] text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {att.image && (
                        <img
                          src={att.image}
                          alt={att.title}
                          className="h-32 w-full object-cover"
                        />
                      )}
                      <div className="p-2.5">
                        <div className="flex items-center justify-between text-[11px] text-blue-300 dark:text-blue-400 font-medium mb-1">
                          <span>{att.domain}</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                        <h4 className="font-semibold text-xs leading-snug line-clamp-1">
                          {att.title}
                        </h4>
                        {att.description && (
                          <p className="text-[11px] opacity-80 line-clamp-2 mt-0.5">
                            {att.description}
                          </p>
                        )}
                      </div>
                    </a>
                  );
                }

                return null;
              })}
            </div>
          )}

          {/* Bubble Footer: Timestamp & Delivery Status */}
          <div
            className={`flex items-center space-x-1 text-[11px] font-mono mt-1 ${
              isOutbound
                ? isFailed
                  ? 'justify-end text-red-500'
                  : 'justify-end text-blue-100/80'
                : 'justify-end text-slate-400 dark:text-[#8F9CAE]'
            }`}
          >
            <span>{formattedTime}</span>

            {isOutbound && (
              <span className="flex items-center ml-1">
                {isSending && (
                  <Clock className="w-3 h-3 animate-spin text-blue-200" />
                )}
                {!isSending && !isDelivered && !isRead && !isFailed && (
                  <Check className="w-3.5 h-3.5 text-blue-200" />
                )}
                {!isSending && isDelivered && !isRead && (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                )}
                {!isSending && isRead && (
                  <CheckCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                )}
                {isFailed && (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Failed Action Retry Pill */}
        {isFailed && (
          <button
            onClick={() => onRetryFailed?.(message)}
            className="text-xs text-red-500 hover:text-red-600 font-medium underline flex items-center space-x-1 bg-red-50 dark:bg-red-950/60 px-2 py-1 rounded-md border border-red-300 dark:border-red-900"
          >
            <span>Failed. Retry?</span>
          </button>
        )}
      </div>

      {/* Floating Hover Action Bar (Reply + Emojis) */}
      <div
        className={`absolute -top-3.5 z-10 transition-all duration-150 ${
          showActions ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        } ${isOutbound ? 'right-2' : 'left-10'}`}
      >
        <div className="flex items-center space-x-1 bg-white dark:bg-[#181A20] border border-slate-200 dark:border-[#23262D] rounded-full px-2 py-1 shadow-md">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onAddReaction?.(message.id, emoji)}
              className="hover:scale-125 transition-transform text-xs p-1"
            >
              {emoji}
            </button>
          ))}
          <div className="w-px h-3 bg-slate-200 dark:bg-[#23262D] mx-0.5" />
          <button
            onClick={() => onQuoteReply?.(message)}
            title="Reply"
            className="p-1 hover:bg-slate-100 dark:hover:bg-[#23262D] rounded-full text-slate-500 dark:text-slate-300 hover:text-blue-500 transition"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reaction Badges Below Bubble */}
      {message.reactions && message.reactions.length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-1 ${isOutbound ? 'mr-2 justify-end' : 'ml-10'}`}>
          {message.reactions.map((r, i) => (
            <button
              key={i}
              onClick={() => onAddReaction?.(message.id, r.emoji)}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-[#181A20] border border-slate-200 dark:border-[#23262D] hover:bg-slate-200/80 dark:hover:bg-[#23262D] transition shadow-2xs"
            >
              <span>{r.emoji}</span>
              <span className="font-semibold text-[10px] text-slate-600 dark:text-slate-300">
                {r.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
