import React, { useEffect } from 'react';
import { Sparkles, Command, Mail, Clock, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useMailStore } from '../../store/useMailStore';

export function InboxZeroHorizon({ horizonTitle = 'Focused' }) {
  const { stats, openComposer, setSearchPaletteOpen } = useMailStore();

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'],
      });
    } catch {
      // Confetti fallback
    }
  };

  useEffect(() => {
    triggerConfetti();
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none animate-fade-in">
      <div 
        onClick={triggerConfetti}
        className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/20 via-emerald-500/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center mb-4 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
      >
        <Sparkles className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-pulse" />
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        ✨ {horizonTitle} Inbox Zero
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        All caught up! You cleared <strong className="text-slate-700 dark:text-slate-200">{stats.clearedToday} threads</strong> today with sub-50ms velocity.
      </p>

      {/* Triage Stats Pill */}
      <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632] text-xs font-medium text-slate-600 dark:text-slate-400 mb-6">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{stats.clearedToday} Archived</span>
        </div>
        <div className="w-1 h-3 bg-slate-300 dark:bg-slate-700 rounded-full" />
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>5 Snoozed for Later</span>
        </div>
      </div>

      {/* Quick Action Suggestions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => openComposer()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>New Message</span>
          <kbd className="text-[10px] bg-blue-700/60 px-1 rounded">C</kbd>
        </button>

        <button
          onClick={() => setSearchPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
        >
          <Command className="w-3.5 h-3.5 text-slate-400" />
          <span>Search Archive</span>
          <kbd className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded">⌘K</kbd>
        </button>
      </div>
    </div>
  );
}

