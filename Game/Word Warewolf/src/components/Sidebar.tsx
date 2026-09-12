import React from 'react';
import { NavSection, CouncilSessionState } from '../engine/types';
import { soundEngine } from '../audio/soundEngine';
import { Radio, Vote, Users, ShieldAlert, Terminal } from 'lucide-react';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  session: CouncilSessionState;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  session
}) => {
  const highestSuspicion = session.players.slice().sort((a, b) => b.suspicion - a.suspicion)[0];
  const isHighAlert = highestSuspicion && highestSuspicion.suspicion > 0.45;

  const navItems: { id: NavSection; label: string; tag: string; icon: React.ReactNode; tagColor: string }[] = [
    {
      id: 'chamber',
      label: '01. CHAMBER FEED',
      tag: 'LIVE',
      icon: <Radio size={14} />,
      tagColor: 'text-[#38bdf8]'
    },
    {
      id: 'switchboard',
      label: '02. VOTE SWITCHBOARD',
      tag: session.state === 'VOTING' ? 'ACTIVE' : 'READY',
      icon: <Vote size={14} />,
      tagColor: 'text-[#f59e0b]'
    },
    {
      id: 'dossiers',
      label: '03. SUSPECT DOSSIERS',
      tag: '4/4',
      icon: <Users size={14} />,
      tagColor: 'text-[#94a3b8]'
    },
    {
      id: 'evidence',
      label: '04. EVIDENCE LOCKER',
      tag: 'LEXICON',
      icon: <ShieldAlert size={14} />,
      tagColor: 'text-[#f43f5e]'
    },
    {
      id: 'logs',
      label: '05. TACTICAL LOGS',
      tag: 'SYNC',
      icon: <Terminal size={14} />,
      tagColor: 'text-[#38bdf8]'
    }
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-8 w-64 bg-[#0b0d1a] z-40 hidden md:flex flex-col justify-between border-r-2 border-[#323442] shadow-[2px_0_0_0_#060814]">
      <div className="p-4 flex flex-col gap-4">
        {/* Council Telemetry Header Box */}
        <div className="p-3 bg-[#10131f] pixel-inset-panel">
          <div className="text-[10px] font-display text-[#94a3b8] tracking-wider uppercase">
            COUNCIL TELEMETRY
          </div>
          <div className="font-display text-base text-[#38bdf8] font-bold mt-1">
            BAY 04 // ACTV
          </div>
        </div>

        {/* Navigation Switchboard */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundEngine.playClick();
                  onSelectSection(item.id);
                }}
                className={`px-3 py-2 text-left flex items-center justify-between text-xs font-display tracking-wider pixel-btn ${
                  isActive
                    ? 'bg-[#38bdf8] text-[#00354a] font-bold shadow-[inset_2px_2px_0_0_#c4e7ff,inset_-2px_-2px_0_0_#00354a]'
                    : 'bg-[#10131f] text-[#94a3b8] hover:bg-[#191b28] hover:text-[#e1e1f3] shadow-[inset_2px_2px_0_0_#323442,inset_-2px_-2px_0_0_#060814]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className={`text-[9px] font-mono px-1 py-0.5 bg-[#0b0d1a]/50 ${item.tagColor}`}>
                  {item.tag}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Threat Alert Panel */}
      <div className="p-4">
        <div className={`p-3 bg-[#191b28] ${isHighAlert ? 'pixel-frame-rose' : 'pixel-frame-neutral'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-display uppercase tracking-widest ${isHighAlert ? 'text-[#f43f5e] animate-pulse' : 'text-[#f59e0b]'}`}>
              {isHighAlert ? 'DEFCON ALERT // HIGH' : 'DEFCON ALERT // NORMAL'}
            </span>
            <span className="text-[10px] text-[#94a3b8] font-mono">SECTOR-4</span>
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono mt-1 leading-tight">
            {isHighAlert
              ? `ANOMALY SPIKE: ${highestSuspicion?.name} @ ${(highestSuspicion.suspicion * 100).toFixed(0)}% SUSPICION`
              : 'COUNCIL DELIBERATION IN EQUILIBRIUM'}
          </div>
        </div>
      </div>
    </aside>
  );
};
