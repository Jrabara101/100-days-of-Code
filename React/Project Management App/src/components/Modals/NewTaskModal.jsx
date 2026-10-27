import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Plus, X, Calendar, Clock, User, Flame, Diamond, Radar } from 'lucide-react';

export default function NewTaskModal() {
  const { isNewTaskModalOpen, setIsNewTaskModalOpen, teammates, createTask } = useProject();

  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState('Phase 3: High-Velocity Workflows & Multiplayer');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('user-alex');
  const [startDate, setStartDate] = useState('2026-10-28');
  const [endDate, setEndDate] = useState('2026-11-03');
  const [estimatedHours, setEstimatedHours] = useState(24);
  const [isMilestone, setIsMilestone] = useState(false);

  if (!isNewTaskModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title: title.trim(),
      phase,
      priority,
      assignee_id: assigneeId,
      start_date: startDate,
      end_date: isMilestone ? startDate : endDate,
      estimated_hours: isMilestone ? 0 : Number(estimatedHours),
      is_milestone: isMilestone,
    });

    setIsNewTaskModalOpen(false);
    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#22252B] flex items-center justify-between bg-slate-50 dark:bg-[#121417]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Plus className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Create New Project Task
              </h3>
              <p className="text-[11px] text-slate-400">
                Task will automatically be indexed into the Living Timeline dependency graph.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNewTaskModalOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Post-Baseline Scope Creep Warning Notice */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-500 font-mono text-[11px]">
            <Radar className="w-4 h-4 shrink-0" />
            <span>Scope-Creep Sentinel: Project baseline is locked. New tasks will be flagged.</span>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Task Title
            </label>
            <input
              autoFocus
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement WebSockets live sync and edge replication"
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden focus:border-brand"
            />
          </div>

          {/* Phase & Priority 2-Column */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Phase / Epic
              </label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
              >
                <option value="Phase 1: Architecture & Data Layer">Phase 1: Architecture & Data Layer</option>
                <option value="Phase 2: Design System & Canvas Physics">Phase 2: Design System & Canvas Physics</option>
                <option value="Phase 3: High-Velocity Workflows & Multiplayer">Phase 3: High-Velocity Workflows & Multiplayer</option>
                <option value="Phase 4: Release & Final Polish">Phase 4: Release & Final Polish</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
              >
                <option value="urgent">Urgent (P0)</option>
                <option value="high">High (P1)</option>
                <option value="medium">Medium (P2)</option>
                <option value="low">Low (P3)</option>
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
            >
              {teammates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Schedule 2-Column */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="text-[11px] uppercase text-slate-400 block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase text-slate-400 block mb-1">
                End Date
              </label>
              <input
                type="date"
                disabled={isMilestone}
                value={isMilestone ? startDate : endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden disabled:opacity-50"
              />
            </div>
          </div>

          {/* Estimated Hours & Milestone Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <input
                id="milestoneCheck"
                type="checkbox"
                checked={isMilestone}
                onChange={(e) => setIsMilestone(e.target.checked)}
                className="rounded border-slate-400 text-brand focus:ring-brand"
              />
              <label htmlFor="milestoneCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                Mark as Milestone Diamond (0-duration)
              </label>
            </div>

            {!isMilestone && (
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[11px] text-slate-400">Effort:</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-16 p-1.5 rounded-lg bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 text-xs text-center"
                />
                <span className="text-[11px] text-slate-400">hrs</span>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 dark:border-[#22252B] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewTaskModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg font-semibold bg-brand hover:bg-brand-light text-white shadow-xs transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
