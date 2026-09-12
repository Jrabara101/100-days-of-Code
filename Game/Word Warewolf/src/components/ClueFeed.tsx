import React from 'react';
import { CouncilSessionState } from '../engine/types';
import { MessageSquare, Mic, AlertTriangle } from 'lucide-react';

interface ClueFeedProps {
  session: CouncilSessionState;
}

export const ClueFeed: React.FC<ClueFeedProps> = ({ session }) => {
  const { players, clueTurnIndex, state, telemetryLog } = session;

  return (
    <div className="bg-[#0b0d1a]/95 backdrop-blur-sm p-4 pixel-frame-sky flex flex-col h-full">
      {/* Feed Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-[#323442]">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[#38bdf8]" />
          <span className="font-display text-xs md:text-sm text-[#38bdf8] uppercase tracking-wider font-bold">
            TRANSCRIPT // CLUE FEED
          </span>
        </div>
        <span className="text-[10px] text-[#94a3b8] font-mono">[SYNC: LIVE_FEED_04]</span>
      </div>

      {/* 4 Council Seat Cards */}
      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[460px] pr-1">
        {players.map((player) => {
          const isSpeaking = state === 'CLUES' && clueTurnIndex === player.id;
          const isHighSuspicion = player.suspicion > 0.4;
          const borderClass = player.id === 0
            ? 'pixel-frame-sky'
            : player.id === 1
            ? 'pixel-frame-amber'
            : isHighSuspicion
            ? 'pixel-frame-rose'
            : 'pixel-frame-neutral';

          return (
            <div
              key={player.id}
              className={`p-3 bg-[#10131f] ${borderClass} transition-all ${
                isSpeaking ? 'ring-1 ring-[#38bdf8] bg-[#191b28]' : ''
              }`}
            >
              {/* Card Top Row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 block shadow-[1px_1px_0_0_#000]"
                    style={{ backgroundColor: player.colorHex }}
                  ></span>
                  <span className="font-display text-xs font-bold text-[#e1e1f3]">
                    {player.name}
                  </span>
                  {player.isHuman && (
                    <span className="px-1 py-[1px] bg-[#38bdf8]/20 text-[#38bdf8] text-[9px] font-mono border border-[#38bdf8]/40">
                      (YOU)
                    </span>
                  )}
                </div>

                {isSpeaking ? (
                  <span className="flex items-center gap-1 text-[10px] text-[#f59e0b] font-mono animate-pulse">
                    <Mic size={12} /> [SPEAKING]
                  </span>
                ) : isHighSuspicion ? (
                  <span className="px-1.5 py-[1px] bg-[#f43f5e]/20 text-[#f43f5e] text-[9px] font-mono border border-[#f43f5e]/40 flex items-center gap-1">
                    <AlertTriangle size={10} /> [!] HIGH SUSPICION
                  </span>
                ) : (
                  <span className="text-[10px] text-[#94a3b8] font-mono">
                    {player.clue ? '[*] DISPATCHED' : '[WAITING]'}
                  </span>
                )}
              </div>

              {/* Dispatch Content Box */}
              <div className="bg-[#0b0d1a] p-2 text-xs font-mono text-[#e1e1f3] pixel-inset-panel">
                <span className="text-[#94a3b8] text-[10px]">&gt; DISPATCH: </span>
                {player.clue ? (
                  <span className="text-[#e1e1f3] font-bold tracking-wide">
                    "{player.clue}"
                  </span>
                ) : (
                  <span className="text-[#94a3b8]/40 italic">
                    {isSpeaking ? 'Formulating transmission...' : 'Pending turn...'}
                  </span>
                )}
              </div>

              {/* Suspicion & Telemetry Footer */}
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[#94a3b8]">
                <span>
                  BAYESIAN: <strong className={isHighSuspicion ? 'text-[#f43f5e]' : 'text-[#38bdf8]'}>
                    {(player.suspicion * 100).toFixed(1)}%
                  </strong>
                </span>
                {player.votes > 0 && (
                  <span className="text-[#f43f5e] font-bold">
                    TRIBUNAL: {player.votes} VOTES
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Historical Timestamp Telemetry Console */}
        <div className="mt-2 p-2 bg-[#060814] font-mono text-[10px] text-[#94a3b8] flex flex-col gap-1 border border-[#323442]">
          <div className="text-[9px] text-[#38bdf8] font-display uppercase tracking-widest">
            SESSION TELEMETRY LOG (LAST 4 EVENTS)
          </div>
          {telemetryLog.slice(-4).map((evt) => (
            <div
              key={evt.id}
              className={`leading-tight truncate ${evt.highlight ? 'text-[#f43f5e] font-bold' : 'text-[#94a3b8]'}`}
            >
              [{evt.tickHex}] {evt.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
