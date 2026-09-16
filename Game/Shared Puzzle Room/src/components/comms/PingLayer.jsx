import React from 'react';
import { useNetwork } from '../../context/NetworkContext';

export default function PingLayer() {
  const { activePings } = useNetwork();

  if (!activePings || activePings.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {activePings.map((ping) => {
        const isAmber = ping.player === 'p2';
        const colorClass = isAmber ? 'border-secondary text-secondary' : 'border-primary text-primary';
        const bgGlow = isAmber ? 'bg-secondary/20' : 'bg-primary/20';

        return (
          <div
            key={ping.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
            style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
          >
            {/* Sonar expanding pulse rings */}
            <div
              className={`w-16 h-16 rounded-full border-2 ${colorClass} ${bgGlow} animate-ping-radar absolute`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full border-2 ${colorClass} ${bgGlow} animate-ping absolute`}
            ></div>
            <div
              className={`w-2.5 h-2.5 rounded-full ${isAmber ? 'bg-secondary' : 'bg-primary'} shadow-lg`}
            ></div>

            {/* Tactical label */}
            <div
              className={`mt-6 px-2 py-0.5 rounded text-[9px] font-label-caps uppercase font-bold tracking-wider whitespace-nowrap bg-surface-container-lowest/90 border ${colorClass} shadow-xl animate-bounce`}
            >
              {isAmber ? 'P2 // AMBER' : 'P1 // CYAN'}: {ping.label || 'TACTICAL PING'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
