import React from 'react';
import { Settings, HelpCircle } from 'lucide-react';

export function HeaderHUD({ score, onOpenSettings, onOpenHelp }) {
    return (
        <header className="fixed top-0 w-full z-50 bg-[#0d141d]/80 backdrop-blur-md border-b border-[#38bdf8]/20 shadow-[0_0_15px_rgba(56,189,248,0.2)] flex justify-between items-center px-6 py-4 pointer-events-auto">
            <div className="flex items-center gap-4">
                <span className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold text-[#8ed5ff] tracking-widest">
                    MAHJONG 3D // SOLITAIRE
                </span>
                <div className="hidden md:flex items-center gap-2 bg-[#151c26]/80 px-3 py-1 rounded-sm border border-[#38bdf8]/20 relative">
                    <span className="w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.8)]"></span>
                    <span className="font-mono text-xs text-[#4edea3] animate-pulse">SYSTEM ONLINE</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right mr-2 hidden sm:block">
                    <div className="font-mono text-[10px] text-[#87929a] uppercase">Score</div>
                    <div className="font-mono text-lg text-[#4edea3] font-bold">{score}</div>
                </div>
                <button
                    onClick={onOpenSettings}
                    className="text-[#bdc8d1] hover:text-[#8ed5ff] transition-colors p-2 rounded-full hover:bg-[#2e353f]/40"
                    title="Controls & Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
                <button
                    onClick={onOpenHelp}
                    className="text-[#bdc8d1] hover:text-[#8ed5ff] transition-colors p-2 rounded-full hover:bg-[#2e353f]/40"
                    title="Rules & Help"
                >
                    <HelpCircle className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
