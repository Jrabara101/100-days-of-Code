import React from 'react';
import { HelpCircle, Keyboard, MousePointer, ShieldCheck, Sparkles, X } from 'lucide-react';

interface ControlsHelpModalProps {
  onClose: () => void;
}

export const ControlsHelpModal: React.FC<ControlsHelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0B0F19]/95 border border-slate-700/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-5 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100">
                Aetherial Frontier — Adventurer Codex
              </h3>
              <p className="text-xs text-slate-400">Controls, Keybindings & Realm Mechanics</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Grid */}
        <div className="space-y-3 text-xs font-sans">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-1.5 text-xs">
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Universal Movement & Navigation</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold">W A S D</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold">↑ ← ↓ →</kbd> Walk</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">Click Ground</kbd> Pathfind / Move</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-300 font-bold">E</kbd> Quick Loot Pickup</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-fuchsia-300 font-bold">Click Player</kbd> Target & Inspect</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h4 className="font-bold text-cyan-300 mb-2 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Spatial Backpack & Inventory</span>
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <p>• <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold font-mono">I</kbd> Toggle Spatial Backpack.</p>
              <p>• <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold font-mono">R</kbd> Rotate items (1x2, 1x3, 2x1) while dragging or hovering.</p>
              <p>• <span className="font-bold text-white">Drag Outside Window:</span> Physically tosses item onto the ground at your feet as live loot for nearby players.</p>
              <p>• <span className="font-bold text-white">Right-Click Item:</span> Quick equips weapon/armor or drinks potion draught.</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h4 className="font-bold text-emerald-300 mb-2 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Double-Lock Peer Trading & Anti-Scam</span>
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <p>• Stand near any player (&lt; 200px) and click <span className="font-bold text-amber-300">"Trade"</span>.</p>
              <p>• Both stage items and gold. Both must click <span className="font-bold text-white">"Lock Offer"</span>.</p>
              <p>• Any last-second item swap automatically resets both locks and cancels the 3-second countdown!</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow"
          >
            Got it, Return to Realm
          </button>
        </div>
      </div>
    </div>
  );
};
