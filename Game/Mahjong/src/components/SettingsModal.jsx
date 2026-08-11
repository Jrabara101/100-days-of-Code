import React from 'react';
import { Settings, X } from 'lucide-react';

export function SettingsModal({ onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 pointer-events-auto">
            <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-[#38bdf8]/40 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#8ed5ff] flex items-center gap-2">
                        <Settings className="w-5 h-5" /> CONTROLS & SETTINGS
                    </h3>
                    <button onClick={onClose} className="text-[#87929a] hover:text-[#dce3f0]">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-3 text-xs text-[#bdc8d1]">
                    <div className="flex justify-between items-center p-3 bg-[#151c26]/80 rounded-lg border border-[#38bdf8]/10">
                        <span>Rotate 3D Camera</span>
                        <span className="font-mono text-[#4edea3]">Right-Click + Drag</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#151c26]/80 rounded-lg border border-[#38bdf8]/10">
                        <span>Select Tile</span>
                        <span className="font-mono text-[#4edea3]">Left Click</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-[#8ed5ff] text-[#00354a] font-bold py-2.5 rounded-xl hover:bg-[#8ed5ff]/90 transition-all"
                >
                    CLOSE
                </button>
            </div>
        </div>
    );
}
