import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { cn } from '@/lib/utils';

export const ComboCallout: React.FC = () => {
  const { callout } = useGameStore();

  if (!callout.visible) return null;

  const typeGradients = {
    sync: 'from-cyan-400 via-white to-blue-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]',
    jump: 'from-amber-300 via-yellow-100 to-amber-500 drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]',
    hazard: 'from-rose-500 via-red-200 to-rose-600 drop-shadow-[0_0_25px_rgba(244,63,94,0.8)]',
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div className="text-center animate-in zoom-in-75 fade-in duration-150">
        <div
          className={cn(
            'text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r font-sans',
            typeGradients[callout.type] || typeGradients.sync
          )}
        >
          {callout.message}
        </div>
        {callout.combo > 1 && (
          <div className="text-sm font-mono text-amber-300 mt-1 tracking-widest uppercase font-bold">
            COMBO STREAK x{callout.combo}
          </div>
        )}
      </div>
    </div>
  );
};
