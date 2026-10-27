import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Command,
  Search,
  Calendar,
  Kanban,
  List,
  Users,
  Flame,
  FlaskConical,
  Plus,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';

export default function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    tasks,
    teammates,
    createTask,
    setSelectedTaskId,
    setActiveView,
    setShowCriticalPath,
    enterSandboxMode,
    showToast,
  } = useProject();

  const [inputVal, setInputVal] = useState('');

  if (!isCommandPaletteOpen) return null;

  // Natural language parser for syntax: "Implement OAuth flow @alex !high ~3d >Milestone:Beta"
  const handleExecuteInput = () => {
    if (!inputVal.trim()) return;

    let text = inputVal;
    let assigneeId = 'user-alex';
    let priority = 'medium';
    let durationDays = 3;

    // Check @assignee
    const assigneeMatch = text.match(/@(\w+)/);
    if (assigneeMatch) {
      const handle = `@${assigneeMatch[1].toLowerCase()}`;
      const found = teammates.find(m => m.handle.toLowerCase() === handle);
      if (found) assigneeId = found.id;
      text = text.replace(/@\w+/, '').trim();
    }

    // Check !priority
    const priorityMatch = text.match(/!(urgent|high|medium|low)/i);
    if (priorityMatch) {
      priority = priorityMatch[1].toLowerCase();
      text = text.replace(/!(urgent|high|medium|low)/i, '').trim();
    }

    // Check ~duration
    const durationMatch = text.match(/~(\d+)d/i);
    if (durationMatch) {
      durationDays = parseInt(durationMatch[1], 10);
      text = text.replace(/~\d+d/i, '').trim();
    }

    // Clean remaining text as title
    const title = text.replace(/>\w+/, '').trim() || 'Quick Keyboard Task';

    createTask({
      title,
      assignee_id: assigneeId,
      priority,
      estimated_hours: durationDays * 8,
      start_date: '2026-10-28',
      end_date: '2026-11-02',
    });

    setIsCommandPaletteOpen(false);
    setInputVal('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsCommandPaletteOpen(false);
    } else if (e.key === 'Enter') {
      handleExecuteInput();
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(inputVal.toLowerCase()) ||
    t.id.toLowerCase().includes(inputVal.toLowerCase())
  ).slice(0, 4);

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/70 backdrop-blur-xs select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Command Input Box */}
        <div className="p-3 border-b border-slate-200 dark:border-[#22252B] flex items-center gap-2.5 bg-slate-50 dark:bg-[#121417]">
          <Command className="w-4 h-4 text-indigo-500 shrink-0" />
          <input
            autoFocus
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type a task command (e.g. Implement OAuth @alex !high ~3d) or search..."
            className="w-full bg-transparent text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggestion & Commands List */}
        <div className="p-2 space-y-1 text-xs max-h-80 overflow-y-auto">
          {inputVal.trim() && (
            <div
              onClick={handleExecuteInput}
              className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 cursor-pointer flex items-center justify-between font-medium"
            >
              <div className="flex items-center gap-2 truncate">
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">Create Task: "{inputVal}"</span>
              </div>
              <span className="font-mono text-[10px] bg-indigo-500/20 px-1.5 py-0.5 rounded">Enter ↵</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-1 text-[10px] font-mono uppercase text-slate-400 px-2 py-1">
            Quick Actions
          </div>

          <div
            onClick={() => {
              setActiveView('gantt');
              setIsCommandPaletteOpen(false);
            }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121417] text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Switch to Split Gantt Timeline</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">View</span>
          </div>

          <div
            onClick={() => {
              setActiveView('kanban');
              setIsCommandPaletteOpen(false);
            }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121417] text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Kanban className="w-3.5 h-3.5 text-blue-400" />
              <span>Switch to Sprint Kanban Board</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">View</span>
          </div>

          <div
            onClick={() => {
              setShowCriticalPath(prev => !prev);
              setIsCommandPaletteOpen(false);
            }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121417] text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Toggle Critical Path Spotlight</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">Toggle</span>
          </div>

          <div
            onClick={() => {
              enterSandboxMode();
              setIsCommandPaletteOpen(false);
            }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121417] text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
              <span>Enter What-If Sandbox Simulation Mode</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">Mode</span>
          </div>

          {/* Matching Tasks */}
          {filteredTasks.length > 0 && (
            <>
              <div className="pt-2 text-[10px] font-mono uppercase text-slate-400 px-2 py-1">
                Matching Tasks
              </div>
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setIsCommandPaletteOpen(false);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121417] text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[10px] text-indigo-400 font-semibold">{t.id}</span>
                    <span className="truncate">{t.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase">{t.status}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-2.5 border-t border-slate-200 dark:border-[#22252B] bg-slate-50 dark:bg-[#121417] flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Syntax: Task title @owner !priority ~duration</span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
}
