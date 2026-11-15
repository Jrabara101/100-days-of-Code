import { useEffect, useState } from 'react';
import {
  SmilePlus,
  GitBranch,
  CornerUpLeft,
  Pin,
  MoreHorizontal,
  Check,
  CheckCheck,
  Clock,
  BellOff,
  FileText,
  Download,
  Pencil,
  Bookmark,
  CalendarClock,
} from 'lucide-react';
import type { Message, User } from '../../types/chat';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { QUICK_REACTIONS } from '../../lib/constants';
import {
  canEditMessage,
  cn,
  computeSimpleWordDiff,
  formatBytes,
  formatShortTime,
} from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { PollCard } from './PollCard';
import { CodeBlockCard } from './CodeBlockCard';
import { LinkUnfurlCard } from './LinkUnfurlCard';
import { ThreadSummaryCard } from './ThreadSummaryCard';

interface MessageBubbleProps {
  message: Message;
  sender?: User;
  quotedMessage?: Message;
  quotedSender?: User;
  showSenderHeader: boolean;
  isHighlighted: boolean;
  isPinned: boolean;
  isBookmarked: boolean;
  isActiveThread: boolean;
  onQuote: (msg: Message) => void;
  onOpenThread: (parentId: string) => void;
  onJumpToMessage: (msgId: string) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onEditMessage: (msgId: string, newContent: string) => void;
  onVotePoll: (msgId: string, optionId: string) => void;
  onTogglePin: (msgId: string) => void;
  onToggleBookmark: (msgId: string) => void;
}

