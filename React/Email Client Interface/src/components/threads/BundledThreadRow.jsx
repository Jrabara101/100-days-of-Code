import React, { useState } from 'react';
import { Package, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { ThreadRow } from './ThreadRow';
import { useMailStore } from '../../store/useMailStore';

export function BundledThreadRow({
  label,
  threads,
  selectedThreadId,
  focusedThreadId,
  checkedThreadIds,
  onSelectThread,
  onToggleCheck,
  labelsMap,
  density,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { markDone } = useMailStore();

  const sendersList = Array.from(new Set(threads.map(t => t.primary_sender?.name?.split(' ')[0] || 'Unknown'))).slice(0, 3).join(', ');
  const unreadCount = threads.filter(t => t.is_unread).length;

  const handleMarkAllDone = (e) => {
    e.stopPropagation();
    const ids = threads.map(t => t.id);
    markDone(ids);
  };

  return (
    <div className="border-b border-[#E2E8F0]/80 dark:border-[#222632]/80 bg-slate-50/70 dark:bg-[#13161F]/70">
      {/* Bundled Group Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-11 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 dark:hover:bg-[#181C26] transition select-none"
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Package className="w-3.5 h-3.5" />
            <span>{label.name}</span>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {threads.length} bundled messages
            </span>
            <span className="text-slate-400 dark:text-slate-500 ml-1.5">
              from {sendersList}
            </span>
          </div>

          {unreadCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllDone}
            title="Mark All Done in Bundle"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200/60 dark:bg-slate-800/60 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 text-[11px] font-medium transition"
          >
            <Check className="w-3 h-3" />
            <span>Mark All Done</span>
          </button>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Expanded Child Threads */}
      {isExpanded && (
        <div className="pl-4 border-l-2 border-emerald-500/40 ml-4 my-1 space-y-0.5 animate-slide-down">
          {threads.map((t) => (
            <ThreadRow
              key={t.id}
              thread={t}
              isSelected={selectedThreadId === t.id}
              isFocusedCursor={focusedThreadId === t.id}
              isChecked={checkedThreadIds.has(t.id)}
              onSelect={() => onSelectThread(t.id)}
              onToggleCheck={(shift) => onToggleCheck(t.id, shift)}
              labelsMap={labelsMap}
              density={density}
            />
          ))}
        </div>
      )}
    </div>
  );
}

