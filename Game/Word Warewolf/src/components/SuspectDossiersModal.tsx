import React from 'react';
import { CouncilSessionState } from '../engine/types';
import { soundEngine } from '../audio/soundEngine';
import { Users, X, Shield, Skull } from 'lucide-react';

interface SuspectDossiersModalProps {
  session: CouncilSessionState;
  onClose: () => void;
}

export const SuspectDossiersModal: React.FC<SuspectDossiersModalProps> = ({
  session,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-[#0b0d1a] pixel-frame-sky p-5 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#323442] pb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#38bdf8]" />
            <span className="font-display text-sm md:text-base text-[#38bdf8] uppercase tracking-wider font-bold">
              COUNCIL SUSPECT DOSSIERS // CLASSIFIED INTEL
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

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-1">
          {session.players.map((p) => {
            const isHighSuspicion = p.suspicion > 0.4;
            return (
              <div
                key={p.id}
                className={`p-3 bg-[#10131f] ${
                  isHighSuspicion ? 'pixel-frame-rose' : 'pixel-frame-sky'
                } flex flex-col gap-2`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 block"
                      style={{ backgroundColor: p.colorHex }}
                    ></span>
                    <span className="font-display text-xs font-bold text-[#e1e1f3]">
                      {p.name}
                    </span>
                    <span className="text-[9px] font-mono px-1 bg-[#191b28] text-[#94a3b8]">
                      {p.codename}
                    </span>
                  </div>
                  {p.isHuman ? (
                    <span className="text-[9px] font-mono text-[#38bdf8] flex items-center gap-1">
                      <Shield size={10} /> HUMAN
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-[#f59e0b] flex items-center gap-1">
                      <Skull size={10} /> BOT AGENT
                    </span>
                  )}
                </div>

                <div className="text-[10px] font-mono text-[#94a3b8] italic">
                  "{p.title}"
                </div>

                <div className="space-y-1 text-[11px] font-mono bg-[#0b0d1a] p-2 pixel-inset-panel">
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">BAYESIAN SUSPICION:</span>
                    <strong className={isHighSuspicion ? 'text-[#f43f5e]' : 'text-[#38bdf8]'}>
                      {(p.suspicion * 100).toFixed(1)}%
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">DIVERGENCE SCORE:</span>
                    <strong className="text-[#e1e1f3]">
                      {(p.divergenceScore * 100).toFixed(1)}%
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">DISPATCHED CLUES:</span>
                    <span className="text-[#ffc174] truncate max-w-[140px]">
                      {p.clueHistory.length > 0 ? p.clueHistory.join(', ') : 'NONE'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#94a3b8]">
                  PERK: <span className="text-[#38bdf8]">{p.perk}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
