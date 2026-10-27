import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Flame,
  AlertCircle,
  Clock,
  Link as LinkIcon,
  MessageSquare,
  Scale,
  Plus,
  ShieldAlert,
  CheckCircle2,
  Radar
} from 'lucide-react';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', wipLimit: null },
  { id: 'todo', title: 'To Do', wipLimit: null },
  { id: 'in_progress', title: 'In Progress', wipLimit: 4 },
  { id: 'in_review', title: 'In Review', wipLimit: 3 },
  { id: 'blocked', title: 'Blocked', wipLimit: null },
  { id: 'done', title: 'Done', wipLimit: null },
];

export default function KanbanBoard() {
  const {
    tasks,
    dependencies,
    teammates,
    comments,
    updateTaskStatus,
    selectedTaskId,
    setSelectedTaskId,
    setIsNewTaskModalOpen,
  } = useProject();

  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" title="Urgent" />;
      case 'high':
        return <span className="text-amber-500 font-bold text-xs" title="High">▲</span>;
      case 'medium':
        return <span className="text-blue-500 font-bold text-xs" title="Medium">●</span>;
      default:
        return <span className="text-slate-400 font-bold text-xs" title="Low">▼</span>;
    }
  };

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      updateTaskStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-slate-50 dark:bg-[#0B0C0E] select-none transition-colors">
      <div className="flex gap-4 h-full min-w-max">
        {COLUMNS.map((column) => {
          const colTasks = tasks.filter(t => t.status === column.id);
          const isOverWip = column.wipLimit && colTasks.length > column.wipLimit;

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="w-80 rounded-xl bg-slate-100/70 dark:bg-[#121417] border border-slate-200/80 dark:border-[#22252B] flex flex-col max-h-full shrink-0 shadow-2xs"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200/60 dark:border-[#1e2127] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {column.title}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                    isOverWip
                      ? 'bg-rose-500/20 text-rose-400 font-bold ring-1 ring-rose-500'
                      : 'bg-slate-200 dark:bg-[#1e2127] text-slate-500 dark:text-slate-400'
                  }`}>
                    {colTasks.length}{column.wipLimit ? ` / ${column.wipLimit}` : ''}
                  </span>
                </div>

                <button
                  onClick={() => setIsNewTaskModalOpen(true)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1e2127] transition-colors"
                  title="Add task to column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Task Cards Container */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {colTasks.map((task) => {
                  const assignee = teammates.find(m => m.id === task.assignee_id);
                  const taskComments = comments.filter(c => c.task_id === task.id);
                  const decisionCount = taskComments.filter(c => c.is_decision).length;
                  const depCount = dependencies.filter(
                    d => d.predecessor_id === task.id || d.successor_id === task.id
                  ).length;
                  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
                  const totalSubtasks = task.subtasks?.length || 0;
                  const isSelected = selectedTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`p-3.5 rounded-xl border bg-white dark:bg-[#181A1F] cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${
                        isSelected
                          ? 'border-brand ring-1 ring-brand'
                          : 'border-slate-200 dark:border-[#22252B] hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Top Row: Monospace ID, Priority, Milestone Chip */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{task.id}</span>
                          {task.added_post_baseline && (
                            <span className="flex items-center px-1 rounded text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/30">
                              <Radar className="w-2.5 h-2.5 mr-0.5" />
                              creep
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {task.is_milestone && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/30">
                              Milestone
                            </span>
                          )}
                          {getPriorityIcon(task.priority)}
                        </div>
                      </div>

                      {/* Body: Task Title */}
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2 line-clamp-2">
                        {task.title}
                      </h4>

                      {/* Subtasks Progress Bar (if task has subtasks) */}
                      {totalSubtasks > 0 && (
                        <div className="mb-2.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                            <span>Subtasks</span>
                            <span>{completedSubtasks}/{totalSubtasks}</span>
                          </div>
                          <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-[#22252B] overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Blocker Sub-banner (Conditional) */}
                      {task.status === 'blocked' && (
                        <div className="mb-2.5 px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 text-[11px] text-rose-500 font-medium">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            Blocked by <strong className="font-mono">{task.blocked_by}</strong>
                          </span>
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="pt-2 border-t border-slate-100 dark:border-[#22252B]/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        {/* Left: Due Date & Dependency Icon */}
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{task.end_date.slice(5)}</span>
                          </span>

                          {depCount > 0 && (
                            <span className="flex items-center gap-0.5" title={`${depCount} dependencies linked`}>
                              <LinkIcon className="w-3 h-3 text-slate-400" />
                              <span>{depCount}</span>
                            </span>
                          )}
                        </div>

                        {/* Right: Comments, Decision Badge & Assignee Avatar */}
                        <div className="flex items-center gap-2">
                          {decisionCount > 0 && (
                            <span
                              className="flex items-center gap-0.5 text-indigo-400 font-bold bg-indigo-500/10 px-1 py-0.5 rounded text-[10px]"
                              title={`${decisionCount} Pinned Decisions`}
                            >
                              <Scale className="w-3 h-3" />
                              <span>{decisionCount}</span>
                            </span>
                          )}

                          {taskComments.length > 0 && (
                            <span className="flex items-center gap-0.5" title={`${taskComments.length} comments`}>
                              <MessageSquare className="w-3 h-3" />
                              <span>{taskComments.length}</span>
                            </span>
                          )}

                          {assignee ? (
                            <img
                              src={assignee.avatar}
                              alt={assignee.name}
                              title={assignee.name}
                              className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                            />
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 text-[9px] flex items-center justify-center">
                              ?
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
