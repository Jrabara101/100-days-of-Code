import React, { useState, useMemo } from 'react';
import { Session, GameMode, MatchResult } from '../../types/telemetry';
import { 
  Search, 
  Filter, 
  Calendar, 
  Trophy, 
  Clock, 
  Crosshair, 
  Shield, 
  CheckCircle2, 
  XCircle,
  X,
  ChevronRight
} from 'lucide-react';

interface ActivityViewProps {
  sessions: Session[];
  heatmapDays: { date: string; count: number; hours: number; wins: number; dayOfWeek: number }[];
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
  onSelectSession: (id: string) => void;
  onOpenTableTwin: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  sessions,
  heatmapDays,
  selectedDate,
  onSelectDate,
  onSelectSession,
  onOpenTableTwin
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<string>('all');
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<{ date: string; count: number; hours: number; wins: number } | null>(null);

  // Group heatmap into 52 weeks (each column 7 days: Sun to Sat)
  const weeks = useMemo(() => {
    if (heatmapDays.length === 0) return [];
    const grouped = [];
    let currentWeek = [];
    for (let i = 0; i < heatmapDays.length; i++) {
      currentWeek.push(heatmapDays[i]);
      if (currentWeek.length === 7) {
        grouped.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) grouped.push(currentWeek);
    return grouped;
  }, [heatmapDays]);

  // Filtered session list
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedMode !== 'all' && s.mode !== selectedMode) return false;
      if (selectedResult !== 'all' && s.result !== selectedResult) return false;
      if (selectedDate && !s.startTime.startsWith(selectedDate)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchMap = s.map.toLowerCase().includes(q);
        const matchWeapon = s.primaryWeapon.toLowerCase().includes(q);
        const matchMode = s.mode.toLowerCase().includes(q);
        if (!matchMap && !matchWeapon && !matchMode) return false;
      }
      return true;
    });
  }, [sessions, selectedMode, selectedResult, selectedDate, searchQuery]);

  // Color intensity for heatmap squares
  const getCellColor = (hours: number, count: number) => {
    if (count === 0) return 'bg-[#111827] hover:bg-[#1a2233] border-[#1f293d]';
    if (hours < 1.0) return 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-800/40';
    if (hours < 2.5) return 'bg-cyan-800/90 hover:bg-cyan-700 border-cyan-600/50';
    if (hours < 4.0) return 'bg-cyan-600 hover:bg-cyan-500 border-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.4)]';
    return 'bg-cyan-400 hover:bg-cyan-300 border-white shadow-[0_0_10px_rgba(0,240,255,0.8)]'; // Overdrive
  };

  return (
    <div className="space-y-6">
      {/* 52-Week Contribution Heatmap (GitHub-style calendar matrix) */}
      <section className="rounded-lg bg-[#0d1322] border border-[#1f293d] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <h2 className="font-['Space_Grotesk'] text-sm font-bold text-slate-100 uppercase tracking-wider">
                52-Week Combat Deployment Matrix // Heatmap
              </h2>
            </div>
            <p className="font-['Inter'] text-xs text-slate-400 mt-0.5">
              Click any day square to filter the session roster below
            </p>
          </div>

          {/* Intensity Legend */}
          <div className="flex items-center gap-2 text-[11px] font-['JetBrains_Mono'] text-slate-400">
            <span>Less</span>
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#111827] border border-[#1f293d]" />
              <span className="w-2.5 h-2.5 rounded-xs bg-cyan-950 border border-cyan-800/40" />
              <span className="w-2.5 h-2.5 rounded-xs bg-cyan-800 border border-cyan-600/50" />
              <span className="w-2.5 h-2.5 rounded-xs bg-cyan-600 border border-cyan-400" />
              <span className="w-2.5 h-2.5 rounded-xs bg-cyan-400 border border-white" />
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid (Scrolls inside own container per mobile requirement: "heatmap scrolls inside its own container") */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[760px]">
            <div className="flex gap-1.5">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5">
                  {week.map((day) => {
                    const isSelected = selectedDate === day.date;
                    return (
                      <button
                        key={day.date}
                        onClick={() => onSelectDate(isSelected ? null : day.date)}
                        onMouseEnter={() => setHoveredHeatmapDay(day)}
                        onMouseLeave={() => setHoveredHeatmapDay(null)}
                        className={`w-3.5 h-3.5 rounded-[2px] border transition-transform ${getCellColor(
                          day.hours,
                          day.count
                        )} ${
                          isSelected ? 'ring-2 ring-cyan-300 scale-125 z-10' : 'hover:scale-110'
                        }`}
                        aria-label={`Date ${day.date}: ${day.count} matches, ${day.hours}h`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Month labels footer */}
            <div className="flex justify-between text-[10px] font-['JetBrains_Mono'] text-slate-500 pt-2">
              <span>Oct 2025</span>
              <span>Jan 2026</span>
              <span>Apr 2026</span>
              <span>Jul 2026</span>
              <span className="text-cyan-400 font-bold">Sep 2026</span>
            </div>
          </div>
        </div>

        {/* Heatmap hover readout status */}
        <div className="mt-3 p-2 rounded bg-[#090d16] border border-[#1f293d] flex items-center justify-between text-xs font-['JetBrains_Mono']">
          {hoveredHeatmapDay ? (
            <div className="flex items-center gap-3">
              <span className="text-cyan-300 font-bold">{hoveredHeatmapDay.date}:</span>
              <span className="text-slate-300">{hoveredHeatmapDay.hours}h playtime</span>
              <span className="text-slate-400">({hoveredHeatmapDay.count} matches logged)</span>
              {hoveredHeatmapDay.count > 0 && (
                <span className="text-emerald-400 font-semibold">{hoveredHeatmapDay.wins} Victories</span>
              )}
            </div>
          ) : selectedDate ? (
            <div className="flex items-center gap-2 text-cyan-300">
              <span>Filtered to day: <strong>{selectedDate}</strong></span>
              <button
                onClick={() => onSelectDate(null)}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                (Reset date)
              </button>
            </div>
          ) : (
            <span className="text-slate-500">
              Hover over a square to see session volume, or tap to isolate that day's matches.
            </span>
          )}

          <button
            onClick={onOpenTableTwin}
            className="text-slate-400 hover:text-cyan-300 underline text-[11px]"
          >
            Accessible Table Twin
          </button>
        </div>
      </section>

      {/* Filter and Search Bar (Filters live in URL state) */}
      <section className="rounded-lg bg-[#0d1322] border border-[#1f293d] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search weapon, map, or mode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded bg-[#090d16] border border-[#1f293d] focus:border-cyan-400 focus:outline-none text-xs text-slate-200 font-['Inter'] placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mode Filter */}
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="px-3 py-1.5 rounded bg-[#090d16] border border-[#1f293d] text-xs font-['JetBrains_Mono'] text-slate-300 focus:border-cyan-400 focus:outline-none"
            aria-label="Filter by Match Mode"
          >
            <option value="all">All Modes</option>
            <option value="Ranked 5v5">Ranked 5v5</option>
            <option value="Casual Quickplay">Casual Quickplay</option>
            <option value="Deathmatch">Deathmatch</option>
            <option value="Payload Push">Payload Push</option>
          </select>

          {/* Result Filter */}
          <select
            value={selectedResult}
            onChange={(e) => setSelectedResult(e.target.value)}
            className="px-3 py-1.5 rounded bg-[#090d16] border border-[#1f293d] text-xs font-['JetBrains_Mono'] text-slate-300 focus:border-cyan-400 focus:outline-none"
            aria-label="Filter by Result"
          >
            <option value="all">All Results</option>
            <option value="VICTORY">Victories Only</option>
            <option value="DEFEAT">Defeats Only</option>
          </select>
        </div>

        {/* Date Filter Badge if active */}
        {selectedDate && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-['JetBrains_Mono']">
            <span>Date: {selectedDate}</span>
            <button onClick={() => onSelectDate(null)} className="hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="text-xs font-['JetBrains_Mono'] text-slate-400">
          Showing <strong>{filteredSessions.length}</strong> of {sessions.length} matches
        </div>
      </section>

      {/* Session Roster List */}
      <section className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center rounded-lg bg-[#0d1322] border border-[#1f293d]">
            <p className="font-['Space_Grotesk'] text-slate-400 text-sm">
              No sessions match the current filter criteria.
            </p>
            <button
              onClick={() => {
                setSelectedMode('all');
                setSelectedResult('all');
                setSearchQuery('');
                onSelectDate(null);
              }}
              className="mt-3 px-3 py-1.5 rounded bg-[#1e293b] hover:bg-[#2d3748] text-cyan-300 text-xs font-['JetBrains_Mono']"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isWin = session.result === 'VICTORY';
            const hasPr = session.notableBadges.includes('PR SET');

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelectSession(session.id);
                }}
                className="p-4 rounded-lg bg-[#0d1322] border border-[#1f293d] hover:border-cyan-400/50 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]"
              >
                {/* Left: Mode, Map, Time & Badges */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold ${
                        isWin
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {session.result} ({session.roundsWon}-{session.roundsLost})
                    </span>

                    <span className="font-['Space_Grotesk'] font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition">
                      {session.map}
                    </span>

                    <span className="text-xs font-['JetBrains_Mono'] text-slate-500">
                      • {session.mode}
                    </span>

                    {session.eloChange !== 0 && (
                      <span className={`text-xs font-['JetBrains_Mono'] font-bold ${session.eloChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {session.eloChange > 0 ? `+${session.eloChange}` : session.eloChange} Elo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-['JetBrains_Mono'] text-slate-400">
                    <span>{new Date(session.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {session.durationMinutes}m duration
                    </span>
                    <span>•</span>
                    <span>Weapon: <strong className="text-slate-200">{session.primaryWeapon}</strong></span>
                  </div>

                  {session.notableBadges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {session.notableBadges.map((badge, idx) => (
                        <span
                          key={idx}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold border ${
                            badge === 'PR SET'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                              : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {badge === 'PR SET' ? '★ PR SET' : badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Key Stats readouts & Inspection arrow */}
                <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center font-['JetBrains_Mono']">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">K/D RATIO</span>
                    <span className="text-sm font-bold text-slate-100 tabular-nums">
                      {session.kdRatio.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {session.kills}K / {session.deaths}D
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">ACCURACY</span>
                    <span className="text-sm font-bold text-cyan-300 tabular-nums">
                      {session.accuracyPercent}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {session.headshotPercent}% HS
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">DAMAGE</span>
                    <span className="text-sm font-bold text-slate-100 tabular-nums">
                      {session.damageDealt.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Peak {session.peakRoundDamage}
                    </span>
                  </div>

                  <div className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
