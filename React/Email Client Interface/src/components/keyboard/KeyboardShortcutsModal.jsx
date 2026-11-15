import React from 'react';
import { X, Command } from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';

export function KeyboardShortcutsModal() {
  const { isShortcutsOpen, setShortcutsOpen } = useMailStore();

  if (!isShortcutsOpen) return null;

  const shortcutGroups = [
    {
      title: 'High-Velocity Triage',
      shortcuts: [
        { key: 'J / K', desc: 'Step down / up through thread list' },
        { key: 'Enter', desc: 'Open / expand selected conversation' },
        { key: 'E', desc: 'Mark Done / Archive thread' },
        { key: 'H', desc: 'Snooze thread (Tomorrow, Weekend, Next Week)' },
        { key: 'L', desc: 'Assign color-coded labels' },
        { key: 'U', desc: 'Toggle read / unread' },
        { key: '⌘ + ⇧ + U', desc: '1-Click Unsubscribe + Archive All Past' },
      ],
    },
    {
      title: 'Compose & Reply',
      shortcuts: [
        { key: 'C', desc: 'New compose draft' },
        { key: 'R', desc: 'Quick Reply to last message' },
        { key: 'A', desc: 'Reply All to all participants' },
        { key: 'F', desc: 'Forward conversation' },
        { key: '⌘ + Enter', desc: 'Send draft (enters 15s undo grace window)' },
        { key: 'Z', desc: 'Instant Undo Send' },
        { key: '⌘ + ⇧ + F', desc: 'Toggle Full-Focus Editorial Canvas' },
        { key: '/', desc: 'Trigger reusable slash snippets (/intro, /pricing)' },
      ],
    },
    {
      title: 'Command Center & Navigation',
      shortcuts: [
        { key: '⌘ + K  or  /', desc: 'Instant Faceted Search & Attachment Vault' },
        { key: 'Esc', desc: 'Close modals, drawers, or dismiss focus' },
        { key: '?', desc: 'Toggle this keyboard shortcut HUD' },
      ],
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in select-none"
      onClick={() => setShortcutsOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#222632] flex items-center justify-between bg-slate-50/50 dark:bg-[#101217]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Keyboard-First Command Shortcuts</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold">
                  100+ WPM
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Navigate, triage, and compose without leaving the home row.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShortcutsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="p-6 overflow-y-auto space-y-6">
          {shortcutGroups.map((grp) => (
            <div key={grp.title} className="space-y-2">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {grp.title}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {grp.shortcuts.map((sc, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#222632] bg-slate-50 dark:bg-[#101217] flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {sc.desc}
                    </span>
                    <kbd className="px-2 py-1 rounded bg-white dark:bg-[#1A1D27] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-semibold shadow-2xs">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

