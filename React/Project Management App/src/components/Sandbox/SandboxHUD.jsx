import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { FlaskConical, AlertCircle, Check, RotateCcw } from 'lucide-react';

export default function SandboxHUD() {
  const { isSandboxMode, commitSandbox, discardSandbox, sandboxImpact } = useProject();

  if (!isSandboxMode) return null;

  const { shiftedCount, milestoneImpactDays, originalLaunch, simulatedLaunch } = sandboxImpact;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto">
      <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#181A1F]/95 backdrop-blur-md border border-amber-500/80 shadow-2xl text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-full bg-amber-500/20 text-amber-400">
            <FlaskConical className="w-3.5 h-3.5 animate-pulse" />
          </span>
          <span className="font-semibold text-amber-300">
            Sandbox Simulation Active:
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px] border-l border-amber-500/30 pl-2">
          {milestoneImpactDays > 0 ? (
            <span className="text-amber-400 font-bold">
              +{milestoneImpactDays}d impact on Final Launch ({originalLaunch} → {simulatedLaunch})
            </span>
          ) : (
            <span className="text-emerald-400">
              No delay on Final Launch ({simulatedLaunch})
            </span>
          )}
          <span className="text-slate-500">• {shiftedCount} task(s) affected</span>
        </div>

        <div className="flex items-center gap-1.5 border-l border-amber-500/30 pl-2">
          <button
            onClick={discardSandbox}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Discard</span>
          </button>
          <button
            onClick={commitSandbox}
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold shadow-xs transition-all"
          >
            <Check className="w-3 h-3 text-black stroke-[3]" />
            <span>Commit Schedule ({shiftedCount > 0 ? `Update ${shiftedCount}` : 'Apply'})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
