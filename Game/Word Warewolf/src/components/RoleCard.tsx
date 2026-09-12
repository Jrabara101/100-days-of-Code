import React from 'react';
import { CouncilSessionState } from '../engine/types';
import { soundEngine } from '../audio/soundEngine';
import { BadgeHelp, Shield, Skull, ArrowRight } from 'lucide-react';

interface RoleCardProps {
  session: CouncilSessionState;
  onAdvanceToClues: () => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ session, onAdvanceToClues }) => {
  const user = session.userPlayer;
  const isWerewolf = user.role === 'WEREWOLF';

  return (
    <div className={`p-4 bg-[#0b0d1a]/95 backdrop-blur-sm ${isWerewolf ? 'pixel-frame-rose' : 'pixel-frame-amber'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-[#323442]">
        <div className="flex items-center gap-2">
          <BadgeHelp size={16} className={isWerewolf ? 'text-[#f43f5e]' : 'text-[#f59e0b]'} />
          <span className={`font-display text-xs md:text-sm uppercase tracking-wider font-bold ${isWerewolf ? 'text-[#f43f5e]' : 'text-[#f59e0b]'}`}>
            SECRET ROLE MATRIX // CLASSIFIED
          </span>
        </div>
        <span className="text-[10px] text-[#94a3b8] font-mono">
          CLEARANCE: {isWerewolf ? 'INFILTRATOR' : 'CITIZEN-LEVEL'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pixel Character Portrait Box */}
        <div className="bg-[#10131f] p-2 pixel-inset-panel flex flex-col items-center justify-center min-h-[130px]">
          <div className="w-20 h-20 bg-[#191b28] border border-[#323442] flex items-center justify-center relative shadow-inner">
            {isWerewolf ? (
              <Skull size={44} className="text-[#f43f5e] animate-pulse" />
            ) : (
              <Shield size={44} className="text-[#38bdf8]" />
            )}
            <div className="absolute bottom-1 right-1 text-[8px] font-mono bg-black/70 px-1 text-[#38bdf8]">
              32x32
            </div>
          </div>
          <span className="text-[10px] font-display text-[#38bdf8] mt-1.5 font-bold">
            {user.codename}
          </span>
        </div>

        {/* Identity Dossier Attributes */}
        <div className="md:col-span-2 flex flex-col justify-between gap-2 bg-[#10131f] p-3 pixel-inset-panel">
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">DESIGNATION:</span>
              <span className={`font-bold ${isWerewolf ? 'text-[#f43f5e]' : 'text-[#38bdf8]'}`}>
                {isWerewolf ? 'SHADOW WEREWOLF' : 'COUNCIL CITIZEN'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">FACTION KEYWORD:</span>
              <span className="font-bold bg-[#f59e0b]/20 text-[#ffc174] px-2 py-0.5 border border-[#f59e0b]/40">
                "{user.word}"
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">MISSION OBJECTIVE:</span>
              <span className="text-[11px] text-[#e1e1f3]">
                {isWerewolf
                  ? 'Blend in with Civilians. Avoid conviction or guess their word!'
                  : 'Identify the divergent Werewolf without revealing your word!'}
              </span>
            </div>
          </div>

          <div className="p-2 bg-[#0b0d1a] text-[11px] font-mono text-[#94a3b8] border-l-2 border-[#f59e0b]">
            <span className="text-[#ffc174] font-bold">PERK [{user.perk}]:</span>{' '}
            If a tie occurs during Phase 3, your ballot weighs 1.5x in the final tribunal calculation.
          </div>
        </div>
      </div>

      {/* Advance button if in REVEAL state */}
      {session.state === 'REVEAL' && (
        <div className="mt-4 pt-3 border-t border-[#323442] flex justify-end">
          <button
            onClick={() => {
              soundEngine.playClick();
              onAdvanceToClues();
            }}
            className="px-4 py-2 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#00354a] font-display text-xs font-bold uppercase tracking-wider pixel-btn flex items-center gap-2 shadow-[inset_2px_2px_0_0_#c4e7ff,inset_-2px_-2px_0_0_#00354a]"
          >
            <span>ENTER CLUE ROUND</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
