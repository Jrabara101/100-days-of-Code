import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { diffDays } from '../../utils/dateHelpers';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  ShieldAlert,
  Flame,
  Diamond,
  Radar
} from 'lucide-react';

export default function TaskTreePane({ verticalScrollRef, onScroll }) {
  const {
    tasks,
    teammates,
    selectedTaskId,
    setSelectedTaskId,
    updateTaskStatus,
    showCriticalPath,
    criticalPath,
    setIsNewTaskModalOpen,
  } = useProject();

  const [collapsedPhases, setCollapsedPhases] = useState({});

  // Group tasks by Phase
  const phases = React.useMemo(() => {
    const map = new Map();
    tasks.forEach(task => {
      const phase = task.phase || 'General Phase';
      if (!map.has(phase)) map.set(phase, []);
      map.get(phase).push(task);
    });
    return Array.from(map.entries()).map(([name, phaseTasks]) => ({
      name,
      tasks: phaseTasks,
    }));
  }, [tasks]);

  const togglePhase = (phaseName) => {
    setCollapsedPhases(prev => ({ ...prev, [phaseName]: !prev[phaseName] }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'done':
        return <span className="w-2 h-2 rounded-full bg-emerald-500" title="Done" />;
      case 'in_progress':
        return <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="In Progress" />;
      case 'in_review':
        return <span className="w-2 h-2 rounded-full bg-amber-400" title="In Review" />;
      case 'blocked':
        return <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-500/30" title="Blocked" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-500" title="Backlog / To Do" />;
    }
  };

  return (
    <div className="w-[430px] shrink-0 border-r border-[#E2E8F0] dark:border-[#22252B] bg-[#FFFFFF] dark:bg-[#121417] flex flex-col h-full select-none transition-colors">
      {/* Sticky Table Header (Matches Gantt 2-tier header height: 56px total) */}
      <div className="h-14 border-b border-[#E2E8F0] dark:border-[#22252B] bg-slate-50 dark:bg-[#0B0C0E] px-3 flex items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase shrink-0">
        <div className="w-16">ID</div>
        <div className="flex-1">Task / Phase</div>
        <div className="w-14 text-center">Owner</div>
        <div className="w-14 text-center">Status</div>
        <div className="w-12 text-right">Dur.</div>
      </div>

      {/* Task List Rows Container (Synchronized with Gantt Canvas Scroll) */}
      <div
        ref={verticalScrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-slate-100 dark:divide-[#181A1F]/60"
      >
        {phases.map(({ name, tasks: phaseTasks }) => {
          const isCollapsed = collapsedPhases[name];
          const completedCount = phaseTasks.filter(t => t.status === 'done').length;
          const phaseProgress = Math.round((completedCount / phaseTasks.length) * 100);

          return (
            <div key={name} className="group/phase">
              {/* Phase Header Row (36px high) */}
              <div
                onClick={() => togglePhase(name)}
                className="h-9 px-3 bg-slate-100/70 dark:bg-[#181A1F]/70 hover:bg-slate-200/50 dark:hover:bg-[#1e2127] flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer border-y border-slate-200/50 dark:border-[#22252B]/80 transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">{name}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-normal">
                    ({completedCount}/{phaseTasks.length})
                  </span>
                </div>
                {/* Rollup progress pill */}
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-[#22252B] overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${phaseProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{phaseProgress}%</span>
                </div>
              </div>

              {/* Phase Task Items */}
              {!isCollapsed &&
                phaseTasks.map(task => {
                  const isSelected = selectedTaskId === task.id;
                  const isCritical = criticalPath.criticalTaskIds.has(task.id);
                  const isDimmed = showCriticalPath && !isCritical;
                  const assignee = teammates.find(m => m.id === task.assignee_id);
                  const durationDays = task.is_milestone
                    ? 0
                    : Math.max(1, diffDays(task.start_date, task.end_date) + 1);

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`h-9 px-3 flex items-center text-xs cursor-pointer border-l-2 transition-all group ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/20 border-brand text-slate-900 dark:text-slate-100 font-medium'
                          : isDimmed
                          ? 'border-transparent text-slate-400 dark:text-slate-600 opacity-40 hover:opacity-100'
                          : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#181A1F]'
                      }`}
                    >
                      {/* Monospace ID */}
                      <div className="w-16 font-mono text-[11px] text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
                        {task.is_milestone ? (
                          <Diamond className="w-3 h-3 text-violet-400 fill-violet-400 shrink-0" />
                        ) : isCritical && showCriticalPath ? (
                          <Flame className="w-3 h-3 text-rose-500 animate-pulse shrink-0" />
                        ) : null}
                        <span>{task.id}</span>
                      </div>

                      {/* Task Title & Indicators */}
                      <div className="flex-1 truncate pr-2 flex items-center gap-1.5">
                        <span className="truncate">{task.title}</span>
                        {task.added_post_baseline && (
                          <span
                            className="inline-flex items-center px-1 rounded text-[9px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/30"
                            title="Scope Creep: Task injected post-baseline"
                          >
                            <Radar className="w-2.5 h-2.5 mr-0.5" />
                            creep
                          </span>
                        )}
                        {task.status === 'blocked' && (
                          <span
                            className="inline-flex items-center text-[10px] text-rose-500"
                            title={`Blocked by ${task.blocked_by}`}
                          >
                            <ShieldAlert className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {/* Owner Mini-Avatar */}
                      <div className="w-14 flex justify-center shrink-0">
                        {assignee ? (
                          <img
                            src={assignee.avatar}
                            alt={assignee.name}
                            title={`${assignee.name} (${assignee.role})`}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                          />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 text-[10px] flex items-center justify-center">
                            ?
                          </span>
                        )}
                      </div>

                      {/* Status Dot / Pill */}
                      <div className="w-14 flex items-center justify-center shrink-0">
                        {getStatusBadge(task.status)}
                      </div>

                      {/* Monospace Duration */}
                      <div className="w-12 text-right font-mono text-[11px] text-slate-400 dark:text-slate-500 shrink-0 tabular-numbers">
                        {task.is_milestone ? '0d' : `${durationDays}d`}
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })}

        {/* Quick Add Task Button at bottom of Tree */}
        <div className="p-3">
          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-[#22252B] hover:border-brand text-xs text-slate-500 hover:text-brand dark:hover:text-brand-light transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task to Phase</span>
          </button>
        </div>
      </div>
    </div>
  );
}
