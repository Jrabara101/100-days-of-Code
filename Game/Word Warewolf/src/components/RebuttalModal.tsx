import React, { useState } from 'react';
import { CouncilSessionState } from '../engine/types';
import { Skull, AlertOctagon, HelpCircle } from 'lucide-react';

interface RebuttalModalProps {
  session: CouncilSessionState;
  onSubmitGuess: (guess: string) => void;
}

export const RebuttalModal: React.FC<RebuttalModalProps> = ({
  session,
  onSubmitGuess
}) => {
  const [guess, setGuess] = useState('');
  const werewolf = session.players[session.werewolfId];
  const isHumanWerewolf = werewolf?.isHuman;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    onSubmitGuess(guess.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-[#0b0d1a] pixel-frame-rose p-6 flex flex-col gap-4 shadow-2xl">
        {/* Banner */}
        <div className="flex items-center gap-3 border-b-2 border-[#f43f5e] pb-3">
          <AlertOctagon size={24} className="text-[#f43f5e] animate-pulse" />
          <div>
            <h2 className="font-display text-base md:text-lg text-[#f43f5e] uppercase tracking-wider font-bold">
              WEREWOLF CAUGHT // REBUTTAL OVERRIDE ACTIVE
            </h2>
            <p className="text-[11px] font-mono text-[#94a3b8]">
              CONVICTED INFILTRATOR: [{werewolf.name}]
            </p>
          </div>
        </div>

        <p className="text-xs font-mono text-[#e1e1f3] leading-relaxed">
          The Council tribunal has identified the Werewolf! However, under Conclave Law, the infiltrator has one final attempt to steal the entire game by correctly guessing the <strong className="text-[#38bdf8]">Civilian Secret Word</strong>.
        </p>

        {isHumanWerewolf ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
            <div className="text-xs font-display text-[#f59e0b] font-bold">
              YOU ARE THE CAUGHT WEREWOLF! DEDUCE THE SECRET CODEWORD:
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="e.g. CAMPFIRE, OBSIDIAN, SUBMARINE..."
                className="flex-1 bg-[#10131f] text-[#38bdf8] px-3 py-2 border border-[#f43f5e] font-mono text-xs uppercase tracking-wider outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={!guess.trim()}
                className="px-5 py-2 bg-[#b50036] hover:bg-[#f43f5e] text-[#ffdadb] font-display text-xs font-bold uppercase tracking-wider pixel-btn shadow-[inset_2px_2px_0_0_#ffb2b7,inset_-2px_-2px_0_0_#40000d] disabled:opacity-40"
              >
                STEAL WIN
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-[#10131f] pixel-inset-panel flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex items-center gap-2 text-[#f59e0b] font-mono text-xs animate-pulse">
              <Skull size={18} />
              <span>[{werewolf.name}] IS PARSING COUNCIL CLUE FREQUENCIES...</span>
            </div>
            <span className="text-[10px] font-mono text-[#94a3b8]">
              Stand by for the AI infiltrator's counter-guess calculation.
            </span>
          </div>
        )}

        {/* Hints */}
        <div className="p-2.5 bg-[#191b28] text-[10px] font-mono text-[#94a3b8] flex items-center gap-2 border border-[#323442]">
          <HelpCircle size={14} className="text-[#38bdf8] shrink-0" />
          <span>
            Clue history is locked in your Council Transcript. The Werewolf only gets 1 single attempt.
          </span>
        </div>
      </div>
    </div>
  );
};
