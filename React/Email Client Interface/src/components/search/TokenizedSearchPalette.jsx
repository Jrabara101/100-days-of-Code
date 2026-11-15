import React from 'react';
import { 
  Search, 
  X, 
  Paperclip, 
  Mail, 
  Sparkles, 
  FileText, 
  ArrowRight,
  Download,
  Sliders,
  ShieldAlert,
  Moon
} from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

export function TokenizedSearchPalette() {
  const {
    isSearchPaletteOpen,
    setSearchPaletteOpen,
    searchQuery,
    setSearchQuery,
    searchTokens,
    addSearchToken,
    removeSearchToken,
    searchMode,
    setSearchMode,
    searchLatencyMs,
    setSelectedThreadId,
    openComposer,
    setScreenerOpen,
    setRuleStudioOpen,
    toggleTheme,
  } = useMailStore();

  const allThreads = useLiveQuery(() => db.threads.toArray()) || [];
  const allMessages = useLiveQuery(() => db.messages.toArray()) || [];

  if (!isSearchPaletteOpen) return null;

  // Filter threads based on tokens and search query
  const matchingThreads = allThreads.filter((t) => {
    // Check tokens
    for (const token of searchTokens) {
      if (token.key === 'from') {
        const match = t.primary_sender?.name.toLowerCase().includes(token.value.toLowerCase()) ||
                      t.primary_sender?.email.toLowerCase().includes(token.value.toLowerCase());
        if (!match) return false;
      }
      if (token.key === 'label') {
        if (!t.labels?.includes(token.value.toLowerCase())) return false;
      }
      if (token.key === 'has' && token.value === 'attachment') {
        if (!t.has_attachments) return false;
      }
      if (token.key === 'is') {
        if (token.value === 'unread' && !t.is_unread) return false;
        if (token.value === 'starred' && !t.is_starred) return false;
      }
    }

    // Cleaned text keyword search
    const cleanQuery = searchQuery.replace(/(\b(from|to|label|has|is|filename|after|before):[^\s]+)/gi, '').trim().toLowerCase();
    if (!cleanQuery) return true;

    return (
      t.subject.toLowerCase().includes(cleanQuery) ||
      t.snippet.toLowerCase().includes(cleanQuery) ||
      t.primary_sender?.name.toLowerCase().includes(cleanQuery) ||
      t.primary_sender?.email.toLowerCase().includes(cleanQuery)
    );
  });

  // Extract all attachments from all messages for the Visual Attachment Vault
  const matchingAttachments = [];
  for (const msg of allMessages) {
    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        const cleanQuery = searchQuery.replace(/(\b(from|to|label|has|is|filename|after|before):[^\s]+)/gi, '').trim().toLowerCase();
        if (!cleanQuery || att.name.toLowerCase().includes(cleanQuery)) {
          matchingAttachments.push({
            ...att,
            threadId: msg.thread_id,
            sender: msg.from_participant,
            date: msg.created_at,
          });
        }
      }
    }
  }

  const handleSelectThread = (id) => {
    setSelectedThreadId(id);
    setSearchPaletteOpen(false);
  };

  const handleExecuteAction = (action) => {
    setSearchPaletteOpen(false);
    if (action === 'compose') openComposer();
    if (action === 'screener') setScreenerOpen(true);
    if (action === 'rules') setRuleStudioOpen(true);
    if (action === 'theme') toggleTheme();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-20 p-6 animate-fade-in select-none"
      onClick={() => setSearchPaletteOpen(false)}
    >
      <div 
        className="w-full max-w-3xl bg-white dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Tokenized Search Input Bar */}
        <div className="h-14 px-4 border-b border-[#E2E8F0] dark:border-[#222632] flex items-center gap-2 flex-shrink-0 bg-slate-50/50 dark:bg-[#101217]/50">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />

          {/* Active parsed token chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {searchTokens.map((token) => (
              <span
                key={token.key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-mono font-medium"
              >
                <span>{token.key}:{token.value}</span>
                <button
                  onClick={() => removeSearchToken(token.key)}
                  className="hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Freeform input */}
          <input
            type="text"
            placeholder={searchTokens.length === 0 ? "Search mail, from:elena, label:legal, has:attachment..." : "Add keywords..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none min-w-[140px]"
          />

          {/* Search Latency Monospace Badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] font-mono tabular-nums text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {matchingThreads.length} results in {searchLatencyMs}ms
            </span>
            <button
              onClick={() => setSearchPaletteOpen(false)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Filter Operator Suggestions Bar */}
        <div className="px-4 py-2 bg-slate-100/70 dark:bg-[#101217]/80 border-b border-[#E2E8F0] dark:border-[#222632] flex items-center gap-2 text-xs flex-wrap flex-shrink-0">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Quick Filters:
          </span>
          <button
            onClick={() => addSearchToken({ key: 'from', value: 'elena' })}
            className="px-2 py-0.5 rounded bg-white dark:bg-[#1A1D27] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
          >
            + from:elena
          </button>
          <button
            onClick={() => addSearchToken({ key: 'label', value: 'legal' })}
            className="px-2 py-0.5 rounded bg-white dark:bg-[#1A1D27] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
          >
            + label:legal
          </button>
          <button
            onClick={() => addSearchToken({ key: 'has', value: 'attachment' })}
            className="px-2 py-0.5 rounded bg-white dark:bg-[#1A1D27] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
          >
            + has:attachment
          </button>
          <button
            onClick={() => addSearchToken({ key: 'is', value: 'unread' })}
            className="px-2 py-0.5 rounded bg-white dark:bg-[#1A1D27] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
          >
            + is:unread
          </button>
        </div>

        {/* Dual-View Switcher Tabs */}
        <div className="px-4 border-b border-[#E2E8F0] dark:border-[#222632] flex items-center gap-4 text-xs font-medium flex-shrink-0">
          <button
            onClick={() => setSearchMode('threads')}
            className={`py-2.5 flex items-center gap-1.5 transition relative ${
              searchMode === 'threads' 
                ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Matching Threads ({matchingThreads.length})</span>
            {searchMode === 'threads' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>

          <button
            onClick={() => setSearchMode('attachments')}
            className={`py-2.5 flex items-center gap-1.5 transition relative ${
              searchMode === 'attachments' 
                ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Visual Attachment & Link Vault ({matchingAttachments.length})</span>
            {searchMode === 'attachments' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>

          <button
            onClick={() => setSearchMode('actions')}
            className={`py-2.5 flex items-center gap-1.5 transition relative ${
              searchMode === 'actions' 
                ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Actions</span>
            {searchMode === 'actions' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Mode A: Matching Threads */}
          {searchMode === 'threads' && (
            <div className="space-y-1">
              {matchingThreads.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching threads found for your query.
                </div>
              ) : (
                matchingThreads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-[#181C26] cursor-pointer transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3 truncate min-w-0 flex-1 pr-4">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-[11px] flex-shrink-0">
                        {thread.primary_sender?.name?.slice(0, 2).toUpperCase() || 'EM'}
                      </div>
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {thread.primary_sender?.name}
                          </span>
                          <span className="text-slate-400 font-normal">
                            &lt;{thread.primary_sender?.email}&gt;
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">
                          {thread.subject}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {thread.snippet}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {thread.has_attachments && (
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(thread.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Mode B: Visual Attachment & Link Vault Grid */}
          {searchMode === 'attachments' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {matchingAttachments.map((att, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#222632] bg-slate-50 dark:bg-[#101217] hover:border-blue-500/50 transition flex flex-col justify-between space-y-3"
                >
                  {/* File Icon & Thumbnail Preview */}
                  <div className="h-24 rounded-lg bg-white dark:bg-[#1A1D27] border border-[#E2E8F0] dark:border-[#222632] flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                    {att.preview_url ? (
                      <img src={att.preview_url} alt="" className="h-full w-full object-cover rounded" />
                    ) : (
                      <>
                        <FileText className="w-8 h-8 text-blue-500 mb-1" />
                        <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">{att.type} Document</span>
                      </>
                    )}
                  </div>

                  <div>
                    <h5 className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate" title={att.name}>
                      {att.name}
                    </h5>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {att.size} &bull; from {att.sender?.name?.split(' ')[0] || 'Unknown'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-[#222632] text-xs">
                    <button
                      onClick={() => handleSelectThread(att.threadId)}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium text-[11px]"
                    >
                      <span>Jump to Email</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => alert(`Downloading ${att.name}`)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mode C: Quick Actions */}
          {searchMode === 'actions' && (
            <div className="space-y-1">
              <button
                onClick={() => handleExecuteAction('compose')}
                className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#181C26] flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Compose New Message</span>
                </div>
                <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">C</kbd>
              </button>

              <button
                onClick={() => handleExecuteAction('screener')}
                className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#181C26] flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">Open First-Time Sender Screener</span>
                </div>
                <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">Review</kbd>
              </button>

              <button
                onClick={() => handleExecuteAction('rules')}
                className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#181C26] flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">Open Triage Rule Studio & Bundles</span>
                </div>
                <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">Rules</kbd>
              </button>

              <button
                onClick={() => handleExecuteAction('theme')}
                className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#181C26] flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium">Toggle Dark / Light Mode</span>
                </div>
                <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">T</kbd>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

