import React from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Users,
  AlertTriangle,
  CalendarOff,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function WorkloadMatrixView() {
  const { teammates, tasks, workloadMatrix, assignTask, setSelectedTaskId } = useProject();

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0B0C0E] select-none transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Executive Workload Overview Banner */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Users className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Burnout-Conscious Team Capacity Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time daily load balancing, scheduled PTO awareness, and automatic bottleneck detection.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              <span>4 / 5 Teammates Balanced</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <AlertTriangle className="w-4 h-4" />
              <span>1 PTO Overlap Risk</span>
            </div>
          </div>
        </div>

        {/* Workload Cards per Teammate */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teammates.map((member) => {
            const stats = workloadMatrix[member.id];
            const memberTasks = tasks.filter(t => t.assignee_id === member.id && t.status !== 'done');
            const isOverbooked = stats?.overbookedDaysCount > 0;
            const hasPTO = member.pto_dates && member.pto_dates.length > 0;

            return (
              <div
                key={member.id}
                className={`rounded-2xl p-4 border bg-white dark:bg-[#181A1F] transition-all ${
                  isOverbooked
                    ? 'border-rose-500/40 shadow-glow-crimson'
                    : 'border-slate-200 dark:border-[#22252B]'
                }`}
              >
                {/* Teammate Identity Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                    />
                    <div>
                      <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {member.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">{member.role}</p>
                      <p className="text-[10px] font-mono text-slate-500">{member.timezone}</p>
                    </div>
                  </div>

                  {/* Overbooked or Nominal Badge */}
                  {isOverbooked ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Overbooked
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Healthy
                    </span>
                  )}
                </div>

                {/* Capacity Metrics */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#121417] mb-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Burden</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {stats?.totalAllocated || 0} hrs
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Daily Limit</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {member.capacity_hours_per_day} hrs / day
                    </span>
                  </div>
                </div>

                {/* PTO Dates Badge */}
                {hasPTO && (
                  <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-2 text-xs text-purple-400 font-mono">
                    <CalendarOff className="w-3.5 h-3.5 shrink-0" />
                    <span>Scheduled PTO: {member.pto_dates.join(', ')}</span>
                  </div>
                )}

                {/* Assigned Active Tasks */}
                <div>
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                    Active Tasks ({memberTasks.length})
                  </h4>
                  <div className="space-y-1.5">
                    {memberTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No active tasks assigned.</p>
                    ) : (
                      memberTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTaskId(t.id)}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-[#121417] hover:bg-slate-100 dark:hover:bg-[#1e2127] cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="font-mono text-[10px] text-slate-500 mr-1.5">
                              {t.id}
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 truncate">
                              {t.title}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {t.estimated_hours}h
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Workload Rebalancing Suggestion Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/30 to-purple-950/20 border border-indigo-500/30 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-indigo-300 mb-1">
              Automated Workload Rebalancing Recommendation
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Alex Rivera has 2 days of scheduled PTO on Oct 23-24 while holding critical-path task <strong className="font-mono text-indigo-300">PRJ-107 (Blocker Sentinel)</strong>. Reassigning PRJ-107 to Devon Miles will eliminate 14 hours of scheduling risk and protect the November 18 launch milestone.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => assignTask('PRJ-107', 'user-devon')}
                className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs transition-colors"
              >
                Auto-Reassign PRJ-107 to Devon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
