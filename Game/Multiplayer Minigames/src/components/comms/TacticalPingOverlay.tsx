import React, { useEffect, useState } from 'react';
import { useHubStore, type SonarPing } from '../../store/useHubStore';
import { cn } from '../../lib/utils';

interface ActivePingAnim extends SonarPing {
  key: number;
}

export const TacticalPingOverlay: React.FC = () => {
  const activePing = useHubStore((s) => s.activePing);
  const [pings, setPings] = useState<ActivePingAnim[]>([]);

  useEffect(() => {
    if (!activePing) return;
    const newPing: ActivePingAnim = { ...activePing, key: activePing.id };
    setPings((prev) => [...prev, newPing]);

    const timer = setTimeout(() => {
      setPings((prev) => prev.filter((p) => p.key !== newPing.key));
    }, 1500);

    return () => clearTimeout(timer);
  }, [activePing]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pings.map((ping) => {
        const isP1 = ping.role === 'P1';
        return (
          <div
            key={ping.key}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${ping.x}px`, top: `${ping.y}px` }}
          >
            {/* Sonar expanding waves */}
            <div
              className={cn(
                'w-16 h-16 rounded-full border-2 animate-ping-radar',
                isP1 ? 'border-[#58A6FF] bg-[#58A6FF]/20' : 'border-[#D29922] bg-[#D29922]/20'
              )}
            />
            {/* Center target dot */}
            <div
              className={cn(
                'absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg',
                isP1
                  ? 'bg-[#58A6FF] shadow-[0_0_12px_#58A6FF]'
                  : 'bg-[#D29922] shadow-[0_0_12px_#D29922]'
              )}
            />
            {/* Sender tag */}
            <div
              className={cn(
                'absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border backdrop-blur-md shadow-md whitespace-nowrap',
                isP1
                  ? 'border-[#58A6FF]/60 bg-[#161B22]/90 text-[#58A6FF]'
                  : 'border-[#D29922]/60 bg-[#161B22]/90 text-[#D29922]'
              )}
            >
              PING: {isP1 ? 'PLAYER 1' : 'PLAYER 2'}
            </div>
          </div>
        );
      })}
    </div>
  );
};
