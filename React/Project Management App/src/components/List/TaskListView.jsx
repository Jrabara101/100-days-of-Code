import React from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Flame,
  ShieldAlert,
  Diamond,
  Radar,
  Plus
} from 'lucide-react';

export default function TaskListView() {
  const {
    filteredTasks,
    teammates,
    selectedTaskId,
    setSelectedTaskId,
    updateTaskStatus,
    assignTask,
    searchQuery,
    setSearchQuery,
    filterAssignee,
    setFilterAssignee,
    filterStatus,
    setFilterStatus,
    setIsNewTaskModalOpen,
  } = useProject();

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30">Urgent</span>;
      case 'high':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">High</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/30">Medium</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-300 dark:border-slate-700">Low</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FFFFFF] dark:bg-[#0B0C0E] select-none transition-colors">
      {/* Search & Filter Toolbar */}
      <div className="h-12 border-b border-[#E2E8F0] dark:border-[#22252B] bg-slate-50/60 dark:bg-[#121417] px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tasks by key, title, or phase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 rounded-md text-xs bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-brand"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 rounded-md bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] text-slate-700 dark:text-slate-300 font-mono text-[11px]"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-2.5 py-1 rounded-md bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] text-slate-700 dark:text-slate-300 font-mono text-[11px]"
          >
            <option value="all">All Assignees</option>
            {teammates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-brand text-white font-semibold text-xs hover:bg-brand-light transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-slate-50 dark:bg-[#0B0C0E] border-b border-[#E2E8F0] dark:border-[#22252B] font-mono text-[11px] text-slate-400 uppercase tracking-wider z-10">
            <tr>
              <th className="py-2.5 px-3 w-20">Key</th>
              <th className="py-2.5 px-3">Title</th>
              <th className="py-2.5 px-3 w-28">Status</th>
              <th className="py-2.5 px-3 w-24">Priority</th>
              <th className="py-2.5 px-3 w-36">Owner</th>
              <th className="py-2.5 px-3 w-36">Schedule</th>
              <th className="py-2.5 px-3 w-20 text-right">Effort</th>
              <th className="py-2.5 px-3 w-28 text-right">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#181A1F]">
            {filteredTasks.map((task) => {
              const assignee = teammates.find(m => m.id === task.assignee_id);
              const isSelected = selectedTaskId === task.id;

              return (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-[#121417]'
                  }`}
                >
                  {/* Monospace Key */}
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-500 flex items-center gap-1">
                    {task.is_milestone ? (
                      <Diamond className="w-3 h-3 text-violet-400 fill-violet-400 shrink-0" />
                    ) : null}
                    <span>{task.id}</span>
                  </td>

                  {/* Title & Scope Creep Badge */}
                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-md">{task.title}</span>
                      {task.added_post_baseline && (
                        <span className="inline-flex items-center px-1 rounded text-[9px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/30">
                          <Radar className="w-2.5 h-2.5 mr-0.5" />
                          scope creep
                        </span>
                      )}
                      {task.status === 'blocked' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-medium">
                          <ShieldAlert className="w-3 h-3" />
                          Blocked by {task.blocked_by}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-2 px-3">
                    <select
                      value={task.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] text-slate-700 dark:text-slate-300 focus:outline-hidden"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Done</option>
                    </select>
                  </td>

                  {/* Priority */}
                  <td className="py-2 px-3">
                    {getPriorityBadge(task.priority)}
                  </td>

                  {/* Owner */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      {assignee && (
                        <img
                          src={assignee.avatar}
                          alt={assignee.name}
                          className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-400"
                        />
                      )}
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {assignee ? assignee.name : 'Unassigned'}
                      </span>
                    </div>
                  </td>

                  {/* Schedule */}
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                    {task.start_date.slice(5)} → {task.end_date.slice(5)}
                  </td>

                  {/* Effort */}
                  <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-500">
                    {task.estimated_hours}h
                  </td>

                  {/* Progress */}
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-slate-200 dark:bg-[#22252B] overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 w-7">
                        {task.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
