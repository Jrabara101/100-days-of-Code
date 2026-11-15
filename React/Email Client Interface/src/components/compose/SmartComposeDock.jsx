import React, { useState, useRef } from 'react';
import { 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Paperclip, 
  Send, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  Moon, 
  Trash2, 
  ChevronDown
} from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

export function SmartComposeDock() {
  const {
    activeDrafts,
    activeDraftId,
    updateDraft,
    closeDraft,
    minimizeDraft,
    isFocusComposer,
    toggleFocusComposer,
    queueSendDraft,
  } = useMailStore();

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [scheduleDropdownOpen, setScheduleDropdownOpen] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [attachmentWarningDismissed, setAttachmentWarningDismissed] = useState(false);

  const fileInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);

  const snippets = useLiveQuery(() => db.snippets.toArray()) || [];
  const contacts = useLiveQuery(() => db.contacts.toArray()) || [];

  const currentDraft = activeDrafts.find((d) => d.id === activeDraftId) || activeDrafts[0];

  if (activeDrafts.length === 0 || !currentDraft) return null;

  // Linter: Missing Attachment Sentinel
  const bodyText = currentDraft.body || '';
  const attachmentKeywords = ['attached', 'attachment', 'enclosed', 'see the pdf', 'see attached'];
  const mentionsAttachment = attachmentKeywords.some(kw => bodyText.toLowerCase().includes(kw));
  const hasNoAttachments = (!currentDraft.attachments || currentDraft.attachments.length === 0);
  const showMissingAttachmentSentinel = mentionsAttachment && hasNoAttachments && !attachmentWarningDismissed;

  // Recipient analysis: external domain warning
  const recipientsList = currentDraft.to ? currentDraft.to.split(',').map(s => s.trim()).filter(Boolean) : [];
  const hasExternalRecipient = recipientsList.some(email => !email.endsWith('@acme.dev'));

  // Timezone resolution: check if recipient is outside business hours
  const primaryRecipientEmail = recipientsList[0]?.toLowerCase();
  const matchedContact = contacts.find(c => c.email.toLowerCase() === primaryRecipientEmail);
  const recipientTz = matchedContact?.timezone || (primaryRecipientEmail?.includes('stripe') ? 'Europe/London' : null);
  
  // Calculate if recipient is in night hours (e.g. 10pm - 7am)
  let recipientLocalHour = 14;
  let recipientFormattedTime = '11:40 PM';
  if (recipientTz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: recipientTz,
        hour: 'numeric',
        hour12: false,
      }).formatToParts(new Date());
      recipientLocalHour = parseInt(parts.find(p => p.type === 'hour')?.value || '14', 10);
      recipientFormattedTime = new Intl.DateTimeFormat('en-US', {
        timeZone: recipientTz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short',
      }).format(new Date());
    } catch {
      recipientLocalHour = 23;
    }
  }
  const isRecipientSleeping = recipientTz && (recipientLocalHour >= 21 || recipientLocalHour < 8);

  const handleBodyChange = (e) => {
    const val = e.target.value;
    updateDraft(currentDraft.id, { body: val });

    // Detect slash command trigger
    const lines = val.split('\n');
    const lastLine = lines[lines.length - 1];
    if (lastLine.startsWith('/')) {
      setSlashMenuOpen(true);
    } else {
      setSlashMenuOpen(false);
    }
  };

  const insertSnippet = (snippet) => {
    const recipientFirstName = matchedContact?.name?.split(' ')[0] || recipientsList[0]?.split('@')[0] || 'there';
    const parsedContent = snippet.content.replace(/\{\{first_name\}\}/g, recipientFirstName);
    
    // Replace slash command on last line with snippet content
    const lines = bodyText.split('\n');
    lines.pop(); // remove the line with the slash command
    lines.push(parsedContent);
    const updated = lines.join('\n');
    updateDraft(currentDraft.id, { body: updated });
    setSlashMenuOpen(false);
  };

  const handleSend = () => {
    if (showMissingAttachmentSentinel) {
      alert('Missing Attachment Sentinel: You wrote "attached", but no files are attached. Please attach file or click "Send Anyway".');
      return;
    }
    queueSendDraft(currentDraft);
  };

  const handleAttachFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const newAtts = files.map(f => ({
      id: `att_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: f.name,
      size: `${Math.round(f.size / 1024)} KB`,
      type: f.name.split('.').pop(),
    }));
    updateDraft(currentDraft.id, {
      attachments: [...(currentDraft.attachments || []), ...newAtts],
    });
    setAttachmentWarningDismissed(true);
  };

  const handleScheduleSend = (preset) => {
    let date = new Date();
    if (preset === 'morning') {
      date.setDate(date.getDate() + 1);
      date.setHours(8, 30, 0, 0);
    } else if (preset === 'afternoon') {
      date.setDate(date.getDate() + 1);
      date.setHours(14, 0, 0, 0);
    }
    updateDraft(currentDraft.id, { scheduledFor: date.toISOString() });
    setScheduleDropdownOpen(false);
    queueSendDraft({ ...currentDraft, scheduledFor: date.toISOString() });
  };

  if (currentDraft.isMinimized) {
    return (
      <div className="fixed bottom-0 right-6 z-50 flex items-center gap-2 select-none">
        {activeDrafts.map((d) => (
          <div
            key={d.id}
            onClick={() => minimizeDraft(d.id)}
            className="h-10 px-4 rounded-t-xl bg-slate-900 text-white border-t border-l border-r border-slate-700 shadow-xl flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition text-xs font-medium"
          >
            <span className="truncate max-w-[140px]">{d.subject || 'New Message'}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeDraft(d.id); }}
              className="p-0.5 hover:text-slate-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-200 select-none ${
        isFocusComposer
          ? 'inset-8 max-w-4xl mx-auto rounded-2xl border border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#161922] shadow-2xl flex flex-col overflow-hidden'
          : 'bottom-0 right-6 w-[580px] rounded-t-2xl border-t border-l border-r border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#161922] shadow-2xl flex flex-col overflow-hidden max-h-[85vh]'
      }`}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAttachFiles}
        multiple
        className="hidden"
      />

      {/* Top Header Bar */}
      <div className="h-10 px-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
        {/* Draft Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-medium">
          {activeDrafts.map((d) => (
            <div
              key={d.id}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-md transition cursor-pointer ${
                d.id === currentDraft.id ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="truncate max-w-[130px]">{d.subject || 'New Message'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeDraft(d.id); }}
                className="hover:text-rose-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => minimizeDraft(currentDraft.id)}
            title="Minimize"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFocusComposer}
            title={isFocusComposer ? "Dock to Bottom" : "Full Focus Editorial (⌘⇧F)"}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            {isFocusComposer ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => closeDraft(currentDraft.id)}
            title="Discard Draft"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recipient Rows */}
      <div className="px-4 py-2 border-b border-[#E2E8F0] dark:border-[#222632] text-xs space-y-1.5 flex-shrink-0">
        {/* To: row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-slate-400 font-medium w-8">To:</span>
            <input
              type="text"
              placeholder="recipient@domain.com..."
              value={currentDraft.to}
              onChange={(e) => updateDraft(currentDraft.id, { to: e.target.value })}
              className="flex-1 bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            {!showCc && (
              <button onClick={() => setShowCc(true)} className="hover:text-slate-600 dark:hover:text-slate-200">
                Cc
              </button>
            )}
            {!showBcc && (
              <button onClick={() => setShowBcc(true)} className="hover:text-slate-600 dark:hover:text-slate-200">
                Bcc
              </button>
            )}
          </div>
        </div>

        {/* External domain warning badge */}
        {hasExternalRecipient && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span>External Recipient Domain Detected</span>
          </div>
        )}

        {/* Optional Cc / Bcc */}
        {showCc && (
          <div className="flex items-center gap-2 pt-1 border-t border-[#E2E8F0]/50 dark:border-[#222632]/50">
            <span className="text-slate-400 font-medium w-8">Cc:</span>
            <input
              type="text"
              placeholder="teammates@acme.dev..."
              value={currentDraft.cc}
              onChange={(e) => updateDraft(currentDraft.id, { cc: e.target.value })}
              className="flex-1 bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none"
            />
          </div>
        )}

        {/* Subject input */}
        <div className="flex items-center gap-2 pt-1.5 border-t border-[#E2E8F0]/50 dark:border-[#222632]/50">
          <span className="text-slate-400 font-medium w-8">Sub:</span>
          <input
            type="text"
            placeholder="Subject..."
            value={currentDraft.subject}
            onChange={(e) => updateDraft(currentDraft.id, { subject: e.target.value })}
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Recipient Timezone & Quiet-Hours Banner */}
      {isRecipientSleeping && (
        <div className="px-4 py-2 bg-indigo-500/10 dark:bg-indigo-950/40 border-b border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between flex-shrink-0 animate-slide-down">
          <div className="flex items-center gap-2">
            <Moon className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>
              🌙 It's {recipientFormattedTime} for {matchedContact?.name?.split(' ')[0] || 'the recipient'}.
            </span>
          </div>

          <button
            onClick={() => handleScheduleSend('morning')}
            className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] shadow-xs transition"
          >
            Schedule for 8:30 AM
          </button>
        </div>
      )}

      {/* Pre-Flight Safety Linter Sentinel */}
      {showMissingAttachmentSentinel && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between flex-shrink-0 animate-slide-down">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>
              📎 Missing Attachment Sentinel: You wrote "{mentionsAttachment ? 'attached' : 'PDF'}", but no files are attached.
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-0.5 rounded bg-amber-600 text-white font-medium text-[11px] hover:bg-amber-700 transition"
            >
              + Attach File
            </button>
            <button
              onClick={() => setAttachmentWarningDismissed(true)}
              className="px-2 py-0.5 rounded border border-amber-500/40 hover:bg-amber-500/20 text-[11px] transition"
            >
              Send Anyway
            </button>
          </div>
        </div>
      )}

      {/* Editorial Body Viewport & Slash Command Popover */}
      <div className="flex-1 p-4 relative flex flex-col overflow-y-auto">
        <textarea
          ref={bodyTextareaRef}
          value={currentDraft.body}
          onChange={handleBodyChange}
          placeholder="Write your email here... Type / for reusable snippets (/intro, /pricing, /calendly)..."
          className="flex-1 w-full bg-transparent border-none text-slate-800 dark:text-slate-200 placeholder-slate-400 text-sm leading-relaxed resize-none focus:outline-none min-h-[160px]"
        />

        {/* Slash Snippets Menu */}
        {slashMenuOpen && (
          <div className="absolute bottom-16 left-4 z-40 w-72 bg-white dark:bg-[#1A1D27] border border-[#E2E8F0] dark:border-[#222632] rounded-xl shadow-2xl p-2 text-xs animate-slide-up">
            <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Insert Snippet</span>
            </div>
            <div className="space-y-1 mt-1">
              {snippets.map((snp) => (
                <button
                  key={snp.id}
                  onClick={() => insertSnippet(snp)}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left flex items-center justify-between text-slate-700 dark:text-slate-200 transition"
                >
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{snp.shortcut}</span>
                  <span className="truncate text-slate-400 ml-2">{snp.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attached Files Strip */}
        {currentDraft.attachments?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#222632] flex items-center gap-2 flex-wrap">
            {currentDraft.attachments.map((att, i) => (
              <div
                key={att.id || i}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-[#E2E8F0] dark:border-[#222632] text-xs"
              >
                <Paperclip className="w-3 h-3 text-blue-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">{att.name}</span>
                <span className="text-[10px] text-slate-400">({att.size})</span>
                <button
                  onClick={() => {
                    const remaining = currentDraft.attachments.filter((_, idx) => idx !== i);
                    updateDraft(currentDraft.id, { attachments: remaining });
                  }}
                  className="hover:text-rose-500 ml-1 text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Composer Footer Bar */}
      <div className="h-14 px-4 bg-slate-50 dark:bg-[#101217] border-t border-[#E2E8F0] dark:border-[#222632] flex items-center justify-between flex-shrink-0">
        {/* Left Split Primary CTA & Boomerang Reminder */}
        <div className="flex items-center gap-2">
          {/* Split Send CTA */}
          <div className="relative inline-flex rounded-lg shadow-sm">
            <button
              onClick={handleSend}
              className="px-3.5 py-1.5 rounded-l-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 active:scale-[0.99] transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
              <kbd className="text-[10px] font-mono bg-blue-700/60 px-1 rounded ml-1">⌘Enter</kbd>
            </button>

            <button
              onClick={() => setScheduleDropdownOpen(!scheduleDropdownOpen)}
              className="px-2 py-1.5 rounded-r-lg bg-blue-600 hover:bg-blue-700 text-white border-l border-blue-500 flex items-center transition"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Schedule Send Popover */}
            {scheduleDropdownOpen && (
              <div className="absolute bottom-10 left-0 z-50 w-52 bg-white dark:bg-[#1A1D27] border border-[#E2E8F0] dark:border-[#222632] rounded-xl shadow-2xl p-1 text-xs animate-slide-up">
                <button
                  onClick={() => handleScheduleSend('morning')}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Tomorrow Morning (8:30 AM)
                </button>
                <button
                  onClick={() => handleScheduleSend('afternoon')}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Tomorrow Afternoon (2:00 PM)
                </button>
              </div>
            )}
          </div>

          {/* Boomerang / Reply Reminder Checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none ml-2">
            <input
              type="checkbox"
              checked={currentDraft.remindNoReply}
              onChange={(e) => updateDraft(currentDraft.id, { remindNoReply: e.target.checked })}
              className="rounded text-blue-600 focus:ring-0"
            />
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Remind in 3d if no reply</span>
          </label>
        </div>

        {/* Right Tools: Attach, Snippets, Discard */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach Files"
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSlashMenuOpen(!slashMenuOpen)}
            title="Snippets (/)"
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={() => closeDraft(currentDraft.id)}
            title="Discard Draft"
            className="p-2 rounded-lg hover:bg-rose-500/15 hover:text-rose-600 text-slate-400 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

