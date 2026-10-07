import React, { useState } from 'react';
import { History, X, RotateCcw, Clock, Check, FileText } from 'lucide-react';

export const RevisionHistoryModal = ({ 
  isOpen, 
  onClose, 
  revisions = [], 
  onRestore 
}) => {
  const [selectedRevId, setSelectedRevId] = useState(revisions[0]?.id || null);

  if (!isOpen) return null;

  const selectedRev = revisions.find(r => r.id === selectedRevId) || revisions[0];

  const handleRestore = () => {
    if (selectedRev) {
      if (window.confirm('Restore this revision snapshot? Current editor state will be backed up as a new snapshot.')) {
        onRestore(selectedRev);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-[#1B1C21] rounded-3xl shadow-2xl border border-[#E5E5DF] dark:border-[#26272C] overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#18181B] dark:text-[#F4F4F6]">
                Revision Snapshots &amp; Restoration
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#9496A1]">
                Continuous local and cloud journals protect every paragraph from accidental loss.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Detail View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Snapshots Sidebar */}
          <div className="w-72 border-r border-[#E5E5DF] dark:border-[#26272C] overflow-y-auto p-3 space-y-1 bg-[#FAFAF8] dark:bg-[#141518]">
            <h5 className="px-2 py-1 font-mono uppercase tracking-wider text-[10px] text-[#71717A] dark:text-[#9496A1] font-semibold">
              Saved Snapshots ({revisions.length})
            </h5>

            {revisions.length === 0 ? (
              <p className="p-4 text-xs text-[#71717A] dark:text-[#9496A1] italic">
                No past revisions journaled yet.
              </p>
            ) : (
              revisions.map((rev, idx) => {
                const isSelected = rev.id === (selectedRev?.id || selectedRevId);
                const date = new Date(rev.timestamp);

                return (
                  <button
                    key={rev.id}
                    onClick={() => setSelectedRevId(rev.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-[#1B1C21] shadow-xs border border-[#E5E5DF] dark:border-[#26272C] ring-1 ring-black/5 dark:ring-white/5'
                        : 'hover:bg-white/60 dark:hover:bg-[#1B1C21]/60 text-[#71717A] dark:text-[#9496A1]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="font-semibold text-[#18181B] dark:text-[#F4F4F6]">
                        {idx === 0 ? 'Latest Snapshot' : `Version ${revisions.length - idx}`}
                      </span>
                      <span>
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-serif text-[#18181B] dark:text-[#F4F4F6] truncate">
                      {rev.title || 'Untitled Draft'}
                    </p>
                    <p className="text-[10px] text-[#71717A] dark:text-[#9496A1] font-mono mt-1">
                      {date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · {rev.note || 'Auto snapshot'}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Snapshot Content Preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1B1C21]">
            {selectedRev ? (
              <>
                <div className="p-4 border-b border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-between bg-[#F3F3EE]/40 dark:bg-[#141518]/40">
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#18181B] dark:text-[#F4F4F6]">
                      {selectedRev.title}
                    </h4>
                    <span className="text-[11px] font-mono text-[#71717A] dark:text-[#9496A1]">
                      Captured on {new Date(selectedRev.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={handleRestore}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore This Snapshot</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {selectedRev.excerpt && (
                    <div className="p-3 rounded-xl bg-[#F3F3EE] dark:bg-[#141518] text-xs font-serif italic text-[#71717A] dark:text-[#9496A1]">
                      Excerpt: {selectedRev.excerpt}
                    </div>
                  )}

                  <pre className="font-mono text-xs text-[#18181B] dark:text-[#F4F4F6] whitespace-pre-wrap leading-relaxed select-text">
                    {selectedRev.content}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[#71717A]">
                Select a revision to preview
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-between text-xs font-mono text-[#71717A] dark:text-[#9496A1]">
          <span>Snapshot journal retains up to 15 recent milestones</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#E5E5DF] dark:border-[#26272C] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
