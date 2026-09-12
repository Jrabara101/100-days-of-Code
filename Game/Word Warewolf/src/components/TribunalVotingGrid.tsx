import React from 'react';
import { CouncilSessionState } from '../engine/types';
import { Gavel, Clock } from 'lucide-react';

interface TribunalVotingGridProps {
  session: CouncilSessionState;
  onCastVote: (targetId: number) => void;
}

export const TribunalVotingGrid: React.FC<TribunalVotingGridProps> = ({
  session,
  onCastVote
}) => {
  const { players, state, deliberationTimeLeft } = session;

  const renderMeter = (suspicion: number) => {
    const blocks = Math.round(suspicion * 5);
    const filled = Math.min(5, Math.max(0, blocks));
    const empty = 5 - filled;
    return `[ ${'█ '.repeat(filled)}${'░ '.repeat(empty)}] ${(suspicion * 100).toFixed(0)}%`;
  };

  const renderVoteBlocks = (votes: number) => {
    const filled = Math.min(4, Math.floor(votes));
    const empty = 4 - filled;
    return `[ ${'█ '.repeat(filled)}${'░ '.repeat(empty)}] ${votes}/4`;
  };

  return (
    <div className="p-4 bg-[#0b0d1a]/95 backdrop-blur-sm pixel-frame-rose flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-[#323442]">
        <div className="flex items-center gap-2">
          <Gavel size={16} className="text-[#f43f5e]" />
          <span className="font-display text-xs md:text-sm text-[#f43f5e] uppercase tracking-wider font-bold">
            TRIBUNAL ACCUSATION ACTUATORS
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {state === 'VOTING' ? (
            <span className="flex items-center gap-1 text-[#f59e0b] font-bold animate-pulse">
              <Clock size={12} />
              WINDOW: {deliberationTimeLeft}s
            </span>
          ) : (
            <span className="text-[#94a3b8]">PHASE: {state}</span>
          )}
        </div>
      </div>

      {/* 2x2 Suspect Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {players.map((player) => {
          const isSelf = player.id === 0;
          const isHighestSuspicion =
            !isSelf &&
            player.suspicion ===
              Math.max(...players.filter(p => p.id !== 0).map(p => p.suspicion));

          const borderStyle = isSelf
            ? 'pixel-frame-neutral opacity-70'
            : isHighestSuspicion
            ? 'pixel-frame-rose'
            : 'pixel-frame-sky';

          return (
            <div
              key={player.id}
              className={`p-3 bg-[#10131f] ${borderStyle} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display text-xs font-bold text-[#e1e1f3]">
                    0{player.id + 1}. {player.name}
                  </span>
                  {isSelf ? (
                    <span className="text-[9px] font-mono text-[#94a3b8] px-1 bg-[#191b28]">
                      IMMUNE
                    </span>
                  ) : isHighestSuspicion ? (
                    <span className="text-[9px] font-mono text-[#f43f5e] bg-[#f43f5e]/10 px-1 border border-[#f43f5e]/40 font-bold animate-pulse">
                      PRIME TARGET
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-[#38bdf8] bg-[#38bdf8]/10 px-1 border border-[#38bdf8]/40">
                      SUSPECT
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-[#94a3b8] font-mono mt-1">
                  SUSPICION LEVEL:
                </div>
                <div
                  className={`text-[11px] font-mono tracking-widest mt-0.5 font-bold ${
                    isHighestSuspicion ? 'text-[#f43f5e]' : isSelf ? 'text-[#38bdf8]' : 'text-[#f59e0b]'
                  }`}
                >
                  {renderMeter(player.suspicion)}
                </div>

                <div className="text-[10px] text-[#94a3b8] font-mono mt-1">
                  LAST CLUE: <span className="text-[#e1e1f3]">{player.clue ? `"${player.clue}"` : 'NONE'}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px] font-mono text-[#94a3b8]">
                  <span>TALLY:</span>
                  <span className="font-bold text-[#e1e1f3]">
                    {renderVoteBlocks(player.votes)}
                  </span>
                </div>

                {isSelf ? (
                  <button
                    disabled
                    className="w-full py-1.5 bg-[#0b0d1a] text-[#94a3b8]/40 font-display text-[10px] cursor-not-allowed uppercase"
                  >
                    SELF CONDEMNATION PROHIBITED
                  </button>
                ) : (
                  <button
                    disabled={state !== 'VOTING'}
                    onClick={() => onCastVote(player.id)}
                    className={`w-full py-1.5 font-display text-[11px] font-bold uppercase tracking-wider pixel-btn ${
                      isHighestSuspicion
                        ? 'bg-[#b50036] hover:bg-[#f43f5e] text-[#ffdadb] shadow-[inset_2px_2px_0_0_#ffb2b7,inset_-2px_-2px_0_0_#40000d]'
                        : 'bg-[#191b28] hover:bg-[#272937] text-[#38bdf8] pixel-frame-sky'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {isHighestSuspicion ? '[ CONDEMN WEREWOLF ]' : '[ CAST BALLOT ]'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