export function MessageBubble({
  message,
  sender,
  quotedMessage,
  quotedSender,
  showSenderHeader,
  isHighlighted,
  isPinned,
  isBookmarked,
  isActiveThread,
  onQuote,
  onOpenThread,
  onJumpToMessage,
  onToggleReaction,
  onEditMessage,
  onVotePoll,
  onTogglePin,
  onToggleBookmark,
}: MessageBubbleProps) {
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const setLightboxMedia = useChatWorkspaceStore((s) => s.setLightboxMedia);

  const [isHovered, setIsHovered] = useState(false);
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(message.content);
  const [diffOpen, setDiffOpen] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const isOutbound = message.senderId === currentUserId;
  const editable = canEditMessage(message.createdAt, message.senderId, currentUserId);

  // Press 'R' while hovering bubble to trigger tactile Quote-Reply snap
  useEffect(() => {
    if (!isHovered) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isInput) return;
      if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onQuote(message);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isHovered, message, onQuote]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editDraft.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      return;
    }
    onEditMessage(message.id, trimmed);
    setIsEditing(false);
  };

  const renderContentWithMentions = (text: string) => {
    if (!text) return null;
    const tokens = text.split(/(@[a-zA-Z0-9_.-]+|`[^`]+`|https?:\/\/[^\s)]+)/g);
    return tokens.map((token, idx) => {
      if (!token) return null;
      if (token.startsWith('@')) {
        return (
          <span
            key={idx}
            className={cn(
              'font-semibold rounded px-1 py-0.5',
              isOutbound ? 'bg-white/20 text-white' : 'bg-blue-500/15 text-blue-500'
            )}
          >
            {token}
          </span>
        );
      }
      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        return (
          <code
            key={idx}
            className={cn(
              'font-mono text-[12.5px] px-1.5 py-0.5 rounded',
              isOutbound ? 'bg-black/25 text-white' : 'bg-surface-tertiary text-txt-primary'
            )}
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('http://') || token.startsWith('https://')) {
        return (
          <a
            key={idx}
            href={token}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'underline underline-offset-2 break-all',
              isOutbound ? 'text-white/95 hover:text-white' : 'text-blue-500 hover:text-blue-400'
            )}
          >
            {token}
          </a>
        );
      }
      return <span key={idx}>{token}</span>;
    });
  };

  const reactionEntries = Object.entries(message.reactions ?? {}).filter(
    ([, users]) => users.length > 0
  );

  const lastEditDiff =
    message.editHistory && message.editHistory.length > 0
      ? computeSimpleWordDiff(
          message.editHistory[message.editHistory.length - 1].content,
          message.content
        )
      : null;

  return (
    <div
      id={`msg-${message.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setEmojiMenuOpen(false);
        setMoreMenuOpen(false);
      }}
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchMove={(e) => {
        if (touchStartX === null) return;
        const delta = e.touches[0].clientX - touchStartX;
        if (delta > 0 && delta < 48) setSwipeX(delta);
      }}
      onTouchEnd={() => {
        if (swipeX >= 24) onQuote(message);
        setSwipeX(0);
        setTouchStartX(null);
      }}
      style={swipeX > 0 ? { transform: `translateX(${swipeX}px)` } : undefined}
      className={cn(
        'group relative flex gap-3 px-4 md:px-6 transition-all duration-200 animate-bubble-in',
        showSenderHeader ? 'pt-3 pb-0.5' : 'py-0.5',
        isOutbound ? 'justify-end' : 'justify-start',
        isHighlighted && 'bg-violet-500/10 rounded-xl animate-flash-anchor'
      )}
    >
      {/* Left Avatar Column for Inbound */}
      {!isOutbound && (
        <div className="w-9 shrink-0 flex justify-center pt-0.5">
          {showSenderHeader ? (
            <Avatar user={sender} size={36} showPresence ringClass="ring-2 ring-canvas" />
          ) : (
            <span className="tabular-nums-meta opacity-0 group-hover:opacity-100 text-[10px] text-txt-muted self-center transition-opacity">
              {formatShortTime(message.createdAt)}
            </span>
          )}
        </div>
      )}

      {/* Message Body Column */}
      <div
        className={cn(
          'relative flex flex-col max-w-[85%] sm:max-w-[62ch]',
          isOutbound ? 'items-end' : 'items-start'
        )}
      >
        {/* Sender Name & Status Badges */}
        {showSenderHeader && !isOutbound && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="text-xs font-semibold text-txt-primary">
              {sender?.displayName ?? 'Member'}
            </span>
            <span className="tabular-nums-meta text-[11px] text-txt-muted">
              {formatShortTime(message.createdAt)}
            </span>
            {isPinned && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </span>
            )}
          </div>
        )}

        {/* Broadcast-to-Main Thread Tag */}
        {message.alsoBroadcastToMain && message.parentThreadId && (
          <button
            type="button"
            onClick={() => onOpenThread(message.parentThreadId!)}
            className="mb-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[11px] font-medium text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition-colors"
          >
            <GitBranch className="w-3 h-3" />
            <span>Replied in thread &amp; broadcast to main chat</span>
          </button>
        )}

        {/* Bubble Container + Floating Hover Toolbar */}
        <div className="relative">
          {/* Floating Action Toolbar */}
          {isHovered && !isEditing && (
            <div
              className={cn(
                'absolute -top-8 z-20 flex items-center gap-0.5 rounded-xl border border-divider bg-surface-elevated p-0.5 shadow-lg',
                isOutbound ? 'right-0' : 'left-0'
              )}
            >
              <button
                type="button"
                onClick={() => setEmojiMenuOpen((v) => !v)}
                title="Add reaction"
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-txt-muted hover:text-txt-primary transition-colors"
              >
                <SmilePlus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onOpenThread(message.parentThreadId ?? message.id)}
                title="Reply in Thread"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#8B5CF6]/15 text-txt-muted hover:text-[#8B5CF6] text-[11px] font-medium transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thread</span>
              </button>
              <button
                type="button"
                onClick={() => onQuote(message)}
                title="Quote reply (Press R)"
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-txt-muted hover:text-txt-primary transition-colors"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onTogglePin(message.id)}
                title={isPinned ? 'Unpin message' : 'Pin message'}
                className={cn(
                  'p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors',
                  isPinned ? 'text-blue-500' : 'text-txt-muted hover:text-txt-primary'
                )}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMoreMenuOpen((v) => !v)}
                title="More actions"
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-txt-muted hover:text-txt-primary transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {emojiMenuOpen && (
                <div className="absolute top-9 left-0 z-30 flex items-center gap-1 rounded-full border border-divider bg-surface-elevated px-2 py-1 shadow-xl">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onToggleReaction(message.id, emoji);
                        setEmojiMenuOpen(false);
                      }}
                      className="w-7 h-7 rounded-full hover:bg-surface-tertiary flex items-center justify-center text-sm transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {moreMenuOpen && (
                <div className="absolute top-9 right-0 z-30 w-44 rounded-xl border border-divider bg-surface-elevated p-1 shadow-xl text-xs">
                  {editable && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditDraft(message.content);
                        setIsEditing(true);
                        setMoreMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-tertiary text-txt-primary"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Message
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleBookmark(message.id);
                      setMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-tertiary text-txt-primary"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {isBookmarked ? 'Remove Bookmark' : 'Save Bookmark'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Main Bubble Surface */}
          <div
            className={cn(
              'rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-[1.55] shadow-sm transition-all',
              isOutbound
                ? 'outbound-bubble-gradient text-white rounded-br-md'
                : 'bg-inbound-bubble border border-inbound-border text-txt-primary rounded-bl-md'
            )}
          >
            {/* Inline Quote Card */}
            {quotedMessage && (
              <button
                type="button"
                onClick={() => onJumpToMessage(quotedMessage.id)}
                className={cn(
                  'mb-2 w-full text-left border-l-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors',
                  isOutbound
                    ? 'border-white/70 bg-black/15 hover:bg-black/25 text-white'
                    : 'border-blue-500 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-txt-primary'
                )}
              >
                <p className="font-semibold text-[11px] opacity-90">
                  {quotedSender?.displayName ?? 'Message'}
                </p>
                <p className="truncate opacity-80">
                  {quotedMessage.content || '[Media / Attachment]'}
                </p>
              </button>
            )}

            {/* Text Content OR Inline Edit Form */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-2 min-w-[260px]">
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  rows={2}
                  autoFocus
                  className="w-full rounded-lg bg-black/20 border border-white/30 px-2.5 py-1.5 text-sm text-white focus:outline-none"
                />
                <div className="flex items-center justify-end gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2 py-1 rounded bg-white/15 hover:bg-white/25"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded bg-white text-blue-600 font-semibold"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              message.content && (
                <p className="whitespace-pre-wrap break-words">
                  {renderContentWithMentions(message.content)}
                </p>
              )
            )}

            {/* Rich Attachments */}
            {message.attachments.map((att) => {
              if (att.kind === 'voice') {
                return (
                  <VoiceNotePlayer key={att.id} attachment={att} isOutbound={isOutbound} />
                );
              }
              if (att.kind === 'poll') {
                return (
                  <PollCard
                    key={att.id}
                    poll={att}
                    isOutbound={isOutbound}
                    onVote={(optId) => onVotePoll(message.id, optId)}
                  />
                );
              }
              if (att.kind === 'code') {
                return <CodeBlockCard key={att.id} attachment={att} />;
              }
              if (att.kind === 'link') {
                return <LinkUnfurlCard key={att.id} attachment={att} isOutbound={isOutbound} />;
              }
              if (att.kind === 'image') {
                return (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() => setLightboxMedia(att)}
                    className="mt-2 block rounded-xl overflow-hidden border border-white/10 hover:opacity-95 transition-opacity cursor-zoom-in"
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      className="max-h-60 w-full object-cover"
                    />
                  </button>
                );
              }
              if (att.kind === 'file') {
                return (
                  <div
                    key={att.id}
                    className={cn(
                      'mt-2 flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs',
                      isOutbound
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-surface-secondary border-divider text-txt-primary'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{att.name}</p>
                      <p className="tabular-nums-meta text-[10px] opacity-75">
                        {att.ext} • {formatBytes(att.sizeBytes)}
                      </p>
                    </div>
                    <a
                      href={att.url}
                      onClick={(e) => {
                        if (att.url.startsWith('#')) {
                          e.preventDefault();
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              }
              return null;
            })}

            {/* Bottom Metadata Row inside bubble: Silent/Scheduled badge, (edited) diff tooltip, time, delivery ticks */}
            <div
              className={cn(
                'mt-1 flex items-center justify-end gap-1.5 text-[10.5px]',
                isOutbound ? 'text-white/75' : 'text-txt-muted'
              )}
            >
              {message.isSilent && (
                <span className="inline-flex items-center gap-0.5 opacity-90" title="Sent silently">
                  <BellOff className="w-2.5 h-2.5" />
                  Silent
                </span>
              )}
              {message.scheduledFor && (
                <span className="inline-flex items-center gap-0.5 text-amber-200">
                  <CalendarClock className="w-2.5 h-2.5" />
                  Scheduled 9 AM
                </span>
              )}
              {message.editedAt && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDiffOpen((v) => !v)}
                    onMouseEnter={() => setDiffOpen(true)}
                    onMouseLeave={() => setDiffOpen(false)}
                    className="underline decoration-dotted underline-offset-2 hover:opacity-100"
                  >
                    (edited)
                  </button>
                  {diffOpen && lastEditDiff && (
                    <div className="absolute bottom-6 right-0 z-30 w-64 rounded-xl border border-divider bg-surface-elevated p-2.5 shadow-xl text-[11px] text-txt-primary text-left">
                      <p className="font-semibold mb-1 text-txt-muted">Edit Diff</p>
                      <div className="flex flex-wrap gap-1 leading-relaxed">
                        {lastEditDiff.map((seg, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              seg.type === 'removed' &&
                                'line-through bg-rose-500/20 text-rose-400 px-1 rounded',
                              seg.type === 'added' &&
                                'bg-emerald-500/20 text-emerald-400 px-1 rounded'
                            )}
                          >
                            {seg.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <span className="tabular-nums-meta">{formatShortTime(message.createdAt)}</span>

              {isOutbound && (
                <span
                  title={message.deliveryState ?? 'sent'}
                  className="inline-flex items-center"
                >
                  {message.deliveryState === 'sending' ? (
                    <Clock className="w-3 h-3 text-amber-200 animate-pulse" />
                  ) : message.deliveryState === 'read' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                  ) : message.deliveryState === 'delivered' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-white/75" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-white/75" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Animated Emoji Reaction Pills */}
        {reactionEntries.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {reactionEntries.map(([emoji, userIds]) => {
              const reactedByMe = userIds.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onToggleReaction(message.id, emoji)}
                  className={cn(
                    'tabular-nums-meta inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all active:scale-95',
                    reactedByMe
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-500 font-semibold'
                      : 'bg-surface-secondary border-divider text-txt-muted hover:text-txt-primary'
                  )}
                >
                  <span>{emoji}</span>
                  <span className="text-[11px]">{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread Branch Summary Card (below parent bubble) */}
        <ThreadSummaryCard
          message={message}
          isActiveThread={isActiveThread}
          onOpenThread={() => onOpenThread(message.id)}
        />
      </div>
    </div>
  );
}

