import React from 'react';
import { HelpCircle, X } from 'lucide-react';

export function HelpModal({ onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 pointer-events-auto">
            <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-[#38bdf8]/40 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#8ed5ff] flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" /> MAHJONG 3D RULES
                    </h3>
                    <button onClick={onClose} className="text-[#87929a] hover:text-[#dce3f0]">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-3 text-xs text-[#bdc8d1] leading-relaxed">
                    <p><strong className="text-[#8ed5ff]">Objective:</strong> Clear all 3D Mahjong tiles by matching pairs of identical tiles.</p>
                    <p><strong className="text-[#8ed5ff]">3D Occlusion Rules:</strong> A tile is selectable ONLY if:</p>
                    <ul className="list-disc pl-5 space-y-1 text-[#dce3f0]">
                        <li>No tile is placed directly above it.</li>
                        <li>At least one lateral side (Left or Right) is completely unblocked.</li>
                    </ul>
                    <p><strong className="text-[#8ed5ff]">Camera Orbiting:</strong> Shift + Drag or Right-Click Drag anywhere to rotate the 3D perspective.</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-[#8ed5ff] text-[#00354a] font-bold py-2.5 rounded-xl hover:bg-[#8ed5ff]/90 transition-all"
                >
                    GOT IT
                </button>
            </div>
        </div>
    );
}
