import React from 'react';
import { AlertTriangle, ArrowLeftRight, Layers, Sliders, XCircle } from 'lucide-react';
import { ConflictDetails } from '@/types/settings';
import { Button } from '@/components/ui/Button';

export interface ConflictDialogProps {
  details: ConflictDetails | null;
  onSwap: () => void;
  onShift: () => void;
  onModifier: () => void;
  onOverride: () => void;
  onCancel: () => void;
}

export const ConflictDialog: React.FC<ConflictDialogProps> = ({
  details,
  onSwap,
  onShift,
  onModifier,
  onOverride,
  onCancel,
}) => {
  if (!details) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-xl bg-[#0E1118] border-2 border-red-500/80 shadow-glow-crimson p-6 text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-red-950/60">
          <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500 text-red-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-sans text-red-100 uppercase tracking-wider">
              Input Collision Detected
            </h3>
            <p className="text-xs text-red-300/80 font-mono">
              COLLISION MATRIX CODE: {details.attemptedCode}
            </p>
          </div>
        </div>

        {/* Conflict comparison display */}
        <div className="my-5 p-4 rounded-lg bg-[#131722] border border-[#1E2538] flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Attempted Binding:</span>
            <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-200 font-bold">
              {details.attemptedGlyph}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded bg-red-950/30 border border-red-900/60">
            <span className="text-xs text-slate-300">
              Already allocated to <strong className="text-red-400 font-bold font-mono">[{details.conflictingActionLabel}]</strong> ({details.conflictingSlot.toUpperCase()} SLOT)
            </span>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="flex flex-col gap-2.5 mb-6">
          <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            Choose Intelligent Resolution:
          </span>

          {/* 1. Swap */}
          <button
            type="button"
            onClick={onSwap}
            className="flex items-center justify-between p-3 rounded-lg bg-[#1C2232] hover:bg-[#283145] border border-slate-700 hover:border-[#38BDF8] text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-cyan-950 text-cyan-400 group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-100 group-hover:text-cyan-300">
                  Instant One-Click Swap
                </span>
                <span className="block text-xs text-slate-400">
                  Swap bindings between both actions without leaving either unbound.
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-700/50">
              RECOMMENDED
            </span>
          </button>

          {/* 2. Cascading Shift */}
          <button
            type="button"
            onClick={onShift}
            className="flex items-center justify-between p-3 rounded-lg bg-[#1C2232] hover:bg-[#283145] border border-slate-700 hover:border-amber-400 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-amber-950 text-amber-400 group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-100 group-hover:text-amber-300">
                  Cascading Assignment Shift
                </span>
                <span className="block text-xs text-slate-400">
                  Shift conflicting action to secondary fallback or vacate slot.
                </span>
              </div>
            </div>
          </button>

          {/* 3. Attach Modifier (Ctrl + Key) */}
          <button
            type="button"
            onClick={onModifier}
            className="flex items-center justify-between p-3 rounded-lg bg-[#1C2232] hover:bg-[#283145] border border-slate-700 hover:border-purple-400 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-purple-950 text-purple-400 group-hover:scale-110 transition-transform">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-100 group-hover:text-purple-300">
                  Attach Modifier [L-CTRL + {details.attemptedGlyph}]
                </span>
                <span className="block text-xs text-slate-400">
                  Converts attempted key into a modifier chord to prevent collision.
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1E2538]">
          <Button variant="danger" size="sm" onClick={onOverride}>
            Override / Unbind Existing
          </Button>

          <Button variant="secondary" size="sm" onClick={onCancel} className="gap-1.5">
            <XCircle className="w-4 h-4" />
            Cancel Assignment
          </Button>
        </div>
      </div>
    </div>
  );
};
