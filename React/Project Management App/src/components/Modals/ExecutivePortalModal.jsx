import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Lock,
  Copy,
  X,
  Layers,
  Diamond,
  TrendingUp
} from 'lucide-react';

export default function ExecutivePortalModal() {
  const { isExecPortalOpen, setIsExecPortalOpen, project, tasks, showToast } = useProject();

  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  if (!isExecPortalOpen) return null;

  const milestones = [
    { title: 'Phase 1: Architecture & Data Layer', date: 'Oct 19, 2026', status: 'Completed', color: 'emerald' },
    { title: 'Phase 2: Stitch Design Tokens & Canvas Virtualization', date: 'Oct 29, 2026', status: 'In Progress', color: 'blue' },
    { title: 'Phase 3: Multiplayer Presence & Workflow Handoffs', date: 'Nov 05, 2026', status: 'Scheduled', color: 'slate' },
    { title: 'Phase 4: Global Production Launch (Aura v2.0)', date: 'Nov 20, 2026', status: 'Milestone', color: 'violet' },
  ];

  const handleCopyLink = () => {
    navigator.clipboard?.writeText('https://aura.linear.app/portal/exec/aura-q4-launch?token=sec_7f99a1');
    setShareLinkCopied(true);
    showToast('Executive portal share link copied to clipboard!', 'success');
    setTimeout(() => setShareLinkCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#22252B] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-[#22252B] flex items-center justify-between bg-slate-50 dark:bg-[#0B0C0E]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Executive Stakeholder Portal (Read-Only Preview)
              </h3>
              <p className="text-[11px] text-slate-400">
                High-level milestones and launch health without low-level engineering noise.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExecPortalOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Portal Stage */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {/* Executive Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block mb-1">
                Project Health & Velocity
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {project.name}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  On Track
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">Target Launch</span>
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  Nov 20, 2026
                </span>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-[#22252B]" />
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">Baseline Variance</span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  +0 Days (Stable)
                </span>
              </div>
            </div>
          </div>

          {/* High-Level Milestone Roadmap */}
          <div>
            <h4 className="text-[11px] font-mono uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Milestone Horizon</span>
            </h4>

            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181A1F] border border-slate-200 dark:border-[#22252B] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#22252B] flex items-center justify-center font-mono text-xs font-bold text-slate-400">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {m.title}
                      </h5>
                      <span className="text-[11px] font-mono text-slate-400">
                        Target: {m.date}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    m.status === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : m.status === 'In Progress'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      : m.status === 'Milestone'
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                      : 'bg-slate-200 dark:bg-[#22252B] text-slate-400'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shareable Link Strip */}
          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-mono text-indigo-300 truncate">
                https://aura.linear.app/portal/exec/aura-q4-launch?token=sec_7f99a1
              </span>
            </div>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shrink-0 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{shareLinkCopied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
