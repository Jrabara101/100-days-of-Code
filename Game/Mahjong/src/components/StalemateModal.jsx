import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function StalemateModal({ onShuffle }) {
    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
            <div className="glass-panel bg-[#151c26]/95 px-6 py-4 rounded-xl border border-[#ffb4ab]/50 flex items-center gap-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                <AlertTriangle className="w-8 h-8 text-[#ffb4ab]" />
                <div>
                    <h3 className="font-bold text-[#ffb4ab] text-sm">NO MORE VALID MOVES</h3>
                    <p className="text-xs text-[#bdc8d1]">Use Shuffle to randomize layout or Undo your last move.</p>
                </div>
                <button
                    onClick={onShuffle}
                    className="bg-[#ffbcbf] text-[#67001b] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#ffbcbf]/90 transition-all active:scale-95"
                >
                    Shuffle
                </button>
            </div>
        </div>
    );
}
