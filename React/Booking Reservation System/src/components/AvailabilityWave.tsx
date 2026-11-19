import React, { useRef } from 'react';
import { TimeSlot } from '../types';
import { ChevronLeft, ChevronRight, Zap, Sparkles, AlertCircle, Compass } from 'lucide-react';

interface AvailabilityWaveProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  onOpenWaitlist: (slot: TimeSlot) => void;
}

export const AvailabilityWave: React.FC<AvailabilityWaveProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  onOpenWaitlist,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Check if currently selected slot triggers a smart nudge (or prime sold out)
  const activeNudge = selectedSlot?.smartNudge;

  return (
    <div className="w-full bg-white dark:bg-[#1B1F24] rounded-2xl border border-stone-800/8 dark:border-white/8 shadow-sm p-4 sm:p-5 transition-colors duration-300">
      
      {/* Wave Header & Crowd Energy Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1E6F50] animate-pulse" />
          <h2 className="font-serif text-lg text-[#18201C] dark:text-[#F6F4F0] font-medium">
            24-Hour Availability &amp; Energy Wave
          </h2>
          <span className="text-[11px] font-mono text-[#828B86] hidden md:inline">
            (Anti-Dead-End Timeline)
          </span>
        </div>

        {/* Energy Wave Stage Legend */}
        <div className="flex items-center gap-3 text-[11px] text-[#525B56] dark:text-[#A0A8A3] overflow-x-auto no-scrollbar">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Calm Morning
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Golden Hour (5:45 PM)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#C85A32]" />
            Prime Evening Buzz
          </span>
        </div>
      </div>

      {/* SVG Ambient Crowd Energy Horizon Curve */}
      <div className="relative w-full h-10 mb-2 overflow-hidden rounded-lg bg-[#FAF7F2] dark:bg-[#15181C] border border-stone-800/6 dark:border-white/6 px-2 py-1 flex items-end">
        <svg
          viewBox="0 0 1000 60"
          className="w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="energyWaveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1E6F50" stopOpacity="0.3" />
              <stop offset="35%" stopColor="#D9822B" stopOpacity="0.4" />
              <stop offset="55%" stopColor="#C85A32" stopOpacity="0.6" />
              <stop offset="80%" stopColor="#C85A32" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#6D4C7D" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="energyStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1E6F50" />
              <stop offset="35%" stopColor="#D9822B" />
              <stop offset="55%" stopColor="#C85A32" />
              <stop offset="80%" stopColor="#C85A32" />
              <stop offset="100%" stopColor="#6D4C7D" />
            </linearGradient>
          </defs>

          {/* Dynamic bezier curves for the crowd pacing wave */}
          <path
            d="M 0 50 Q 150 48, 250 35 T 500 20 T 700 8 T 850 16 T 1000 48 L 1000 60 L 0 60 Z"
            fill="url(#energyWaveGrad)"
          />
          <path
            d="M 0 50 Q 150 48, 250 35 T 500 20 T 700 8 T 850 16 T 1000 48"
            fill="none"
            stroke="url(#energyStrokeGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Sunset Horizon Marker Line at 5:45 PM (around ~60% of timeline) */}
          <line
            x1="580"
            y1="0"
            x2="580"
            y2="60"
            stroke="#D9822B"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Ambient annotations on the wave */}
        <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-mono pointer-events-none text-[#828B86]">
          <span>11:00 AM • Soft Light</span>
          <span className="text-[#D9822B] font-semibold flex items-center gap-1">
            <Compass className="w-3 h-3" />
            5:45 PM Golden Hour
          </span>
          <span className="text-[#C85A32] font-semibold">
            7:30 PM Peak Embers
          </span>
          <span>10:00 PM Cellar Amaro</span>
        </div>
      </div>

      {/* Smart Shift Nudge Banner (When a Prime Slot is Full) */}
      {activeNudge && (
        <div className="mb-3.5 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border-l-4 border-[#D9822B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#D9822B] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-[#18201C] dark:text-[#F6F4F0]">
                <strong className="text-[#D9822B]">{activeNudge.reason}</strong> — {activeNudge.timeDelta} to{' '}
                <span className="font-mono font-semibold underline decoration-[#D9822B]">
                  {activeNudge.suggestedAlternativeTime}
                </span>{' '}
                for {activeNudge.alternativeSpotName}.
              </p>
              <p className="text-[11px] text-[#525B56] dark:text-[#A0A8A3]">
                Zero dead-end. Seamless spatial pivot without losing your preferred ambiance.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const altSlot = slots.find(s => s.timeStr === activeNudge.suggestedAlternativeTime);
              if (altSlot) onSelectSlot(altSlot);
            }}
            className="self-start sm:self-center shrink-0 px-3 py-1.5 rounded-lg bg-[#D9822B] hover:bg-[#c47220] text-white text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            Take {activeNudge.suggestedAlternativeTime}
          </button>
        </div>
      )}

      {/* Horizontal Scrollable Time Scrubber with Left/Right Nav */}
      <div className="relative group">
        
        {/* Scroll Left Button */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll time slots left"
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-[#1B1F24] border border-stone-800/10 dark:border-white/10 shadow-md flex items-center justify-center text-[#525B56] dark:text-[#A0A8A3] hover:text-[#C85A32] opacity-80 group-hover:opacity-100 transition-all hover:scale-105"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Time-Slot Pills Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2.5 overflow-x-auto py-2 px-1 no-scrollbar scroll-smooth"
        >
          {slots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;
            const isWaitlist = slot.status === 'waitlist-only';
            const isGap = slot.status === 'gap-express';
            const isPrime = slot.status === 'prime';

            // Background & Border Tokens
            let pillClass = 'bg-[#FAF7F2] dark:bg-[#15181C] text-[#18201C] dark:text-[#F6F4F0] border-stone-800/10 dark:border-white/10 hover:border-[#C85A32]/40';
            let dotColor = 'bg-[#1E6F50]'; // Emerald

            if (isSelected) {
              pillClass = 'bg-[#C85A32] text-white border-[#C85A32] shadow-md shadow-[#C85A32]/25 ring-2 ring-[#C85A32]/30';
              dotColor = 'bg-white';
            } else if (isWaitlist) {
              pillClass = 'bg-purple-900/10 dark:bg-purple-900/25 text-[#6D4C7D] dark:text-[#A78BFA] border-purple-500/20 hover:border-purple-500/40';
              dotColor = 'bg-[#6D4C7D]';
            } else if (isGap) {
              pillClass = 'bg-amber-500/10 dark:bg-amber-500/20 text-[#D9822B] border-[#D9822B]/30 hover:border-[#D9822B]';
              dotColor = 'bg-[#D9822B]';
            } else if (isPrime) {
              pillClass = 'bg-stone-50 dark:bg-[#181C21] border-[#C85A32]/30 hover:border-[#C85A32]';
              dotColor = 'bg-[#C85A32]';
            }

            return (
              <button
                key={slot.id}
                onClick={() => {
                  if (isWaitlist) {
                    onOpenWaitlist(slot);
                  } else {
                    onSelectSlot(slot);
                  }
                }}
                className={`shrink-0 min-w-[110px] h-[64px] px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${pillClass}`}
              >
                {/* Micro Header with Status Dot */}
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  <span className="font-mono text-xs font-bold tabular-numbers tracking-tight">
                    {slot.timeStr}
                  </span>
                </div>

                {/* Subtext description / Tetris tag */}
                <div className="text-[10px] font-sans truncate max-w-full">
                  {isWaitlist ? (
                    <span className="font-medium text-[10px] flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> 82% Waitlist
                    </span>
                  ) : isGap ? (
                    <span className="font-medium font-mono text-[10px] text-[#D9822B]">
                      ⚡ Express Gap
                    </span>
                  ) : isPrime ? (
                    <span className={`text-[10px] ${isSelected ? 'text-white/90' : 'text-[#C85A32]'}`}>
                      🔥 Prime Spot
                    </span>
                  ) : (
                    <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#828B86]'}`}>
                      {slot.openSpotsCount} tables open
                    </span>
                  )}
                </div>

                {/* Light & Noise Indicator */}
                <span className={`text-[9px] font-mono mt-0.5 opacity-70 ${isSelected ? 'text-white' : ''}`}>
                  {slot.ambientDb}dB • {slot.lightLevel === 'sunlit' ? '☀️' : slot.lightLevel === 'golden-hour' ? '🌅' : '🕯️'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll time slots right"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-[#1B1F24] border border-stone-800/10 dark:border-white/10 shadow-md flex items-center justify-center text-[#525B56] dark:text-[#A0A8A3] hover:text-[#C85A32] opacity-80 group-hover:opacity-100 transition-all hover:scale-105"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
