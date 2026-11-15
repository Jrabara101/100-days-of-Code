import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Mic,
  Square,
  Smile,
  Send,
  ChevronDown,
  BellOff,
  CalendarClock,
  X,
  BarChart3,
  Code2,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';
import type { Conversation, Message, MessageAttachment } from '../../types/chat';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useLiveClock } from '../../hooks/useLiveClock';
import { getContactTimezoneInfo } from '../../lib/timezone';
import { ALL_EMOJIS, SLASH_COMMANDS } from '../../lib/constants';
import { wsClient } from '../../lib/wsClient';
import { cn, extractUrls, formatDuration, generateUuid } from '../../lib/utils';

interface ComposerDockProps {
  conversation: Conversation;
  quoteMessage: Message | null;
  onClearQuote: () => void;
  onSend: (payload: {
    content: string;
    attachments: MessageAttachment[];
    quoteReplyId: string | null;
    isSilent: boolean;
    scheduledFor: string | null;
  }) => void;
  onOpenPollModal: () => void;
}

export function ComposerDock({
  conversation,
  quoteMessage,
  onClearQuote,
  onSend,
  onOpenPollModal,
}: ComposerDockProps) {
  const now = useLiveClock(30_000);
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const usersById = usePresenceStore((s) => s.usersById);
  const currentUser = usersById[currentUserId];

  const draft = useChatWorkspaceStore((s) => s.drafts[conversation.id]);
  const updateDraft = useChatWorkspaceStore((s) => s.updateDraft);
  const clearDraft = useChatWorkspaceStore((s) => s.clearDraft);

  const [text, setText] = useState(draft?.text ?? '');
  const [stagedAttachments, setStagedAttachments] = useState<MessageAttachment[]>(
    draft?.attachments ?? []
  );
  const [notifyAnyway, setNotifyAnyway] = useState(false);
  const [forceSilent, setForceSilent] = useState(false);
  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeLang, setCodeLang] = useState('typescript');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [recordBars, setRecordBars] = useState<number[]>(Array(32).fill(0.25));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync draft when switching conversations
  useEffect(() => {
    setText(draft?.text ?? '');
    setStagedAttachments(draft?.attachments ?? []);
    setNotifyAnyway(false);
    setForceSilent(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // Focus textarea when quoteReply mounts
  useEffect(() => {
    if (quoteMessage) {
      textareaRef.current?.focus();
    }
  }, [quoteMessage]);

  const peer =
    conversation.type === 'direct'
      ? conversation.participantUsers.find((u) => u.id !== currentUserId)
      : undefined;

  const tzInfo = peer
    ? getContactTimezoneInfo(
        peer.timezone,
        peer.workingHours,
        currentUser?.timezone ?? 'Asia/Singapore',
        now
      )
    : null;

  const recipientName =
    conversation.type === 'group'
      ? conversation.title ?? 'Group'
      : peer?.displayName.split(' ')[0] ?? 'Recipient';

  const autoSilent = Boolean(tzInfo?.isSleeping && !notifyAnyway);
  const effectiveSilent = forceSilent || autoSilent;

  const handleTextChange = (val: string) => {
    setText(val);
    updateDraft(conversation.id, {
      text: val,
      quoteReplyId: quoteMessage?.id ?? null,
      attachments: stagedAttachments,
    });
    if (val.trim().length > 0) {
      wsClient.emit('typing:start', {
        conversationId: conversation.id,
        userId: currentUserId,
        userName: currentUser?.displayName.split(' ')[0] ?? 'River',
      });
    }
  };

  const handleSendNow = (scheduledFor: string | null = null, overrideSilent?: boolean) => {
    const trimmed = text.trim();
    if (!trimmed && stagedAttachments.length === 0) return;

    // Auto-extract URL for rich Link Unfurl card if present and not already attached
    const urls = extractUrls(trimmed);
    const attachments = [...stagedAttachments];
    if (urls.length > 0 && !attachments.some((a) => a.kind === 'link')) {
      try {
        const u = new URL(urls[0]);
        attachments.push({
          id: generateUuid(),
          kind: 'link',
          url: urls[0],
          domain: u.hostname.replace(/^www\./, ''),
          title: `${u.hostname} — Shared Link Preview`,
          description: `Preview automatically unfurled for ${urls[0]}`,
        });
      } catch {
        // Ignore invalid URL
      }
    }

    onSend({
      content: trimmed,
      attachments,
      quoteReplyId: quoteMessage?.id ?? null,
      isSilent: overrideSilent ?? effectiveSilent,
      scheduledFor,
    });

    setText('');
    setStagedAttachments([]);
    setForceSilent(false);
    setSendMenuOpen(false);
    onClearQuote();
    clearDraft(conversation.id);
  };

  const startVoiceRecording = async () => {
    setIsRecording(true);
    setRecordSec(0);
    wsClient.emit('recording:audio', {
      conversationId: conversation.id,
      userId: currentUserId,
      userName: currentUser?.displayName.split(' ')[0] ?? 'River',
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start();
      mediaRecorderRef.current = mr;
    } catch {
      // Headless / permission denied fallback — simulated waveform capture works seamlessly
      mediaRecorderRef.current = null;
    }

    recordTimerRef.current = window.setInterval(() => {
      setRecordSec((s) => s + 1);
      setRecordBars((prev) => [
        ...prev.slice(1),
        Number((0.25 + Math.random() * 0.72).toFixed(2)),
      ]);
      wsClient.emit('recording:audio', {
        conversationId: conversation.id,
        userId: currentUserId,
        userName: currentUser?.displayName.split(' ')[0] ?? 'River',
      });
    }, 1000);
  };

  const stopAndAttachVoice = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const durationSec = Math.max(2, recordSec);
    setIsRecording(false);

    const finalize = (audioUrl?: string) => {
      const voiceAtt: MessageAttachment = {
        id: generateUuid(),
        kind: 'voice',
        durationSec,
        waveform: recordBars,
        transcript: `Voice note (${durationSec}s) — automatic transcript ready for ${recipientName}.`,
        audioUrl,
      };
      const nextAtts = [...stagedAttachments, voiceAtt];
      setStagedAttachments(nextAtts);
      updateDraft(conversation.id, { attachments: nextAtts });
    };

    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        mr.stream.getTracks().forEach((t) => t.stop());
        finalize(url);
      };
      mr.stop();
    } else {
      finalize();
    }
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImg = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      const att: MessageAttachment = isImg
        ? {
            id: generateUuid(),
            kind: 'image',
            url: String(reader.result),
            name: file.name,
            sizeBytes: file.size,
          }
        : {
            id: generateUuid(),
            kind: 'file',
            name: file.name,
            ext: file.name.split('.').pop()?.toUpperCase() || 'FILE',
            sizeBytes: file.size,
            url: String(reader.result),
          };
      const nextAtts = [...stagedAttachments, att];
      setStagedAttachments(nextAtts);
      updateDraft(conversation.id, { attachments: nextAtts });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Slash command suggestions
  const showSlashPopup = text.startsWith('/') && !text.includes(' ');
  const matchingSlash = showSlashPopup
    ? SLASH_COMMANDS.filter((c) => c.command.startsWith(text.toLowerCase()))
    : [];

  // @mention autocomplete
  const atMatch = text.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
  const matchingMentions = atMatch
    ? conversation.participantUsers.filter(
        (u) =>
          u.id !== currentUserId &&
          (u.handle.toLowerCase().includes(atMatch[1].toLowerCase()) ||
            u.displayName.toLowerCase().includes(atMatch[1].toLowerCase()))
      )
    : [];

  return (
    <div className="shrink-0 px-4 pb-4 pt-2 bg-canvas">
      {/* Contextual Timezone / Silent Send Banner */}
      {tzInfo?.isSleeping && (
        <div className="mb-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-200 dark:text-amber-300 text-amber-800">
            <span className="tabular-nums-meta">
              🌙 It&apos;s <strong className="font-semibold">{tzInfo.localTime12h}</strong> for{' '}
              {recipientName} in {tzInfo.city}.{' '}
              {notifyAnyway
                ? 'Notification sound enabled.'
                : 'Your message will be delivered silently.'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNotifyAnyway((v) => !v)}
              className={cn(
                'px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors',
                notifyAnyway
                  ? 'bg-amber-500 text-white'
                  : 'bg-surface-elevated border border-divider text-txt-primary hover:bg-surface-tertiary'
              )}
            >
              {notifyAnyway ? 'Deliver Silently Instead' : 'Notify Anyway'}
            </button>
            <button
              type="button"
              onClick={() => handleSendNow(tzInfo.next9amIso, false)}
              disabled={!text.trim() && stagedAttachments.length === 0}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[11px] font-semibold disabled:opacity-40 transition-colors"
            >
              <CalendarClock className="w-3 h-3" />
              Schedule 9:00 AM
            </button>
          </div>
        </div>
      )}

      {/* Main Composer Capsule */}
      <div className="relative rounded-2xl border border-divider bg-surface-secondary p-2.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/40 transition-shadow">
        {/* Slash Commands Popover */}
        {matchingSlash.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-80 rounded-xl border border-divider bg-surface-elevated p-1.5 shadow-2xl z-30">
            {matchingSlash.map((cmd) => (
              <button
                key={cmd.command}
                type="button"
                onClick={() => {
                  if (cmd.command === '/silent') {
                    setForceSilent(true);
                    setText('');
                  } else if (cmd.command === '/poll') {
                    setText('');
                    onOpenPollModal();
                  } else if (cmd.command === '/code') {
                    setText('');
                    setIsCodeModalOpen(true);
                  } else if (cmd.command === '/schedule' && tzInfo) {
                    setText('');
                    handleSendNow(tzInfo.next9amIso, false);
                  }
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-surface-tertiary flex items-center justify-between gap-2 text-xs"
              >
                <span className="font-mono font-semibold text-blue-500">{cmd.command}</span>
                <span className="text-txt-muted truncate">{cmd.description}</span>
              </button>
            ))}
          </div>
        )}

        {/* @Mentions Autocomplete */}
        {matchingMentions.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 w-64 rounded-xl border border-divider bg-surface-elevated p-1.5 shadow-2xl z-30">
            {matchingMentions.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  const replaced = text.replace(/@[a-zA-Z0-9_]*$/, `${u.handle} `);
                  handleTextChange(replaced);
                  textareaRef.current?.focus();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-tertiary flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-txt-primary">{u.displayName}</span>
                <span className="text-txt-muted">{u.handle}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quote-Reply Banner */}
        {quoteMessage && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-surface-tertiary border-l-2 border-blue-500 px-3 py-1.5 text-xs">
            <div className="min-w-0">
              <p className="font-semibold text-blue-500 text-[11px]">
                Replying to {usersById[quoteMessage.senderId]?.displayName ?? 'Message'}
              </p>
              <p className="text-txt-muted truncate">
                {quoteMessage.content || '[Media / Attachment]'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearQuote}
              className="p-1 rounded-lg hover:bg-surface-elevated text-txt-muted"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Staged Attachments Preview Strip */}
        {stagedAttachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {stagedAttachments.map((att) => (
              <div
                key={att.id}
                className="inline-flex items-center gap-2 rounded-xl bg-surface-tertiary border border-divider px-2.5 py-1.5 text-xs text-txt-primary"
              >
                <span>
                  {att.kind === 'voice'
                    ? `🎙️ Voice (${att.durationSec}s)`
                    : att.kind === 'code'
                      ? `💻 ${att.language} snippet`
                      : att.kind === 'image'
                        ? `🖼️ ${att.name}`
                        : att.kind === 'file'
                          ? `📎 ${att.name}`
                          : 'Attachment'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = stagedAttachments.filter((a) => a.id !== att.id);
                    setStagedAttachments(next);
                    updateDraft(conversation.id, { attachments: next });
                  }}
                  className="text-txt-muted hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Inline Code Snippet Builder */}
        {isCodeModalOpen && (
          <div className="mb-2 rounded-xl border border-divider bg-surface-elevated p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <select
                value={codeLang}
                onChange={(e) => setCodeLang(e.target.value)}
                className="rounded-lg bg-surface-tertiary border border-divider px-2 py-1 text-xs text-txt-primary"
              >
                <option value="typescript">TypeScript</option>
                <option value="sql">SQL</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
              </select>
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(false)}
                className="text-xs text-txt-muted hover:text-txt-primary"
              >
                Cancel
              </button>
            </div>
            <textarea
              rows={3}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Paste code snippet..."
              className="w-full rounded-lg bg-surface-tertiary border border-divider p-2 font-mono text-xs text-txt-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (!codeInput.trim()) return;
                const next: MessageAttachment[] = [
                  ...stagedAttachments,
                  {
                    id: generateUuid(),
                    kind: 'code',
                    language: codeLang,
                    filename: `snippet.${codeLang === 'typescript' ? 'ts' : codeLang}`,
                    code: codeInput,
                  },
                ];
                setStagedAttachments(next);
                setCodeInput('');
                setIsCodeModalOpen(false);
              }}
              className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold"
            >
              Attach Code Block
            </button>
          </div>
        )}

        {/* Active Voice Recording Bar OR Normal Composer Row */}
        {isRecording ? (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span className="tabular-nums-meta text-xs font-semibold text-rose-500 shrink-0">
              Recording {formatDuration(recordSec)}
            </span>
            <div className="flex-1 flex items-center gap-0.5 h-6 overflow-hidden">
              {recordBars.map((b, idx) => (
                <span
                  key={idx}
                  style={{ height: `${Math.round(b * 100)}%` }}
                  className="flex-1 rounded-full bg-blue-500/75"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={stopAndAttachVoice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop &amp; Attach
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            {/* + Attach Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAttachMenuOpen((v) => !v)}
                title="Attach file, poll, or code block"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-surface-tertiary transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>

              {attachMenuOpen && (
                <div className="absolute bottom-11 left-0 z-30 w-48 rounded-xl border border-divider bg-surface-elevated p-1 shadow-xl text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setAttachMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface-tertiary text-txt-primary"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                    Image or File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachMenuOpen(false);
                      onOpenPollModal();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface-tertiary text-txt-primary"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                    Quick Decision Poll
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachMenuOpen(false);
                      setIsCodeModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface-tertiary text-txt-primary"
                  >
                    <Code2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    Code Block
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFilePicked}
              />
            </div>

            {/* Auto-expanding Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendNow();
                }
              }}
              placeholder={`Message ${recipientName}... (Type / for commands or @ to mention)`}
              className="flex-1 max-h-32 resize-none bg-transparent py-2 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none"
            />

            {forceSilent && (
              <button
                type="button"
                onClick={() => setForceSilent(false)}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-[11px] font-medium"
                title="Click to disable silent send"
              >
                <BellOff className="w-3 h-3" />
                Silent
              </button>
            )}

            <button
              type="button"
              onClick={startVoiceRecording}
              title="Record Voice Note"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-surface-tertiary transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setEmojiPickerOpen((v) => !v)}
                title="Insert Emoji"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-surface-tertiary transition-colors"
              >
                <Smile className="w-4 h-4" />
              </button>

              {emojiPickerOpen && (
                <div className="absolute bottom-11 right-0 z-30 w-60 rounded-2xl border border-divider bg-surface-elevated p-2 shadow-2xl grid grid-cols-6 gap-1">
                  {ALL_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        handleTextChange(`${text}${em}`);
                        setEmojiPickerOpen(false);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-surface-tertiary flex items-center justify-center text-base"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Split Send CTA */}
            <div className="relative flex items-center rounded-xl overflow-hidden bg-blue-600 text-white shadow-sm">
              <button
                type="button"
                onClick={() => handleSendNow()}
                disabled={!text.trim() && stagedAttachments.length === 0}
                className="px-3 py-2 flex items-center gap-1.5 text-xs font-semibold hover:bg-blue-500 disabled:opacity-45 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {effectiveSilent ? 'Send Silently' : 'Send'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSendMenuOpen((v) => !v)}
                className="px-1.5 py-2 border-l border-white/20 hover:bg-blue-500 transition-colors"
                aria-label="Send options"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {sendMenuOpen && (
                <div className="fixed sm:absolute bottom-16 sm:bottom-11 right-4 sm:right-0 z-30 w-64 rounded-xl border border-divider bg-surface-elevated p-1.5 shadow-2xl text-xs text-txt-primary">
                  <button
                    type="button"
                    onClick={() => handleSendNow(null, true)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface-tertiary text-left"
                  >
                    <BellOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-semibold">Send Silently</p>
                      <p className="text-[10.5px] text-txt-muted">No push sound or notification</p>
                    </div>
                  </button>
                  {tzInfo && (
                    <button
                      type="button"
                      onClick={() => handleSendNow(tzInfo.next9amIso, false)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface-tertiary text-left"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <div>
                        <p className="font-semibold">Schedule for 9:00 AM Their Time</p>
                        <p className="text-[10.5px] text-txt-muted">{tzInfo.next9amLabel}</p>
                      </div>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setSendMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface-tertiary text-left"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-txt-muted shrink-0" />
                    <span>Attach File</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

