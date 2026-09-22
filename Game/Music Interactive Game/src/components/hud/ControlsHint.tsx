import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export const ControlsHint: React.FC = () => {
  const { settings } = useGameStore();

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-surface/80 border border-cyan-500/20 backdrop-blur-md text-xs font-mono text-slate-400 opacity-70 hover:opacity-100 transition-opacity pointer-events-auto">
        <span className="flex items-center gap-1">
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
            A
          </kbd>
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
            D
          </kbd>
          <span className="text-[11px] text-slate-400 ml-1">or Arrows: Shift Lanes</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
          <kbd className="px-3 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">
            SPACE
          </kbd>
          <span className="text-[11px] text-slate-400 ml-1">Beat Jump</span>
        </span>
        {settings.zenMode && (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold text-[11px]">ZEN VIBE ACTIVE</span>
          </>
        )}
      </div>
    </div>
  );
};
