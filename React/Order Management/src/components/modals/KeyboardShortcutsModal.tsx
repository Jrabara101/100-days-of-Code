import React from 'react';
import { X, Keyboard, Zap } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isKeyboardGuideOpen, setIsKeyboardGuideOpen } = useOrders();

  if (!isKeyboardGuideOpen) return null;

  const shortcuts = [
    { key: 'J / ↓', desc: 'Navigate down through high-density order ledger' },
    { key: 'K / ↑', desc: 'Navigate up through high-density order ledger' },
    { key: 'Space / ↵', desc: 'Open Order 360° Inspector drawer' },
    { key: 'P', desc: 'Open Scan-to-Pack Station or Buy optimal shipping label' },
    { key: 'S', desc: 'Open interactive Split-Shipment Orchestrator' },
    { key: 'A', desc: '1-Click Approve Hold / Accept USPS Address Match / Release Grace' },
    { key: '⌘K / Ctrl+K', desc: 'Global Omni-Command Palette (Orders, SKUs, Views)' },
    { key: 'Esc', desc: 'Close any open drawer or modal dialog' },
    { key: '?', desc: 'Toggle this keyboard shortcut guide' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsKeyboardGuideOpen(false)}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 select-none transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-divider-light dark:border-divider-dark flex items-center justify-between bg-surface-secondary-light dark:bg-surface-secondary-dark">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-brand-primary" />
            <div className="text-sm font-bold font-display text-slate-900 dark:text-white">
              Linear-Speed Keyboard Shortcuts
            </div>
          </div>
          <button
            onClick={() => setIsKeyboardGuideOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-6 divide-y divide-divider-light dark:divide-divider-dark text-xs font-mono">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-sans">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-[11px]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-divider-light dark:border-divider-dark bg-surface-secondary-light dark:bg-surface-secondary-dark text-center text-[11px] font-mono text-slate-400">
          Built for zero-mouse operations triage at 60 FPS
        </div>
      </div>
    </div>
  );
};

