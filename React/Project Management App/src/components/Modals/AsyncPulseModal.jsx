import React from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Clock,
  X,
  Radar,
  ArrowRight
} from 'lucide-react';

export default function AsyncPulseModal() {
  const { isPulseDigestOpen, setIsPulseDigestOpen, tasks, teammates, setSelectedTaskId } = useProject();

  if (!isPulseDigestOpen) return null;

  const completedTasks = tasks.filter(t => t.status === 'done');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  const creepTasks = tasks.filter(t => t.added_post_baseline);
  const activeTasks = tasks.filter(t => t.status === 'in_progress');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#22252B] flex items-center justify-between bg-slate-50 dark:bg-[#121417]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Automated Morning Async Pulse Rollup
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Oct 23, 2026
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                High-clarity morning digest replacing traditional status syncs.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPulseDigestOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Stream */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Key Metric Bar */}
          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B]">
              <span className="text-[10px] text-slate-400 block">Completed</span>
              <span className="text-base font-bold text-emerald-500">{completedTasks.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B]">
              <span className="text-[10px] text-slate-400 block">In Flight</span>
              <span className="text-base font-bold text-blue-500">{activeTasks.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B]">
              <span className="text-[10px] text-slate-400 block">Active Blockers</span>
              <span className="text-base font-bold text-rose-500">{blockedTasks.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B]">
              <span className="text-[10px] text-slate-400 block">Post-Baseline Scope</span>
              <span className="text-base font-bold text-amber-500">+{creepTasks.length}</span>
            </div>
          </div>

          {/* Active Obstacles & Escalations */}
          {blockedTasks.length > 0 && (
            <div>
              <h4 className="text-[11px] font-mono uppercase text-rose-500 font-bold tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Action Needed: Active Blockers ({blockedTasks.length})</span>
              </h4>
              <div className="space-y-1.5">
                {blockedTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTaskId(t.id);
                      setIsPulseDigestOpen(false);
                    }}
                    className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/15 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-rose-400 mb-1">
                      <span>{t.id}: {t.title}</span>
                      <span>Owner: {teammates.find(m => m.id === t.assignee_id)?.name}</span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      {t.blocker_reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Completed Yesterday */}
          <div>
            <h4 className="text-[11px] font-mono uppercase text-emerald-500 font-bold tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Shipped & Completed ({completedTasks.length})</span>
            </h4>
            <div className="space-y-1.5">
              {completedTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[11px] text-slate-500">{t.id}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{t.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {t.estimated_hours}h effort
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Scope Creep Alert */}
          {creepTasks.length > 0 && (
            <div>
              <h4 className="text-[11px] font-mono uppercase text-amber-500 font-bold tracking-wider mb-2 flex items-center gap-1.5">
                <Radar className="w-3.5 h-3.5" />
                <span>Scope-Creep Sentinel ({creepTasks.length} Injected Post-Baseline)</span>
              </h4>
              <div className="space-y-1.5">
                {creepTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[11px] text-amber-500 font-bold">{t.id}</span>
                      <span className="text-slate-200 truncate">{t.title}</span>
                    </div>
                    <span className="font-mono text-[10px] text-amber-400 shrink-0">
                      +{t.estimated_hours}h added
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-[#22252B] flex items-center justify-between bg-slate-50 dark:bg-[#121417] text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
            Next async rollup scheduled for 09:00 AM UTC
          </span>
          <button
            onClick={() => setIsPulseDigestOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-light text-white font-semibold shadow-xs transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
