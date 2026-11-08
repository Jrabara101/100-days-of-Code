import React from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import { 
  Users, 
  Sparkles, 
  Sun, 
  Moon, 
  Columns, 
  AlignJustify, 
  Radio, 
  HelpCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function LivePresenceBar() {
  const { 
    onlineCount, 
    typingUsers, 
    isAuthorInRoom, 
    isAuthorTyping,
    filterUnansweredQuestions,
    setFilterUnansweredQuestions,
    contextMode,
    setContextMode,
    isDarkMode,
    setIsDarkMode,
    totalCommentsCount
  } = useDiscussion();

  const typingCount = typingUsers.length;

  return (
    <div className="w-full space-y-3 mb-6">
      {/* Top Bar: Live Presence, Mode Switcher, and Theme Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-salon-border">
        {/* Left: Section Title & Real-time Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-salon-ink-primary">
              Discussion
            </h2>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-salon-nested text-salon-ink-secondary border border-salon-border">
              {totalCommentsCount}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-salon-border hidden sm:block" />

          {/* Live Salon Presence Cluster */}
          <div className="flex items-center gap-2 text-xs font-medium text-salon-ink-secondary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono tabular-nums font-semibold text-salon-ink-primary">
              {onlineCount}
            </span>
            <span>reading</span>
            
            {typingCount > 0 && (
              <>
                <span className="text-salon-ink-muted">•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium animate-pulse flex items-center gap-1">
                  <span>{typingCount} typing now</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Layout Switcher & Theme Control */}
        <div className="flex items-center gap-2">
          {/* Dual Context Mode Switcher (Margin Annotations ↔ Town Square Feed) */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-salon-nested border border-salon-border text-xs font-medium">
            <button
              onClick={() => setContextMode('town-square')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                contextMode === 'town-square'
                  ? 'bg-salon-card text-salon-ink-primary shadow-sm font-semibold'
                  : 'text-salon-ink-secondary hover:text-salon-ink-primary'
              }`}
              title="Full Town Square discussion feed below article"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Town Square</span>
            </button>
            <button
              onClick={() => setContextMode('split-editorial')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                contextMode === 'split-editorial'
                  ? 'bg-salon-card text-salon-ink-primary shadow-sm font-semibold'
                  : 'text-salon-ink-secondary hover:text-salon-ink-primary'
              }`}
              title="Side-by-side reading with paragraph margin pins"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split Margin</span>
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-lg bg-salon-nested border border-salon-border text-salon-ink-secondary hover:text-salon-ink-primary transition-colors"
            title={isDarkMode ? "Switch to Daylight Mode" : "Switch to Midnight Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>
      </div>

      {/* Author "Office Hours" Live Banner (High Impact Matrix Item) */}
      {isAuthorInRoom && (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/25 bg-amber-500/[0.06] dark:bg-amber-500/[0.1] px-4 py-3 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Dr. Elena Vance"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-500/80"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full" />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                    Author is In the Room (Live Q&A)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-mono font-semibold">
                    Office Hours
                  </span>
                </div>
                <p className="text-xs text-salon-ink-secondary mt-0.5">
                  Dr. Elena Vance is actively reading and responding to reader inquiries.
                </p>
              </div>
            </div>

            {/* Author Live Actions & Typing Notice */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              {isAuthorTyping && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Author is drafting a reply...
                </span>
              )}

              <button
                onClick={() => setFilterUnansweredQuestions(!filterUnansweredQuestions)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                  filterUnansweredQuestions
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-salon-card text-salon-ink-primary border-salon-border hover:border-amber-400'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {filterUnansweredQuestions ? "Showing Unanswered Qs" : "Queue Unanswered Qs"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

