import React, { useState } from 'react';
import { CouncilSessionState } from '../engine/types';
import { soundEngine } from '../audio/soundEngine';
import { Lock, ShieldCheck, Skull } from 'lucide-react';

interface ProtocolBannerProps {
  session: CouncilSessionState;
}

export const ProtocolBanner: React.FC<ProtocolBannerProps> = ({ session }) => {
  const [isUnmasked, setIsUnmasked] = useState(false);
  const user = session.userPlayer;

  const toggleMask = () => {
    soundEngine.playClick();
    setIsUnmasked(!isUnmasked);
  };

  const steps = [
    { num: '01', name: 'REVEAL', active: session.state === 'REVEAL' },
    { num: '02', name: 'CLUES', active: session.state === 'CLUES' },
    { num: '03', name: 'VOTING', active: session.state === 'VOTING' },
    { num: '04', name: 'REBUTTAL', active: session.state === 'REBUTTAL' }
  ];

  return (
    <div className="w-full mb-4">
      <div className="bg-[#0b0d1a]/95 p-3 flex flex-wrap items-center justify-between gap-3 pixel-frame-sky">
        {/* Left Protocol Tag */}
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-[#f59e0b] animate-ping block shadow-[0_0_8px_#f59e0b]"></span>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs md:text-sm text-[#38bdf8] uppercase tracking-wider font-bold">
                VOXEL COUNCIL // PROTOCOL-96
              </span>
              <span className="px-1.5 py-0.5 bg-[#272937] text-[#f59e0b] text-[9px] font-mono border border-[#f59e0b]/40">
                [BUILD 0.9.4b]
              </span>
            </div>
            <span className="text-[10px] text-[#94a3b8] font-mono">
              DELIBERATION MATRIX // ANOMALY DETECTED IN SECTOR 4
            </span>
          </div>
        </div>

        {/* Center FSM Stage Tracker */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono">
          {steps.map((step, idx) => (
            <React.Fragment key={step.num}>
              <span
                className={`px-2 py-1 text-[11px] font-bold ${
                  step.active
                    ? 'bg-[#b50036] text-[#ffdadb] shadow-[inset_2px_2px_0_0_#ffb2b7,inset_-2px_-2px_0_0_#40000d] animate-pulse'
                    : 'bg-[#191b28] text-[#94a3b8] shadow-[inset_1px_1px_0_0_#323442]'
                }`}
              >
                {step.num}. {step.name} {step.active && ': ACTIVE'}
              </span>
              {idx < steps.length - 1 && (
                <span className="text-[#38bdf8] font-bold text-[10px]">&gt;&gt;</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Right Role Scratch / Unmask Card */}
        <div
          onClick={toggleMask}
          className="cursor-pointer bg-[#272937] px-3 py-1.5 pixel-frame-amber hover:bg-[#323442] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          title="Click to peek or hide secret codeword"
        >
          {!isUnmasked ? (
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-[#f59e0b]" />
              <span className="text-[10px] md:text-xs font-display text-[#f59e0b] tracking-widest font-bold">
                [IDENTITY: ??? / CLICK TO UNMASK]
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {user.role === 'WEREWOLF' ? (
                <Skull size={14} className="text-[#f43f5e] animate-pulse" />
              ) : (
                <ShieldCheck size={14} className="text-[#38bdf8]" />
              )}
              <span className="text-[10px] md:text-xs font-display tracking-wider font-bold">
                ROLE:{' '}
                <span className={user.role === 'WEREWOLF' ? 'text-[#f43f5e]' : 'text-[#38bdf8]'}>
                  {user.role}
                </span>{' '}
                | CODE:{' '}
                <span className="bg-[#38bdf8]/20 px-1 text-[#e1e1f3] font-mono">
                  '{user.word}'
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
