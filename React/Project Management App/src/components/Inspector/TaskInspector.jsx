import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { diffDays } from '../../utils/dateHelpers';
import {
  X,
  Share2,
  Bell,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Scale,
  MessageSquare,
  Send,
  Sparkles,
  Radar,
  Flame,
  Diamond,
  CheckSquare,
  Square
} from 'lucide-react';

export default function TaskInspector() {
  const {
    tasks,
    dependencies,
    teammates,
    comments,
    selectedTaskId,
    setSelectedTaskId,
    updateTaskStatus,
    assignTask,
    resolveBlocker,
    addComment,
    showToast,
  } = useProject();

  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'comments' | 'decisions'
  const [newCommentText, setNewCommentText] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');

  if (!selectedTaskId) return null;

  const task = tasks.find(t => t.id === selectedTaskId);
  if (!task) return null;

  const assignee = teammates.find(m => m.id === task.assignee_id);
  const duration = task.is_milestone ? 0 : Math.max(1, diffDays(task.start_date, task.end_date) + 1);

  // Upstream dependencies (waiting on)
  const upstreamDeps = dependencies
    .filter(d => d.successor_id === task.id)
    .map(d => {
      const pred = tasks.find(t => t.id === d.predecessor_id);
      return { dep: d, task: pred };
    })
    .filter(item => item.task);

  // Downstream dependencies (blocking)
  const downstreamDeps = dependencies
    .filter(d => d.predecessor_id === task.id)
    .map(d => {
      const succ = tasks.find(t => t.id === d.successor_id);
      return { dep: d, task: succ };
    })
    .filter(item => item.task);

  // Comments for this task
  const taskComments = comments.filter(c => c.task_id === task.id);
  const pinnedDecisions = taskComments.filter(c => c.is_decision);
  const filteredComments = taskComments.filter(c => {
    if (filterMode === 'decisions') return c.is_decision;
    if (filterMode === 'comments') return !c.is_decision;
    return true;
  });

  const handlePostComment = (asDecision = false) => {
    if (!newCommentText.trim()) return;
    addComment(task.id, newCommentText.trim(), asDecision);
    setNewCommentText('');
  };

  const copyPermalink = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast(`Copied permalink for ${task.id} to clipboard!`, 'info');
  };

  const toggleSubtask = (subtaskId) => {
    // Local toggle on task subtasks
    task.subtasks = task.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    showToast('Subtask updated', 'info');
  };

  return (
    <div className="w-[460px] shrink-0 border-l border-[#E2E8F0] dark:border-[#22252B] bg-[#FFFFFF] dark:bg-[#181A1F] flex flex-col h-full shadow-2xl z-30 select-none animate-in slide-in-from-right duration-200">
      {/* Top Action Bar */}
      <div className="h-14 border-b border-[#E2E8F0] dark:border-[#22252B] px-4 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#121417]/50">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            {task.id}
          </span>
          {task.is_milestone && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/30">
              Milestone
            </span>
          )}
          {task.added_post_baseline && (
            <span className="flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
              <Radar className="w-2.5 h-2.5 mr-0.5" />
              Scope Creep
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={copyPermalink}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#22252B] transition-colors"
            title="Copy permalink"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => showToast(`Watching updates for ${task.id}`, 'info')}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#22252B] transition-colors"
            title="Watch task notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedTaskId(null)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#22252B] transition-colors"
            title="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Blocker Sentinel Alert (Conditional) */}
        {task.status === 'blocked' && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>BLOCKER SENTINEL ESCALATION</span>
              </div>
              <button
                onClick={() => resolveBlocker(task.id)}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-2xs"
              >
                Resolve & Unblock
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {task.blocker_reason || `Waiting on prerequisite ${task.blocked_by} to be completed.`}
            </p>
          </div>
        )}

        {/* Task Title */}
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
          {task.title}
        </h2>

        {/* Dependency Strip (Waiting on / Blocking pills) */}
        <div className="space-y-1.5">
          {upstreamDeps.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Upstream:</span>
              {upstreamDeps.map(({ task: pred }) => (
                <button
                  key={pred.id}
                  onClick={() => setSelectedTaskId(pred.id)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 dark:bg-[#121417] hover:bg-slate-200 dark:hover:bg-[#22252B] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#22252B] transition-colors"
                >
                  <ArrowLeft className="w-3 h-3 text-indigo-400" />
                  <span>Waiting on: {pred.id} ({pred.status})</span>
                </button>
              ))}
            </div>
          )}

          {downstreamDeps.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Downstream:</span>
              {downstreamDeps.map(({ task: succ }) => (
                <button
                  key={succ.id}
                  onClick={() => setSelectedTaskId(succ.id)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 dark:bg-[#121417] hover:bg-slate-200 dark:hover:bg-[#22252B] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#22252B] transition-colors"
                >
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                  <span>Blocking: {succ.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2-Column Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#121417] border border-slate-200/80 dark:border-[#22252B] text-xs">
          {/* Status */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Status</label>
            <select
              value={task.status}
              onChange={(e) => updateTaskStatus(task.id, e.target.value)}
              className="w-full px-2 py-1 rounded bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 font-mono text-[11px] focus:outline-hidden"
            >
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review (Trigger Handoff)</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Assignee</label>
            <select
              value={task.assignee_id}
              onChange={(e) => assignTask(task.id, e.target.value)}
              className="w-full px-2 py-1 rounded bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
            >
              {teammates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.timezone})
                </option>
              ))}
            </select>
          </div>

          {/* Dates & Duration */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Dates & Duration</label>
            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 block">
              {task.start_date.slice(5)} → {task.end_date.slice(5)} • {duration}d
            </span>
          </div>

          {/* Effort */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Effort Estimate</label>
            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 block">
              {task.estimated_hours} hrs ({Math.round(task.estimated_hours / duration)}h/day)
            </span>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              Description & Specifications
            </h3>
            <button
              onClick={() => {
                if (!isEditingDescription) setDescriptionDraft(task.description);
                else task.description = descriptionDraft;
                setIsEditingDescription(!isEditingDescription);
              }}
              className="text-[11px] text-indigo-400 hover:underline font-mono"
            >
              {isEditingDescription ? 'Save' : 'Edit'}
            </button>
          </div>

          {isEditingDescription ? (
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              rows={5}
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-[#121417] border border-slate-300 dark:border-[#22252B] text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden"
            />
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121417] border border-slate-200/80 dark:border-[#22252B] text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans">
              {task.description}
            </div>
          )}
        </div>

        {/* Subtasks Checklist */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div>
            <h3 className="text-[11px] font-mono uppercase text-slate-400 tracking-wider mb-2">
              Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})
            </h3>
            <div className="space-y-1.5">
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  onClick={() => toggleSubtask(subtask.id)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#121417] hover:bg-slate-100 dark:hover:bg-[#1e2127] cursor-pointer text-xs transition-colors"
                >
                  {subtask.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className={subtask.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity & Decision Stream Header */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#22252B]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              Discussion & Decisions
            </h3>
            {/* Filter Toggle */}
            <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] text-[10px] font-mono">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded ${filterMode === 'all' ? 'bg-white dark:bg-[#181A1F] text-indigo-400 font-semibold' : 'text-slate-400'}`}
              >
                All ({taskComments.length})
              </button>
              <button
                onClick={() => setFilterMode('decisions')}
                className={`px-2 py-0.5 rounded ${filterMode === 'decisions' ? 'bg-white dark:bg-[#181A1F] text-indigo-400 font-semibold' : 'text-slate-400'}`}
              >
                Decisions ({pinnedDecisions.length})
              </button>
            </div>
          </div>

          {/* Pinned Decisions Card at Top of Stream */}
          {pinnedDecisions.map((decision) => (
            <div
              key={decision.id}
              className="mb-3 p-3 rounded-r-lg border-l-4 border-indigo-500 bg-indigo-500/10 text-xs text-slate-200 space-y-1 shadow-2xs"
            >
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px] font-mono">
                <Scale className="w-3.5 h-3.5" />
                <span>PINNED ARCHITECTURAL DECISION</span>
              </div>
              <p className="text-slate-100 font-medium leading-relaxed">{decision.content}</p>
              <span className="text-[10px] font-mono text-slate-400 block">
                Locked on {decision.timestamp.slice(0, 10)}
              </span>
            </div>
          ))}

          {/* Comment Thread Items */}
          <div className="space-y-2 mb-4">
            {filteredComments.map((comm) => {
              const author = teammates.find(m => m.id === comm.author_id);

              return (
                <div
                  key={comm.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#121417] border border-slate-200/80 dark:border-[#22252B] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {author && (
                        <img
                          src={author.avatar}
                          alt={author.name}
                          className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-400"
                        />
                      )}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {author ? author.name : 'Teammate'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {comm.timestamp.slice(11, 16)}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {comm.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pinned Comment Composer at Bottom of Drawer */}
      <div className="p-3 border-t border-[#E2E8F0] dark:border-[#22252B] bg-slate-50/70 dark:bg-[#121417]/80 shrink-0 space-y-2">
        <textarea
          rows={2}
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Leave a comment, or record an architectural consensus... (@mention teammates)"
          className="w-full p-2.5 rounded-lg text-xs bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-brand resize-none"
        />

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handlePostComment(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors"
            title="Pin this comment as the definitive decision card"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Mark as Decision</span>
          </button>

          <button
            onClick={() => handlePostComment(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand hover:bg-brand-light text-white shadow-xs transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </div>
      </div>
    </div>
  );
}
