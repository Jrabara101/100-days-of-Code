import React, { useState } from 'react';
import { Clock, MapPin, Sparkles, ChevronDown, ChevronUp, Zap, Info } from 'lucide-react';

export function RunOfShowTimeline({ event }) {
  const [activeDayId, setActiveDayId] = useState(event.days[1]?.id || event.days[0].id);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const activeSchedule = event.schedule[activeDayId] || [];

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="schedule" className="w-full">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-theme-gold font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Chapter-by-Chapter Itinerary</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-theme-primary font-normal">
          The Run-of-Show Timeline
        </h2>
        <p className="text-sm text-theme-secondary max-w-xl">
          Exact moments, gentle transitions, and location shifts so you never have to wonder what comes next.
        </p>
      </div>

      {/* Multi-Day Tabs */}
      {event.days.length > 1 && (
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-theme-inset border border-theme-border mb-8 overflow-x-auto">
          {event.days.map((day) => {
            const isActive = activeDayId === day.id;
            return (
              <button
                key={day.id}
                onClick={() => {
                  setActiveDayId(day.id);
                  setExpandedIndex(null);
                }}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-center flex flex-col items-center ${
                  isActive
                    ? 'bg-theme-card text-theme-primary font-semibold shadow-sm ring-1 ring-theme-foil'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-black/5'
                }`}
              >
                <span className="font-mono text-[11px] opacity-75">{day.label}</span>
                <span className="font-serif font-medium">{day.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Vertical Scrollytelling Timeline Track */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-theme-foil/60 space-y-6 sm:space-y-8 my-4">
        {activeSchedule.map((item, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div key={idx} className="relative group">
              {/* Timeline Pin Node on Rail */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-theme-foil bg-theme-card flex items-center justify-center transition-transform group-hover:scale-125 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-theme-accent"></div>
              </div>

              {/* Timeline Event Card */}
              <div 
                onClick={() => toggleExpand(idx)}
                className="cursor-pointer rounded-2xl p-5 sm:p-6 border border-theme-border bg-theme-card shadow-sm hover:shadow-paper transition-all duration-300 hover:border-theme-foil/60"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Left Time Column */}
                  <div className="flex sm:flex-col items-baseline sm:items-start justify-between gap-2 sm:min-w-[120px]">
                    <span className="font-mono text-lg font-bold text-theme-primary tracking-tight">
                      {item.time}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-theme-inset text-theme-muted border border-theme-border/60">
                      {item.subLabel}
                    </span>
                  </div>

                  {/* Center Narrative Column */}
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-serif font-semibold text-theme-primary mb-1 group-hover:text-theme-accent transition">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-xs text-theme-muted font-medium mb-3">
                      <MapPin className="w-3.5 h-3.5 text-theme-accent flex-shrink-0" />
                      <span>{item.location}</span>
                    </div>

                    <p className="text-sm text-theme-secondary leading-relaxed">
                      {item.description}
                    </p>

                    {/* Vibe & Utility Badges */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {item.badges.map((badge, bIdx) => (
                        <span 
                          key={bIdx}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-theme-inset border border-theme-border text-theme-primary font-medium"
                        >
                          {badge}
                        </span>
                      ))}

                      {item.energy && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1 border border-amber-500/20">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>Energy: {item.energy}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand / Collapse Indicator */}
                  <div className="hidden sm:block text-theme-muted group-hover:text-theme-primary">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>

                </div>

                {/* Expanded Host Advice Drawer */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-theme-border text-xs text-theme-secondary bg-theme-inset/50 p-3 rounded-xl animate-fadeIn">
                    <div className="font-semibold text-theme-primary flex items-center gap-1.5 mb-1.5">
                      <Info className="w-3.5 h-3.5 text-theme-accent" />
                      <span>Host Hospitality Notes:</span>
                    </div>
                    <p className="leading-relaxed">
                      Photography is warmly encouraged during cocktails and reception! For the vows, professional photographers and cinematographers will capture every memory, so please keep phones tucked away so everyone enjoys the moment unplugged.
                    </p>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

