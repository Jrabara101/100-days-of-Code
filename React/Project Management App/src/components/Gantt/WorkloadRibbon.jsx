import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { addDays, diffDays, formatDateStr, parseDate, isWeekend } from '../../utils/dateHelpers';
import { Users, ChevronUp, ChevronDown, AlertTriangle, CalendarOff } from 'lucide-react';

export default function WorkloadRibbon() {
  const { teammates, workloadMatrix, zoomLevel } = useProject();
  const [isExpanded, setIsExpanded] = useState(true);

  const timelineStartDate = '2026-10-12';
  const totalDays = 48;

  const dayWidth = zoomLevel === 'week' ? 28 : zoomLevel === 'month' ? 18 : 48;
  const totalWidth = totalDays * dayWidth;

  const daysList = [];
  const start = parseDate(timelineStartDate);
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(start, i);
    daysList.push({
      dateStr: formatDateStr(d),
      dayNumber: d.getDate(),
      isWeekend: isWeekend(d),
    });
  }

  return (
    <div className="border-t border-[#E2E8F0] dark:border-[#22252B] bg-[#FFFFFF] dark:bg-[#121417] shrink-0 transition-all select-none">
      {/* Drawer Header Toggle */}
      <div
        onClick={() => setIsExpanded(prev => !prev)}
        className="h-7 px-4 bg-slate-50 dark:bg-[#0B0C0E] border-b border-[#E2E8F0] dark:border-[#22252B] flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#181A1F] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-indigo-500" />
          <span className="uppercase tracking-wider font-mono">Team Capacity & Burnout Guardrail</span>
          <span className="text-[10px] text-slate-400 font-normal">
            (8h standard daily capacity • Overbooked in crimson)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200">
          <span className="text-[10px] font-mono">{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Drawer Content */}
      {isExpanded && (
        <div className="flex h-36">
          {/* Left Rail: Team Member list (Width matches TaskTreePane: 430px) */}
          <div className="w-[430px] shrink-0 border-r border-[#E2E8F0] dark:border-[#22252B] divide-y divide-slate-100 dark:divide-[#181A1F] overflow-y-auto bg-slate-50/50 dark:bg-[#0B0C0E]/50">
            {teammates.map((m) => {
              const stats = workloadMatrix[m.id];
              const isOverbooked = stats && stats.overbookedDaysCount > 0;

              return (
                <div
                  key={m.id}
                  className="h-7 px-3 flex items-center justify-between text-xs hover:bg-slate-100/50 dark:hover:bg-[#181A1F]/50 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-400"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                      {m.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      {m.timezone}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    {isOverbooked ? (
                      <span className="flex items-center gap-0.5 text-rose-500 font-bold bg-rose-500/10 px-1 rounded">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {stats.overbookedDaysCount}d over
                      </span>
                    ) : (
                      <span className="text-emerald-500">Nominal</span>
                    )}
                    <span className="text-slate-400 tabular-numbers">
                      {stats ? `${stats.totalAllocated}h` : '0h'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Rail: Daily Workload Cells (Aligned with Gantt Canvas Dates) */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#FFFFFF] dark:bg-[#0B0C0E]">
            <div style={{ width: `${totalWidth}px` }} className="flex flex-col divide-y divide-slate-100 dark:divide-[#181A1F]">
              {teammates.map((m) => {
                const stats = workloadMatrix[m.id];

                return (
                  <div key={m.id} className="h-7 flex">
                    {daysList.map((day) => {
                      const hours = stats?.dailyHours[day.dateStr] || 0;
                      const roundedHours = Math.round(hours * 10) / 10;
                      const isPTO = m.pto_dates && m.pto_dates.includes(day.dateStr);
                      const isOver = hours > m.capacity_hours_per_day || (isPTO && hours > 0);
                      const hasWork = hours > 0;

                      return (
                        <div
                          key={day.dateStr}
                          style={{ width: `${dayWidth}px` }}
                          className={`h-full border-r border-slate-100 dark:border-[#181A1F] flex items-center justify-center font-mono text-[9px] relative group ${
                            day.isWeekend
                              ? 'bg-slate-100/40 dark:bg-white/[0.015]'
                              : isPTO
                              ? 'bg-purple-950/20 text-purple-400'
                              : isOver
                              ? 'bg-rose-500/20 text-rose-400 font-bold'
                              : hasWork
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'text-slate-500'
                          }`}
                          title={`${m.name} on ${day.dateStr}: ${isPTO ? 'Scheduled PTO' : `${roundedHours}h / 8h capacity`}`}
                        >
                          {isPTO ? (
                            <CalendarOff className="w-3 h-3 text-purple-400" />
                          ) : hasWork ? (
                            <span>{roundedHours}h</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                          )}

                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex items-center px-1.5 py-0.5 rounded bg-black/90 text-white text-[9px] whitespace-nowrap z-40 border border-slate-700 pointer-events-none">
                            {day.dateStr}: {isPTO ? '🏖️ PTO' : `${roundedHours}h / 8h`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
