import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Check, 
  Newspaper, 
  Receipt, 
  Ban, 
  X
} from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

export function ScreenerModal() {
  const { isScreenerOpen, setScreenerOpen, approveSender, blockSender } = useMailStore();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const pendingSenders = useLiveQuery(
    () => db.screener.where({ status: 'pending' }).toArray()
  ) || [];

  if (!isScreenerOpen) return null;

  const currentItem = pendingSenders[selectedIndex] || pendingSenders[0];

  const handleAction = async (actionType) => {
    if (!currentItem) return;
    
    if (actionType === 'primary') {
      await approveSender(currentItem.id, 'focused');
    } else if (actionType === 'newsletters') {
      await approveSender(currentItem.id, 'feed');
    } else if (actionType === 'receipts') {
      await approveSender(currentItem.id, 'paper_trail');
    } else if (actionType === 'block') {
      await blockSender(currentItem.id);
    }

    if (selectedIndex >= pendingSenders.length - 1) {
      setSelectedIndex(Math.max(0, pendingSenders.length - 2));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-white dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#222632] flex items-center justify-between bg-amber-500/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>The Screener Gate &bull; First-Time Senders</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold">
                  {pendingSenders.length} Remaining
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You control who gets through. Unknown senders are queued here until explicitly approved.
              </p>
            </div>
          </div>

          <button
            onClick={() => setScreenerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {pendingSenders.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-3">
              <Check className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
              All First-Time Senders Screened!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              Your inbox boundaries are intact. Future emails from approved senders will automatically route to their designated horizon.
            </p>
            <button
              onClick={() => setScreenerOpen(false)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition"
            >
              Return to Inbox
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Sender Hero Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#101217] border border-[#E2E8F0] dark:border-[#222632] space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center text-sm shadow-sm">
                    {currentItem.sender_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {currentItem.sender_name}
                      </h4>
                      <span className="text-xs font-mono text-slate-400">
                        &lt;{currentItem.sender_email}&gt;
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Domain: <strong className="text-slate-700 dark:text-slate-300">@{currentItem.sender_domain}</strong></span>
                      &bull;
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-600 dark:text-purple-400">
                        {currentItem.detected_type}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(currentItem.received_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>

              {/* Email Subject & Snippet Preview */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632] space-y-2">
                <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  Subject: {currentItem.preview_subject}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  "{currentItem.preview_snippet}"
                </p>
              </div>

              {/* Triage Decision Buttons */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Decide Once for All Future Emails from @{currentItem.sender_domain}:
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleAction('primary')}
                    className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium flex flex-col items-center gap-1.5 transition text-center"
                  >
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
                    <span>Approve to Primary</span>
                    <span className="text-[10px] opacity-75 font-normal">VIP / Focused inbox</span>
                  </button>

                  <button
                    onClick={() => handleAction('newsletters')}
                    className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium flex flex-col items-center gap-1.5 transition text-center"
                  >
                    <Newspaper className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Route to Newsletters</span>
                    <span className="text-[10px] opacity-75 font-normal">The Feed reading stream</span>
                  </button>

                  <button
                    onClick={() => handleAction('receipts')}
                    className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex flex-col items-center gap-1.5 transition text-center"
                  >
                    <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Route to Receipts</span>
                    <span className="text-[10px] opacity-75 font-normal">Paper Trail bundle</span>
                  </button>

                  <button
                    onClick={() => handleAction('block')}
                    className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium flex flex-col items-center gap-1.5 transition text-center"
                  >
                    <Ban className="w-5 h-5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                    <span>Block & Screen Out</span>
                    <span className="text-[10px] opacity-75 font-normal">Never interrupt again</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Carousel navigation if multiple items */}
            {pendingSenders.length > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-[#222632] text-xs text-slate-500">
                <span>Sender {selectedIndex + 1} of {pendingSenders.length}</span>
                <div className="flex items-center gap-1">
                  {pendingSenders.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedIndex(i)}
                      className={`w-2 h-2 rounded-full transition ${
                        i === selectedIndex ? 'bg-blue-600 w-4' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

