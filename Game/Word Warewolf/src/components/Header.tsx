import React from 'react';
import { Volume2, VolumeX, Settings, User } from 'lucide-react';
import { CouncilSessionState } from '../engine/types';
import { soundEngine } from '../audio/soundEngine';

interface HeaderProps {
  session: CouncilSessionState;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  isMuted,
  onToggleMute,
  onOpenSettings
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-[#0b0d1a] border-b-2 border-[#323442] shadow-[0_2px_0_0_#060814]">
      <div className="h-16 w-full px-4 flex items-center justify-between gap-4">
        {/* Left Telemetry Cluster */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#272937] pixel-frame-sky">
            <span className="w-2.5 h-2.5 bg-[#38bdf8] animate-beacon block shadow-[0_0_6px_#38bdf8]"></span>
            <span className="font-display text-[10px] text-[#38bdf8] tracking-widest uppercase font-bold">
              REC // CAM-04
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-display text-sm md:text-base text-[#38bdf8] tracking-wider uppercase font-bold">
              VOXEL COUNCIL // MYSTERY CHAMBER
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#f59e0b] font-bold">
                PHASE: {session.state} / ROUND 0{session.round}
              </span>
              <span className="text-[10px] text-[#94a3b8]">| TICK: {session.tickHex}</span>
            </div>
          </div>
        </div>

        {/* Right Status Cluster */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#191b28] pixel-frame-neutral text-xs">
            <span className="text-[#f43f5e] font-bold">[X] PRIME SUSPECT:</span>
            <span className="text-[#94a3b8]">
              {session.players.slice().sort((a, b) => b.suspicion - a.suspicion)[0]?.name || 'CALCULATING'}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleMute();
            }}
            aria-label="Audio Toggle"
            className="w-8 h-8 flex items-center justify-center bg-[#191b28] hover:bg-[#272937] pixel-frame-sky text-[#38bdf8] active:translate-x-[1px] active:translate-y-[1px]"
            title={isMuted ? 'Unmute Synthesizer' : 'Mute Synthesizer'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenSettings();
            }}
            aria-label="Council Settings"
            className="w-8 h-8 flex items-center justify-center bg-[#191b28] hover:bg-[#272937] pixel-frame-sky text-[#94a3b8] active:translate-x-[1px] active:translate-y-[1px]"
            title="System Parameters"
          >
            <Settings size={16} />
          </button>

          {/* User Profile Badge */}
          <div className="w-8 h-8 bg-[#38bdf8] flex items-center justify-center text-[#00354a] pixel-frame-sky font-bold" title="Voxel Archon (You)">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};
