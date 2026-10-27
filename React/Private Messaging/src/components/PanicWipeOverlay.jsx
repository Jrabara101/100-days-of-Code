import React from 'react';
import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react';

export default function PanicWipeOverlay({ isTriggered, onDismiss }) {
  if (!isTriggered) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/95 backdrop-blur-2xl text-white select-none animate-ping-once">
      <div className="flex flex-col items-center text-center max-w-md p-8 rounded-3xl bg-black/80 border-2 border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.6)]">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-500 mb-6 glow-hazard animate-bounce">
          <Zap className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-black tracking-wider text-red-400 mb-2 font-mono uppercase">
          Memory Purged
        </h1>
        <p className="text-xs text-red-200/80 font-mono mb-6 leading-relaxed">
          Cryptographic keys zeroed in volatile RAM.<br/>
          IndexedDB vault shredded.<br/>
          Zero recoverable forensic residue remaining.
        </p>

        <button
          onClick={onDismiss}
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all shadow-lg"
        >
          Initialize Clean Ground State
        </button>
      </div>
    </div>
  );
}
