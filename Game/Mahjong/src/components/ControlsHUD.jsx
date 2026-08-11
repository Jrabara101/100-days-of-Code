import React from 'react';
import { Undo2, Lightbulb, Shuffle, RotateCcw } from 'lucide-react';

export function ControlsHUD({ onUndo, onHint, onShuffle, onRestart, canUndo, canHint }) {
    return (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
            <div className="glass-panel bg-[#151c26]/90 px-6 py-3 rounded-2xl flex items-center gap-4 sm:gap-6 shadow-2xl border border-[#38bdf8]/30">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="flex flex-col items-center justify-center text-[#bdc8d1] hover:text-[#8ed5ff] disabled:opacity-30 disabled:hover:text-[#bdc8d1] transition-all active:scale-95 group"
                >
                    <Undo2 className="w-6 h-6 group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                    <span className="font-mono text-[10px] mt-1">Undo</span>
                </button>

                <div className="h-8 w-px bg-[#38bdf8]/20"></div>

                <button
                    onClick={onHint}
                    disabled={!canHint}
                    className="flex flex-col items-center justify-center text-[#bdc8d1] hover:text-[#4edea3] disabled:opacity-30 disabled:hover:text-[#bdc8d1] transition-all active:scale-95 group"
                >
                    <Lightbulb className="w-6 h-6 group-hover:drop-shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
                    <span className="font-mono text-[10px] mt-1">Hint</span>
                </button>

                <div className="h-8 w-px bg-[#38bdf8]/20"></div>

                <button
                    onClick={onShuffle}
                    className="flex flex-col items-center justify-center text-[#bdc8d1] hover:text-[#ffbcbf] transition-all active:scale-95 group"
                >
                    <Shuffle className="w-6 h-6 group-hover:drop-shadow-[0_0_8px_rgba(255,188,191,0.8)]" />
                    <span className="font-mono text-[10px] mt-1">Shuffle</span>
                </button>

                <div className="h-8 w-px bg-[#38bdf8]/20"></div>

                <button
                    onClick={onRestart}
                    className="flex flex-col items-center justify-center text-[#bdc8d1] hover:text-[#ffb4ab] transition-all active:scale-95 group"
                >
                    <RotateCcw className="w-6 h-6 group-hover:drop-shadow-[0_0_8px_rgba(255,180,171,0.8)]" />
                    <span className="font-mono text-[10px] mt-1">Restart</span>
                </button>
            </div>
        </nav>
    );
}
