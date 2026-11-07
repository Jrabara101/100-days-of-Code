import React from 'react';
import { X, MoonStar, Check, Clock } from 'lucide-react';
import { usePodcast } from '../context/PodcastContext';

export const SleepTimerModal: React.FC = () => {
  const { 
    isSleepTimerModalOpen, 
    setIsSleepTimerModalOpen, 
    setSleepTimer, 
    sleepTimerRemainingSec 
  } = usePodcast();

  if (!isSleepTimerModalOpen) return null;

  const timerOptions = [
    { label: '15 Minutes', mins: 15 },
    { label: '20-Min Wind-Down', mins: 20 },
    { label: '30-Min Commute Window', mins: 30 },
    { label: '45 Minutes', mins: 45 },
    { label: '60 Minutes', mins: 60 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm glass-modal rounded-3xl border border-[var(--border-hairline-strong)] p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <MoonStar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Smart Wind-Down Timer
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Gently pauses audio after your set window.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSleepTimerModalOpen(false)}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status */}
        {sleepTimerRemainingSec !== null && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono-tabular">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Clock className="w-4 h-4 animate-spin" />
              <span>{Math.floor(sleepTimerRemainingSec / 60)}m {sleepTimerRemainingSec % 60}s remaining</span>
            </div>
            <button
              onClick={() => setSleepTimer(null)}
              className="px-2 py-1 rounded-lg bg-neutral-800 text-[var(--text-muted)] hover:text-rose-400 text-[11px] font-bold"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          {timerOptions.map((opt) => (
            <button
              key={opt.mins}
              onClick={() => {
                setSleepTimer(opt.mins);
                setIsSleepTimerModalOpen(false);
              }}
              className="w-full p-3 rounded-xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] hover:border-amber-500/40 text-left text-xs font-semibold text-[var(--text-primary)] hover:text-amber-400 flex items-center justify-between transition-colors group"
            >
              <span>{opt.label}</span>
              <span className="font-mono-tabular text-[11px] text-[var(--text-muted)] group-hover:text-amber-500">
                +{opt.mins}m
              </span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
