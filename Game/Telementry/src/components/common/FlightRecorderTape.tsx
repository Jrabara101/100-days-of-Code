import React, { useState } from 'react';
import { DailySummary } from '../../types/telemetry';
import { Activity, Info, Trophy, CheckCircle2, XCircle } from 'lucide-react';

interface FlightRecorderTapeProps {
  days: DailySummary[];
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
  onOpenTableTwin: () => void;
}

export const FlightRecorderTape: React.FC<FlightRecorderTapeProps> = ({
  days,
  onSelectDate,
  selectedDate,
  onOpenTableTwin
}) => {
  const [hoveredDay, setHoveredDay] = useState<DailySummary | null>(null);

  if (days.length === 0) return null;

  // Find max playtime to scale bar heights proportionally (with a minimum baseline)
  const maxPlaytime = Math.max(...days.map(d => d.playtimeHours), 4.5);

  return (
    <section 
      className="relative rounded bg-[#0d1322] border border-cyan-500/20 p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden"
      aria-label="30-Day Operational Flight Recorder Tape"
    >
      {/* Tape Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="font-['Space_Grotesk'] text-xs sm:text-sm font-bold tracking-wider text-slate-100 uppercase">
            Flight-Recorder // 30-Day Operational Tape
          </h2>
          <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400/80 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
            SIGNATURE TELEMETRY
          </span>
        </div>

        {/* Legend & Table Twin Link */}
        <div className="flex items-center gap-3 text-[11px] font-['JetBrains_Mono'] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-emerald-400 shadow-[0_0_6px_#10B981]" />
            <span>Net Win</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-rose-500 shadow-[0_0_6px_#EF4444]" />
            <span>Net Loss</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-amber-400 shadow-[0_0_6px_#F59E0B]" />
            <span>PR Set</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-slate-700" />
            <span>Rest Day</span>
          </div>
        </div>
      </div>

      {/* The 30-Day Horizontal Tape Bar Container */}
      <div className="relative pt-6 pb-2">
        {/* Draw-in animation wrapper */}
        <div className="animate-tape-draw flex items-end justify-between gap-1 sm:gap-1.5 h-24 border-b border-[#1f293d] px-1">
          {days.map((day, idx) => {
            const hasPlayed = day.playtimeHours > 0;
            // Height proportional to playtime (min 12% for visibility, max 100%)
            const heightPercent = hasPlayed 
              ? Math.max(18, Math.min(100, Math.round((day.playtimeHours / maxPlaytime) * 100))) 
              : 8;

            const isSelected = selectedDate === day.date;
            const hasPr = day.notableEvent !== undefined;

            let barBg = 'bg-slate-800/80 hover:bg-slate-700';
            if (hasPlayed) {
              if (hasPr) {
                barBg = 'bg-amber-400 hover:bg-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
              } else if (day.dominantResult === 'VICTORY') {
                barBg = 'bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
              } else {
                barBg = 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
              }
            }

            return (
              <button
                key={day.date}
                onClick={() => onSelectDate(isSelected ? '' : day.date)}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{ height: `${heightPercent}%` }}
                className={`flex-1 rounded-t-sm transition-all duration-150 relative group focus:outline-none focus:ring-1 focus:ring-cyan-400 ${barBg} ${
                  isSelected ? 'ring-2 ring-cyan-300 brightness-125 scale-y-105' : ''
                }`}
                aria-label={`Date: ${day.date}, Playtime: ${day.playtimeHours}h, Wins: ${day.wins}, Losses: ${day.losses}`}
              >
                {/* PR indicator pip */}
                {hasPr && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-300 text-[10px] animate-bounce">
                    ★
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Date Ticks labels */}
        <div className="flex justify-between items-center text-[10px] font-['JetBrains_Mono'] text-slate-500 pt-2 px-1">
          <span>D-30 ({days[0]?.date.slice(5)})</span>
          <span className="hidden sm:inline">D-15 ({days[14]?.date.slice(5)})</span>
          <span className="text-cyan-400 font-bold">TODAY ({days[days.length - 1]?.date.slice(5)})</span>
        </div>
      </div>

      {/* Dynamic Popover HUD on Hover / Active Selection */}
      <div className="mt-2 min-h-[38px] p-2 rounded bg-[#090d16]/90 border border-[#1f293d] flex flex-wrap items-center justify-between gap-2 text-xs font-['JetBrains_Mono']">
        {hoveredDay ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-cyan-300 font-bold">
              {hoveredDay.date}
            </span>
            <span className="text-slate-400">
              Playtime: <strong className="text-slate-100">{hoveredDay.playtimeHours}h</strong>
            </span>
            {hoveredDay.sessionCount > 0 ? (
              <>
                <span className="text-slate-400">
                  Matches: <strong className="text-slate-100">{hoveredDay.sessionCount}</strong>
                </span>
                <span className="text-slate-400">
                  Record: <span className="text-emerald-400">{hoveredDay.wins}W</span> - <span className="text-rose-400">{hoveredDay.losses}L</span> ({hoveredDay.winRate}% WR)
                </span>
                <span className="text-slate-400">
                  Avg K/D: <strong className="text-cyan-400">{hoveredDay.avgKd}</strong>
                </span>
                {hoveredDay.notableEvent && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                    ★ {hoveredDay.notableEvent}
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-500 italic">Rest day (No combat deployments)</span>
            )}
          </div>
        ) : selectedDate ? (
          <div className="flex items-center gap-2 text-cyan-300">
            <span>Filtering sessions for date: <strong>{selectedDate}</strong></span>
            <button
              onClick={() => onSelectDate('')}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              (Clear date filter)
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hover or tap any daily tick bar to inspect operational stats and isolate that day's matches.</span>
          </div>
        )}

        <button
          onClick={onOpenTableTwin}
          className="text-slate-400 hover:text-cyan-300 underline text-[11px] ml-auto"
        >
          View as Accessible Table
        </button>
      </div>
    </section>
  );
};
