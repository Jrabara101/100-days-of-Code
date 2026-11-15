import React, { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

export function LabelPickerPopover({ threadId, onClose }) {
  const { assignLabel, removeLabel } = useMailStore();
  const [search, setSearch] = useState('');
  const labels = useLiveQuery(() => db.labels.toArray()) || [];
  const thread = useLiveQuery(() => db.threads.get(threadId), [threadId]);

  const threadLabels = thread?.labels || [];

  const filteredLabels = labels.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.slug.toLowerCase().includes(search.toLowerCase())
  );

  const toggleLabel = (slug) => {
    if (threadLabels.includes(slug)) {
      removeLabel(threadId, slug);
    } else {
      assignLabel(threadId, slug);
    }
  };

  return (
    <div 
      className="absolute top-8 right-0 z-50 w-64 bg-white dark:bg-[#1A1D27] border border-[#E2E8F0] dark:border-[#222632] rounded-xl shadow-2xl p-2 text-xs animate-slide-down"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0] dark:border-[#222632] text-slate-500 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-blue-500" />
          Assign Label
        </span>
        <button onClick={onClose} className="p-0.5 hover:text-slate-800 dark:hover:text-slate-200">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <input
        type="text"
        placeholder="Search or create label..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] bg-slate-50 dark:bg-[#101217] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
      />

      <div className="max-h-48 overflow-y-auto space-y-1">
        {filteredLabels.map((lbl, idx) => {
          const isSelected = threadLabels.includes(lbl.slug);
          return (
            <button
              key={lbl.id}
              onClick={() => toggleLabel(lbl.slug)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-left transition"
            >
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: lbl.color_hex }}
                />
                <span className="font-medium">{lbl.name}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {idx < 9 && (
                  <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">
                    {idx + 1}
                  </kbd>
                )}
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-blue-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

