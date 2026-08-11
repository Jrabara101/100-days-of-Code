import React from 'react';
import { Trophy } from 'lucide-react';

export function VictoryModal({ timeSeconds, score, onRestart }) {
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 pointer-events-auto">
            <div className="glass-panel max-w-md w-full p-8 rounded-2xl text-center border-2 border-[#4edea3]/50 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-[#4edea3]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#4edea3]">
                    <Trophy className="w-8 h-8 text-[#4edea3]" />
                </div>
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-[#4edea3] tracking-wide">VICTORY ACHIEVED!</h2>
                <p className="text-sm text-[#bdc8d1] mt-2">You successfully cleared the 3D Mahjong Solitaire pyramid!</p>

                <div className="my-6 p-4 bg-[#151c26]/90 rounded-xl flex justify-around font-mono text-sm border border-[#38bdf8]/20">
                    <div>
                        <div className="text-xs text-[#87929a]">Time</div>
                        <div className="text-[#8ed5ff] font-bold mt-1">{formatTime(timeSeconds)}</div>
                    </div>
                    <div className="w-px bg-[#38bdf8]/20"></div>
                    <div>
                        <div className="text-xs text-[#87929a]">Final Score</div>
                        <div className="text-[#4edea3] font-bold mt-1">{score}</div>
                    </div>
                </div>

                <button
                    onClick={onRestart}
                    className="w-full bg-[#4edea3] text-[#003824] font-bold py-3 rounded-xl hover:bg-[#4edea3]/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(78,222,163,0.5)]"
                >
                    PLAY AGAIN
                </button>
            </div>
        </div>
    );
}
