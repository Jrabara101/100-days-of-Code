import React from 'react';

export function MetricsHUD({ timeSeconds, tilesRemaining, totalTiles, availableMoves }) {
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="hidden md:flex absolute top-[90px] right-6 flex-col gap-4 pointer-events-auto z-40">
            <div className="glass-panel bg-[#151c26]/90 p-4 w-52 rounded-lg border border-[#38bdf8]/25 shadow-2xl">
                <div className="flex flex-col gap-3">
                    <div>
                        <span className="font-mono text-[11px] text-[#87929a] uppercase tracking-wider">Time Elapsed</span>
                        <div className="font-mono text-xl text-[#8ed5ff] tracking-widest mt-0.5">{formatTime(timeSeconds)}</div>
                    </div>
                    <div className="h-px w-full bg-[#38bdf8]/20"></div>
                    <div>
                        <span className="font-mono text-[11px] text-[#87929a] uppercase tracking-wider">Tiles Remaining</span>
                        <div className="font-mono text-lg text-[#dce3f0] tracking-widest mt-0.5">{tilesRemaining} / {totalTiles}</div>
                        <div className="w-full h-1.5 bg-[#2e353f] mt-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#8ed5ff] transition-all duration-300 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                                style={{ width: `${totalTiles > 0 ? (tilesRemaining / totalTiles) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="h-px w-full bg-[#38bdf8]/20"></div>
                    <div>
                        <span className="font-mono text-[11px] text-[#87929a] uppercase tracking-wider">Available Moves</span>
                        <div className={`font-mono text-xl tracking-widest mt-0.5 ${availableMoves > 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab] animate-pulse'}`}>
                            {availableMoves}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
