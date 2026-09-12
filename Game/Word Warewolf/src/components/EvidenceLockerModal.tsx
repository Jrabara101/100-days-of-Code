import React from 'react';
import { CouncilSessionState } from '../engine/types';
import { soundEngine } from '../audio/soundEngine';
import { ShieldAlert, X, BookOpen } from 'lucide-react';

interface EvidenceLockerModalProps {
  session: CouncilSessionState;
  onClose: () => void;
}

export const EvidenceLockerModal: React.FC<EvidenceLockerModalProps> = ({
  session,
  onClose
}) => {
  const pair = session.currentWordPair;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#0b0d1a] pixel-frame-rose p-5 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#323442] pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#f43f5e]" />
            <span className="font-display text-sm md:text-base text-[#f43f5e] uppercase tracking-wider font-bold">
              EVIDENCE LOCKER // LEXICON ANALYSIS
            </span>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center bg-[#191b28] hover:bg-[#272937] text-[#94a3b8] pixel-frame-neutral"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Pair Metadata */}
        <div className="p-3 bg-[#10131f] pixel-inset-panel flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-display text-[#38bdf8] uppercase font-bold">
              CURRENT CONCLAVE MATRIX: {pair.title}
            </span>
            <span className="text-[10px] font-mono text-[#f59e0b] px-1 bg-[#191b28]">
              {pair.category}
            </span>
          </div>
          <p className="text-xs font-mono text-[#94a3b8]">
            {pair.description}
          </p>
        </div>

        {/* Clue Clusters Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto">
          {/* Civilian Clue Cluster */}
          <div className="p-3 bg-[#10131f] pixel-frame-sky flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-display text-[#38bdf8] font-bold uppercase">
              <BookOpen size={14} />
              <span>CIVILIAN CLUSTER ATTRIBUTES</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pair.civilianClues.map((clue, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-[#0b0d1a] border border-[#38bdf8]/40 text-[#38bdf8] font-mono text-[11px]"
                >
                  {clue}
                </span>
              ))}
            </div>
            <span className="text-[10px] font-mono text-[#94a3b8] mt-2">
              Civilians cluster around these grounded properties.
            </span>
          </div>

          {/* Werewolf Divergent Pool */}
          <div className="p-3 bg-[#10131f] pixel-frame-rose flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-display text-[#f43f5e] font-bold uppercase">
              <BookOpen size={14} />
              <span>DIVERGENT INFILTRATOR ATTRIBUTES</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pair.werewolfClues.map((clue, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-[#0b0d1a] border border-[#f43f5e]/40 text-[#f43f5e] font-mono text-[11px]"
                >
                  {clue}
                </span>
              ))}
            </div>
            <span className="text-[10px] font-mono text-[#94a3b8] mt-2">
              Words indicating divergent conceptual associations.
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-[#191b28] text-[10px] font-mono text-[#94a3b8] border border-[#323442]">
          NOTE: Bayesian accumulation computes distance from the civilian centroid in real-time.
        </div>
      </div>
    </div>
  );
};
