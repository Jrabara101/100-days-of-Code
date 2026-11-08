import React from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import { BarChart3, Check, CornerDownRight } from 'lucide-react';

export default function TemperatureCheck() {
  const { temperatureVote, temperatureStats, castTemperatureVote, jumpToComment } = useDiscussion();

  const total = temperatureStats.total || 1;
  const agreePercent = Math.round((temperatureStats.agree / total) * 100);
  const nuancedPercent = Math.round((temperatureStats.nuanced / total) * 100);
  const counterPercent = Math.round((temperatureStats.counter / total) * 100);

  return (
    <div className="w-full mb-5 p-4 rounded-2xl bg-salon-card border border-salon-border shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              The Temperature Check
            </h4>
            <p className="text-xs text-salon-ink-secondary">
              Log your preliminary stance before entering the discussion:
            </p>
          </div>
        </div>

        <span className="font-mono text-[11px] text-salon-ink-muted self-start sm:self-center">
          {total} reader responses
        </span>
      </div>

      {/* 3 Stance Pill Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {/* Option 1: Strongly Resonant */}
        <button
          onClick={() => castTemperatureVote('agree')}
          className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
            temperatureVote === 'agree'
              ? 'border-emerald-500 bg-emerald-500/[0.08] dark:bg-emerald-500/[0.14] ring-1 ring-emerald-500'
              : 'border-salon-border hover:border-emerald-300 bg-salon-nested/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-salon-ink-primary flex items-center gap-1.5">
              <span>🎯 Strongly Resonant</span>
              {temperatureVote === 'agree' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </span>
            <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {agreePercent}%
            </span>
          </div>
          <div className="w-full bg-salon-border/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${agreePercent}%` }} 
            />
          </div>
        </button>

        {/* Option 2: Nuanced / Mixed */}
        <button
          onClick={() => castTemperatureVote('nuanced')}
          className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
            temperatureVote === 'nuanced'
              ? 'border-indigo-500 bg-indigo-500/[0.08] dark:bg-indigo-500/[0.14] ring-1 ring-indigo-500'
              : 'border-salon-border hover:border-indigo-300 bg-salon-nested/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-salon-ink-primary flex items-center gap-1.5">
              <span>⚖️ Nuanced / Contextual</span>
              {temperatureVote === 'nuanced' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </span>
            <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400">
              {nuancedPercent}%
            </span>
          </div>
          <div className="w-full bg-salon-border/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${nuancedPercent}%` }} 
            />
          </div>
        </button>

        {/* Option 3: Skeptical / Counterpoint */}
        <button
          onClick={() => castTemperatureVote('counter')}
          className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
            temperatureVote === 'counter'
              ? 'border-rose-500 bg-rose-500/[0.08] dark:bg-rose-500/[0.14] ring-1 ring-rose-500'
              : 'border-salon-border hover:border-rose-300 bg-salon-nested/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-salon-ink-primary flex items-center gap-1.5">
              <span>🔄 Skeptical / Counter</span>
              {temperatureVote === 'counter' && <Check className="w-3.5 h-3.5 text-rose-600" />}
            </span>
            <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
              {counterPercent}%
            </span>
          </div>
          <div className="w-full bg-salon-border/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${counterPercent}%` }} 
            />
          </div>
        </button>
      </div>

      {/* Cross-tabulation Insight */}
      {temperatureVote && (
        <div className="pt-2 border-t border-salon-border/70 flex flex-wrap items-center justify-between gap-2 text-xs text-salon-ink-secondary">
          <span>
            {temperatureVote === 'agree' && "Your view aligns with the majority. Expand your horizon with the top counterpoint:"}
            {temperatureVote === 'nuanced' && "You value trade-offs. Marcus Sterling articulates operational constraints:"}
            {temperatureVote === 'counter' && "Valuable critical lens! Kofi Mensah explores real-time synchronization hazards:"}
          </span>
          <button
            onClick={() => jumpToComment(temperatureVote === 'agree' ? 'c-103' : 'c-101')}
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>Read Anchor Commentary</span>
            <CornerDownRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

