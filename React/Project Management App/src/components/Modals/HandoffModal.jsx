import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { ArrowRight, CheckSquare, Square, Sparkles, X, ShieldCheck } from 'lucide-react';

export default function HandoffModal() {
  const { activeHandoffTask, setActiveHandoffTask, teammates, completeHandoff } = useProject();

  const [selectedNextOwner, setSelectedNextOwner] = useState('user-alex');
  const [handoffNotes, setHandoffNotes] = useState('');
  const [checklist, setChecklist] = useState([
    { id: 'c1', label: 'Definition-of-Ready criteria reviewed & approved', checked: true },
    { id: 'c2', label: 'Design tokens and responsive assets attached', checked: true },
    { id: 'c3', label: 'API contract & database schema verified', checked: false },
    { id: 'c4', label: 'Test coverage benchmarks specified (>85%)', checked: false },
  ]);

  if (!activeHandoffTask) return null;

  const currentOwner = teammates.find(m => m.id === activeHandoffTask.assignee_id);
  const nextOwner = teammates.find(m => m.id === selectedNextOwner);

  const toggleCheck = (id) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
  };

  const handleConfirmHandoff = () => {
    completeHandoff(activeHandoffTask.id, selectedNextOwner, handoffNotes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#22252B] flex items-center justify-between bg-slate-50 dark:bg-[#121417]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Structured Handoff Baton Ritual
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Passing ownership for {activeHandoffTask.id}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveHandoffTask(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Owner Transition Visual Baton */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] flex items-center justify-around">
            {/* Current Owner */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <img
                src={currentOwner?.avatar}
                alt={currentOwner?.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {currentOwner?.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Current Phase</span>
            </div>

            {/* Baton Sweep Arrow */}
            <div className="flex flex-col items-center text-indigo-500">
              <span className="text-[10px] font-mono uppercase tracking-wider mb-0.5 font-bold">
                Pass Baton
              </span>
              <ArrowRight className="w-6 h-6 animate-pulse" />
            </div>

            {/* Next Owner */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <img
                src={nextOwner?.avatar}
                alt={nextOwner?.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {nextOwner?.name}
              </span>
              <span className="text-[10px] text-emerald-500 font-mono font-medium">New Assignee</span>
            </div>
          </div>

          {/* Select Next Assignee */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Select Incoming Stage Owner
            </label>
            <select
              value={selectedNextOwner}
              onChange={(e) => setSelectedNextOwner(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
            >
              {teammates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role} ({m.timezone})
                </option>
              ))}
            </select>
          </div>

          {/* Definition-of-Ready Checklist */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Definition-of-Ready Verification</span>
            </label>
            <div className="space-y-1.5">
              {checklist.map((c) => (
                <div
                  key={c.id}
                  onClick={() => toggleCheck(c.id)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#121417] hover:bg-slate-100 dark:hover:bg-[#1e2127] cursor-pointer transition-colors"
                >
                  {c.checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className={c.checked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Handoff Notes */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Handoff Context & Spec Links (Optional)
            </label>
            <textarea
              rows={2}
              value={handoffNotes}
              onChange={(e) => setHandoffNotes(e.target.value)}
              placeholder="e.g., Figma spec updated with responsive breakpoints; edge case scenarios documented in PR description."
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] text-slate-800 dark:text-slate-200 placeholder-slate-400 text-xs resize-none focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#22252B] flex items-center justify-end gap-2 bg-slate-50 dark:bg-[#121417]">
          <button
            onClick={() => setActiveHandoffTask(null)}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmHandoff}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand hover:bg-brand-light text-white shadow-md hover:shadow-glow-indigo transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pass Baton & Confirm Handoff</span>
          </button>
        </div>
      </div>
    </div>
  );
}
