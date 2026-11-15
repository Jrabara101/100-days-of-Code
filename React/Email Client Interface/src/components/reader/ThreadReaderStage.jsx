import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  ShieldCheck, 
  Paperclip, 
  Reply, 
  ReplyAll, 
  Forward, 
  ChevronDown, 
  MessageSquare, 
  Send, 
  UserCheck, 
  Eye, 
  Download, 
  BookOpen,
  Sparkles,
  Crown,
  X,
  Plus
} from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { LabelPickerPopover } from '../labels/LabelPickerPopover';
import { SnoozePickerPopover } from '../threads/SnoozePickerPopover';

export function ThreadReaderStage() {
  const {
    selectedThreadId,
    markDone,
    openComposer,
    unsubscribeAndArchive,
    toggleRightRail,
    isRightRailOpen,
    serifReadingMode,
    toggleSerifReadingMode,
    labelPickerThreadId,
    setLabelPickerThreadId,
    snoozePickerThreadId,
    setSnoozePickerThreadId,
    removeLabel,
    addTeamNote,
  } = useMailStore();

  const [expandedMessageIds, setExpandedMessageIds] = useState(new Set());
  const [showQuotedMap, setShowQuotedMap] = useState({});
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [isNoteInputOpen, setIsNoteInputOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  const thread = useLiveQuery(() => db.threads.get(selectedThreadId), [selectedThreadId]);
  const messages = useLiveQuery(
    () => db.messages.where({ thread_id: selectedThreadId }).sortBy('created_at'),
    [selectedThreadId]
  ) || [];
  const allLabels = useLiveQuery(() => db.labels.toArray()) || [];

  const labelsMap = (allLabels || []).reduce((acc, l) => {
    acc[l.slug] = l;
    return acc;
  }, {});

  if (!selectedThreadId || !thread) {
    return (
      <div className="flex-1 h-full bg-[#FAFAFA] dark:bg-[#090A0D] flex flex-col items-center justify-center text-center p-8 select-none">
        <div className="w-12 h-12 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3">
          <BookOpen className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
          No Thread Selected
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
          Select a conversation from the inbox list or use <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded text-[10px]">J</kbd> and <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded text-[10px]">K</kbd> to step through threads.
        </p>
      </div>
    );
  }

  const toggleMessageExpand = (id) => {
    const next = new Set(expandedMessageIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedMessageIds(next);
  };

  const hasUnsubscribe = messages.some(m => !!m.list_unsubscribe_url);

  const handleQuickReply = (textSnippet, replyAll = false) => {
    const lastMsg = messages[messages.length - 1];
    const to = lastMsg?.from_participant?.email || thread.primary_sender?.email;
    const cc = replyAll && lastMsg?.cc_participants?.length 
      ? lastMsg.cc_participants.map(c => c.email).join(', ')
      : '';
    openComposer({
      to,
      cc,
      subject: thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`,
      body: textSnippet ? `${textSnippet}\n\n` : '',
      replyToThreadId: thread.id,
      inReplyToMessageId: lastMsg?.id,
    });
  };

  const handlePostTeamNote = (msgId) => {
    if (!internalNoteInput.trim()) return;
    addTeamNote(msgId, internalNoteInput.trim());
    setInternalNoteInput('');
    setIsNoteInputOpen(false);
  };

  return (
    <div className="flex-1 h-full bg-white dark:bg-[#090A0D] flex flex-col justify-between overflow-hidden relative">
      {/* Top Sticky Thread Action Header */}
      <div className="h-14 px-6 border-b border-[#E2E8F0] dark:border-[#222632] flex items-center justify-between bg-white/90 dark:bg-[#090A0D]/90 backdrop-blur-md z-10 flex-shrink-0">
        {/* Left: Subject & Label Bar */}
        <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {thread.subject}
          </h2>

          {/* Label Chips */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(thread.labels || []).map((slug) => {
              const labelObj = labelsMap[slug];
              if (!labelObj) return null;
              return (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    backgroundColor: `${labelObj.color_hex}1A`,
                    color: labelObj.color_hex,
                    border: `1px solid ${labelObj.color_hex}33`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: labelObj.color_hex }} />
                  {labelObj.name}
                  <button
                    onClick={() => removeLabel(thread.id, slug)}
                    className="hover:opacity-75 ml-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}

            <div className="relative">
              <button
                onClick={() => setLabelPickerThreadId(thread.id)}
                title="Assign Label (L)"
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {labelPickerThreadId === thread.id && (
                <LabelPickerPopover 
                  threadId={thread.id} 
                  onClose={() => setLabelPickerThreadId(null)} 
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Triage Command Bar */}
        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs">
          <button
            onClick={() => markDone(thread.id)}
            title="Mark Done / Archive (E)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium transition"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Done</span>
            <kbd className="text-[10px] opacity-75 font-mono ml-0.5">E</kbd>
          </button>

          <div className="relative">
            <button
              onClick={() => setSnoozePickerThreadId(thread.id)}
              title="Snooze (H)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Snooze</span>
              <kbd className="text-[10px] opacity-75 font-mono ml-0.5">H</kbd>
            </button>
            {snoozePickerThreadId === thread.id && (
              <SnoozePickerPopover 
                threadId={thread.id} 
                onClose={() => setSnoozePickerThreadId(null)} 
              />
            )}
          </div>

          {hasUnsubscribe && (
            <button
              onClick={() => unsubscribeAndArchive(thread.id)}
              title="1-Click Unsubscribe + Archive Past (⌘⇧U)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium transition"
            >
              <span>Unsubscribe</span>
              <kbd className="text-[10px] font-mono opacity-75">⌘⇧U</kbd>
            </button>
          )}

          <button
            onClick={toggleSerifReadingMode}
            title="Toggle Serif Reading Mode (Newsletters)"
            className={`p-1.5 rounded-lg transition ${
              serifReadingMode 
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' 
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={toggleRightRail}
            title="Toggle Sender Context Drawer"
            className={`p-1.5 rounded-lg transition ${
              isRightRailOpen 
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' 
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Conversation Stream Viewport */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Loop through messages in conversation */}
          {messages.map((msg, index) => {
            const isLastMessage = index === messages.length - 1;
            const isExpanded = isLastMessage || expandedMessageIds.has(msg.id);
            const showQuoted = showQuotedMap[msg.id];

            if (!isExpanded) {
              // Collapsed Historical Message Card
              return (
                <div
                  key={msg.id}
                  onClick={() => toggleMessageExpand(msg.id)}
                  className="h-11 px-4 rounded-xl border border-[#E2E8F0] dark:border-[#222632] bg-slate-50/60 dark:bg-[#12151D]/60 hover:bg-slate-100 dark:hover:bg-[#181C26] flex items-center justify-between cursor-pointer transition select-none group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <img
                      src={msg.from_participant?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {msg.from_participant?.name}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {msg.body_text?.slice(0, 80)}...
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-mono text-[11px] tabular-nums">
                      {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                </div>
              );
            }

            // Expanded Message Card
            return (
              <div
                key={msg.id}
                className="rounded-2xl border border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#12151D] shadow-2xs overflow-hidden transition"
              >
                {/* Message Header */}
                <div className="p-4 border-b border-[#E2E8F0]/60 dark:border-[#222632]/60 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img
                        src={msg.from_participant?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt=""
                        className={`w-10 h-10 rounded-full object-cover ${
                          msg.from_participant?.is_vip ? 'ring-2 ring-amber-400 p-0.5' : ''
                        }`}
                      />
                      {msg.from_participant?.is_vip && (
                        <Crown className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {msg.from_participant?.name}
                        </span>
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                          &lt;{msg.from_participant?.email}&gt;
                        </span>

                        {/* Privacy Shield Pill */}
                        {msg.trackers_blocked_count > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{msg.trackers_blocked_count} spy pixels blocked</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>to {msg.to_participants?.map(p => p.name || p.email).join(', ')}</span>
                        {msg.cc_participants?.length > 0 && (
                          <span className="text-slate-400">
                            (cc: {msg.cc_participants.map(c => c.name || c.email).join(', ')})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ({new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                    </span>

                    <button
                      onClick={() => handleQuickReply('', false)}
                      title="Quick Reply (R)"
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleQuickReply('', true)}
                      title="Reply All (A)"
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                    >
                      <ReplyAll className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Attachment Shelf (Pinned directly below header) */}
                {msg.attachments?.length > 0 && (
                  <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-[#161922]/70 border-b border-[#E2E8F0]/60 dark:border-[#222632]/60 flex items-center gap-3 overflow-x-auto">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex-shrink-0">
                      Attachments ({msg.attachments.length})
                    </span>
                    <div className="flex items-center gap-2">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#1A1D27] text-xs shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition group flex-shrink-0"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                              {att.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {att.size} &bull; {att.pages ? `${att.pages} pages` : 'Document'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => setPreviewAttachment(att)}
                              title="Live Preview"
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href="#download"
                              onClick={(e) => { e.preventDefault(); alert(`Downloading ${att.name}`); }}
                              title="Download File"
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Body Viewport */}
                <div className={`p-6 text-[14.5px] leading-relaxed text-slate-800 dark:text-slate-200 ${
                  serifReadingMode ? 'font-serif text-[16px] leading-[1.75]' : 'font-sans'
                }`}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: msg.body_html }} 
                    className="prose dark:prose-invert max-w-none space-y-3"
                  />

                  {/* Quoted Historical Content Folding */}
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0]/40 dark:border-[#222632]/40">
                    <button
                      onClick={() => setShowQuotedMap({ ...showQuotedMap, [msg.id]: !showQuoted })}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-mono text-slate-500 dark:text-slate-400 transition"
                    >
                      {showQuoted ? '▾ Hide trimmed history' : '••• Show trimmed content'}
                    </button>

                    {showQuoted && (
                      <div className="mt-3 pl-3 border-l-2 border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-1.5 animate-slide-down">
                        <p>On Nov 11, 2026, at 14:15, Elena Rostova wrote:</p>
                        <blockquote className="italic">
                          "We look forward to partnering with Acme Dev on the Q4 enterprise engine..."
                        </blockquote>
                      </div>
                    )}
                  </div>
                </div>

                {/* Internal Team Side-Chat Bar (Collaborate privately without Fwd chains) */}
                <div className="px-6 py-3 bg-slate-50/50 dark:bg-[#101217]/60 border-t border-[#E2E8F0]/60 dark:border-[#222632]/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                      <span>Internal Team Side-Notes (@mentions)</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        — Private to Acme Dev team
                      </span>
                    </div>

                    {!isNoteInputOpen && (
                      <button
                        onClick={() => setIsNoteInputOpen(true)}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Note</span>
                      </button>
                    )}
                  </div>

                  {/* List of existing team notes */}
                  {msg.team_notes?.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {msg.team_notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs flex items-start gap-2.5"
                        >
                          <img
                            src={note.avatar}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-purple-900 dark:text-purple-300">
                                {note.author}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date(note.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                              {note.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Note input field */}
                  {isNoteInputOpen && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="@marcus or @alex to notify team privately..."
                        value={internalNoteInput}
                        onChange={(e) => setInternalNoteInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePostTeamNote(msg.id)}
                        autoFocus
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#1A1D27] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => handlePostTeamNote(msg.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Post Note</span>
                      </button>
                      <button
                        onClick={() => setIsNoteInputOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Quick-Reply Bar & Smart AI Suggestions */}
      <div className="p-4 border-t border-[#E2E8F0] dark:border-[#222632] bg-white/95 dark:bg-[#090A0D]/95 backdrop-blur-md flex-shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
          {/* Smart 1-Click Quick Reply Suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 flex-shrink-0">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Smart Replies:
            </span>

            <button
              onClick={() => handleQuickReply('Looks great, approved! We will countersign right away.')}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 font-medium transition flex-shrink-0"
            >
              "Looks great, approved!"
            </button>

            <button
              onClick={() => handleQuickReply('Let\'s sync Thursday at 2 PM GMT to review the redlines.')}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 font-medium transition flex-shrink-0"
            >
              "Let's sync Thursday at 2 PM"
            </button>

            <button
              onClick={() => handleQuickReply('Sending over the counter-signed PDF and SOC 2 Type II now.')}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 font-medium transition flex-shrink-0"
            >
              "Sending over signed PDF now"
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuickReply('', false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply (R)</span>
              </button>
              <button
                onClick={() => handleQuickReply('', true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition"
              >
                <ReplyAll className="w-3.5 h-3.5" />
                <span>Reply All (A)</span>
              </button>
              <button
                onClick={() => handleQuickReply('', false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition"
              >
                <Forward className="w-3.5 h-3.5" />
                <span>Forward (F)</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              <span>Press <kbd className="bg-slate-100 dark:bg-slate-800 px-1 rounded">R</kbd> to quick-reply</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attachment Live Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3 border-b border-[#E2E8F0] dark:border-[#222632] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  {previewAttachment.name}
                </span>
                <span className="text-[11px] font-mono text-slate-400">({previewAttachment.size})</span>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0D0F14]">
              {previewAttachment.preview_url ? (
                <img
                  src={previewAttachment.preview_url}
                  alt={previewAttachment.name}
                  className="max-h-[500px] rounded-lg shadow-md object-contain border border-[#E2E8F0] dark:border-[#222632]"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3">
                    <Paperclip className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Document Document Preview
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    Rendered with client-side secure sandbox. Full text extraction & OCR indexing verified in Meilisearch engine.
                  </p>
                  <button
                    onClick={() => { alert(`Downloading ${previewAttachment.name}`); setPreviewAttachment(null); }}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {previewAttachment.name}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

