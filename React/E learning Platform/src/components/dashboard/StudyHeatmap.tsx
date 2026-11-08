import React, { useMemo } from 'react';
import { StudyDayLog } from '../../types';
import { Calendar, ShieldCheck, Flame, Zap } from 'lucide-react';

interface StudyHeatmapProps {
  logs: StudyDayLog[];
}

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ logs }) => {
  // Aggregate stats
  const totalMinutes = useMemo(() => logs.reduce((acc, l) => acc + l.minutesStudied, 0), [logs]);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalQuizzes = useMemo(() => logs.reduce((acc, l) => acc + l.quizzesPassedCount, 0), [logs]);

  // Organize into 52 weeks x 7 days
  const weeks = useMemo(() => {
    const matrix: StudyDayLog[][] = [];
    let currentWeek: StudyDayLog[] = [];

    logs.forEach((log, index) => {
      currentWeek.push(log);
      if (currentWeek.length === 7 || index === logs.length - 1) {
        matrix.push(currentWeek);
        currentWeek = [];
      }
    });

    return matrix;
  }, [logs]);

  // Intensity color mapper
  const getCellColor = (log?: StudyDayLog) => {
    if (!log || log.minutesStudied === 0) {
      if (log?.streakFrozen) return 'bg-cyan-500/30 border border-cyan-400';
      return 'bg-black/5 dark:bg-white/5';
    }
    if (log.minutesStudied < 20) return 'bg-emerald-300 dark:bg-emerald-900/60';
    if (log.minutesStudied < 40) return 'bg-emerald-500 dark:bg-emerald-600';
    return 'bg-emerald-600 dark:bg-emerald-400';
  };

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#171B26] p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            365-Day Study Activity & Velocity Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily consistency with streak freeze protections
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Zap className="w-3.5 h-3.5" /> {totalHours} hrs
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 dark:text-slate-300">
            89.4% Accuracy
          </span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-1">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day, dIdx) => (
                <div
                  key={dIdx}
                  title={`${day.date}: ${day.minutesStudied}m studied, ${day.quizzesPassedCount} quizzes passed${day.streakFrozen ? ' (🛡️ Streak Frozen)' : ''}`}
                  className={`w-3 h-3 rounded-xs transition-transform hover:scale-125 cursor-pointer ${getCellColor(day)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend & Summary Row */}
      <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-xs bg-black/5 dark:bg-white/5" />
          <div className="w-2.5 h-2.5 rounded-xs bg-emerald-300 dark:bg-emerald-900/60" />
          <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-600" />
          <div className="w-2.5 h-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-400" />
          <span>More</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Streak Freeze Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <Flame className="w-3.5 h-3.5 fill-orange-500" />
            <span>18 Consecutive Days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

