import React, { useState } from 'react';
import { CouncilSessionState } from '../engine/types';
import { Send, Radio } from 'lucide-react';

interface ClueInputTerminalProps {
  session: CouncilSessionState;
  onSubmitClue: (clue: string) => void;
}

export const ClueInputTerminal: React.FC<ClueInputTerminalProps> = ({
  session,
  onSubmitClue
}) => {
  const [clueInput, setClueInput] = useState('');
  const user = session.userPlayer;
  const isUserTurn = session.state === 'CLUES' && session.clueTurnIndex === 0;
  const currentSpeaker = session.players[session.clueTurnIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueInput.trim() || !isUserTurn) return;
    onSubmitClue(clueInput.trim());
    setClueInput('');
  };

  return (
    <div className="p-4 bg-[#0b0d1a]/95 backdrop-blur-sm pixel-frame-sky">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#323442]">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-[#38bdf8]" />
          <span className="font-display text-xs md:text-sm text-[#38bdf8] uppercase tracking-wider font-bold">
            TACTICAL CLUE DISPATCH TERMINAL
          </span>
        </div>
        <span className="text-[10px] text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 border border-[#38bdf8]/40 font-mono">
          SECRET ENCRYPTION: '{user.word}'
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-2">
        <div className="flex-1 relative flex items-center bg-[#10131f] pixel-inset-panel px-3 py-2">
          <span className="font-display text-xs text-[#38bdf8] mr-2 font-bold">&gt;</span>
          <input
            type="text"
            value={clueInput}
            onChange={(e) => setClueInput(e.target.value)}
            disabled={!isUserTurn}
            placeholder={
              isUserTurn
                ? "TYPE SINGLE-WORD TACTICAL CLUE..."
                : `AWAITING TRANSMISSION FROM ${currentSpeaker?.name || 'COUNCIL'}...`
            }
            className="bg-transparent border-none outline-none w-full text-[#38bdf8] font-mono text-xs md:text-sm placeholder-[#94a3b8]/40 tracking-wider uppercase disabled:opacity-40"
          />
        </div>

        <button
          type="submit"
          disabled={!isUserTurn || !clueInput.trim()}
          className="px-4 py-2 bg-[#191b28] hover:bg-[#272937] text-[#38bdf8] font-display text-xs font-bold uppercase tracking-wider pixel-btn pixel-frame-sky flex items-center justify-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          <span>TRANSMIT</span>
        </button>
      </form>

      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#94a3b8]">
        <span>
          {isUserTurn ? (
            <span className="text-[#f59e0b] font-bold animate-pulse">
              [!] YOUR TURN: Speak 1 descriptive clue without giving your role away!
            </span>
          ) : (
            <span>
              STATUS: Council in deliberation. {session.cluesSubmitted}/4 dispatches recorded.
            </span>
          )}
        </span>
        <span>KEYBOARD SHORTCUT: [ENTER]</span>
      </div>
    </div>
  );
};
