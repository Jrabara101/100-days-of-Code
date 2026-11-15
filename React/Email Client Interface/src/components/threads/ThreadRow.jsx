import React, { useState } from 'react';
import { 
  Star, 
  Check, 
  Clock, 
  Tag, 
  Mail, 
  MailOpen, 
  Trash2, 
  Paperclip, 
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';
import { SnoozePickerPopover } from './SnoozePickerPopover';
import { LabelPickerPopover } from '../labels/LabelPickerPopover';

export function ThreadRow({ 
  thread, 
  isSelected, 
  isFocusedCursor, 
  isChecked, 
  onSelect, 
  onToggleCheck, 
  labelsMap = {},
  density = 'comfortable'
}) {
  const {
    markDone,
    toggleStar,
    toggleUnread,
    trashThread,
    labelPickerThreadId,
    setLabelPickerThreadId,
    snoozePickerThreadId,
    setSnoozePickerThreadId,
  } = useMailStore();

  const [isHovered, setIsHovered] = useState(false);

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isOverdue = thread.needs_reply_reminder_at && new Date(thread.needs_reply_reminder_at) < new Date();

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      className={`relative w-full border-b border-[#E2E8F0]/60 dark:border-[#222632]/60 px-3 flex items-center gap-3 transition-colors duration-100 cursor-pointer select-none group ${
        density === 'compact' ? 'h-[44px]' : 'h-[64px]'
      } ${
        isFocusedCursor 
          ? 'bg-blue-500/10 dark:bg-blue-500/15 border-l-2 border-l-blue-500' 
          : isSelected 
            ? 'bg-slate-200/60 dark:bg-[#161922]' 
            : 'hover:bg-slate-100/70 dark:hover:bg-[#12151D]'
      }`}
    >
      {/* Popovers */}
      {snoozePickerThreadId === thread.id && (
        <SnoozePickerPopover 
          threadId={thread.id} 
          onClose={() => setSnoozePickerThreadId(null)} 
        />
      )}
      {labelPickerThreadId === thread.id && (
        <LabelPickerPopover 
          threadId={thread.id} 
          onClose={() => setLabelPickerThreadId(null)} 
        />
      )}

      {/* Left Cluster */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Multi-select Checkbox */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck(e.shiftKey);
          }}
          className={`w-4 h-4 rounded border flex items-center justify-center transition-opacity ${
            isChecked 
              ? 'opacity-100 bg-blue-600 border-blue-600 text-white' 
              : isHovered 
                ? 'opacity-80 border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800' 
                : 'opacity-0'
          }`}
        >
          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
        </div>

        {/* Unread Cobalt Dot */}
        <div className="w-2 flex justify-center">
          {thread.is_unread && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-sm shadow-blue-500" />
          )}
        </div>

        {/* Star Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStar(thread.id);
          }}
          className={`p-0.5 rounded transition ${
            thread.is_starred 
              ? 'text-amber-400' 
              : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${thread.is_starred ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Sender Name + VIP Ring */}
        <div className="w-36 flex items-center gap-1.5 truncate">
          {thread.primary_sender?.is_vip && (
            <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />
          )}
          <span className={`truncate text-xs ${
            thread.is_unread 
              ? 'font-semibold text-slate-900 dark:text-slate-100' 
              : 'font-normal text-slate-600 dark:text-slate-300'
          }`}>
            {thread.primary_sender?.name || thread.subject}
          </span>
          {thread.message_count > 1 && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex-shrink-0">
              {thread.message_count}
            </span>
          )}
        </div>
      </div>

      {/* Center Cluster: Labels, Subject & Snippet */}
      <div className="flex-1 flex items-center gap-2 overflow-hidden min-w-0">
        {/* Semantic Label Pills */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {(thread.labels || []).map((slug) => {
            const labelObj = labelsMap[slug];
            if (!labelObj) return null;
            return (
              <span
                key={slug}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{
                  backgroundColor: `${labelObj.color_hex}1A`,
                  color: labelObj.color_hex,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: labelObj.color_hex }} />
                {labelObj.name}
              </span>
            );
          })}
        </div>

        {/* Subject & Snippet */}
        <div className="truncate text-xs flex items-center gap-1.5 min-w-0">
          <span className={`${thread.is_unread ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
            {thread.subject}
          </span>
          <span className="text-slate-400 dark:text-slate-500 truncate">
            — {thread.snippet}
          </span>
        </div>

        {/* Attachment Micro-chip */}
        {thread.has_attachments && (
          <div className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Paperclip className="w-3 h-3 text-slate-400" />
            <span className="max-w-[90px] truncate">{thread.sample_attachment?.name || 'File'}</span>
          </div>
        )}
      </div>

      {/* Right Cluster: Timestamp vs Hover Speed Bar */}
      <div className="flex-shrink-0 relative h-7 flex items-center justify-end min-w-[80px]">
        {/* Default View (Timestamp / Badge) */}
        <div className={`transition-opacity duration-150 flex items-center gap-1.5 ${isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {isOverdue && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Overdue</span>
            </span>
          )}
          {thread.snoozed_until && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Snoozed</span>
            </span>
          )}
          <span className="text-[11px] tabular-nums font-mono text-slate-400 dark:text-slate-500">
            {formatTimestamp(thread.last_message_at)}
          </span>
        </div>

        {/* Hover Speed Bar (5 speed actions) */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-0 top-0 bottom-0 flex items-center gap-0.5 bg-white/95 dark:bg-[#161922]/95 backdrop-blur-md px-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] shadow-sm transition-opacity duration-150 ${
            isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={() => markDone(thread.id)}
            title="Mark Done / Archive (E)"
            className="p-1.5 rounded hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-500 transition"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSnoozePickerThreadId(thread.id)}
            title="Snooze (H)"
            className="p-1.5 rounded hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 text-slate-500 transition"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLabelPickerThreadId(thread.id)}
            title="Assign Label (L)"
            className="p-1.5 rounded hover:bg-purple-500/15 hover:text-purple-600 dark:hover:text-purple-400 text-slate-500 transition"
          >
            <Tag className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => toggleUnread(thread.id)}
            title="Toggle Unread (U)"
            className="p-1.5 rounded hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 text-slate-500 transition"
          >
            {thread.is_unread ? <MailOpen className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => trashThread(thread.id)}
            title="Move to Trash"
            className="p-1.5 rounded hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

