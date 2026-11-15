import React from 'react';
import { Calendar, Moon, Sun, Sunrise, X } from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';

export function SnoozePickerPopover({ threadId, onClose }) {
  const { snoozeThread } = useMailStore();

  const handleSnooze = (preset) => {
    const now = new Date();
    let target = new Date();

    if (preset === 'later_today') {
      target.setHours(18, 0, 0, 0);
    } else if (preset === 'tomorrow') {
      target.setDate(now.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else if (preset === 'weekend') {
      const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
      target.setDate(now.getDate() + daysUntilSaturday);
      target.setHours(10, 0, 0, 0);
    } else if (preset === 'next_week') {
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      target.setDate(now.getDate() + daysUntilMonday);
      target.setHours(9, 0, 0, 0);
    }

    snoozeThread(threadId, target.toISOString());
    onClose?.();
  };

  return (
    <div 
      className="absolute top-8 right-0 z-50 w-64 bg-white dark:bg-[#1A1D27] border border-[#E2E8F0] dark:border-[#222632] rounded-xl shadow-2xl p-2 text-xs animate-slide-down"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#E2E8F0] dark:border-[#222632] text-slate-500 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          Snooze Thread
        </span>
        <button onClick={onClose} className="p-0.5 hover:text-slate-800 dark:hover:text-slate-200">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1">
        <button
          onClick={() => handleSnooze('later_today')}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Later Today</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">6:00 PM</span>
        </button>

        <button
          onClick={() => handleSnooze('tomorrow')}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Sunrise className="w-3.5 h-3.5 text-blue-500" />
            <span>Tomorrow Morning</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">9:00 AM</span>
        </button>

        <button
          onClick={() => handleSnooze('weekend')}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>This Weekend</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Sat 10:00 AM</span>
        </button>

        <button
          onClick={() => handleSnooze('next_week')}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span>Next Monday</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">9:00 AM</span>
        </button>
      </div>

      <div className="mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#222632]">
        <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between px-1">
          <span>Natural keyboard hint</span>
          <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">H</kbd>
        </div>
      </div>
    </div>
  );
}

