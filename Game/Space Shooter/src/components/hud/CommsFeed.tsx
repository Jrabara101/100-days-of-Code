import React from 'react';
import { Wifi, Radio } from 'lucide-react';

interface CommsFeedProps {
  latestTicker: string;
  isConnected: boolean;
  onlinePilots: number;
}

export function CommsFeed({ latestTicker, isConnected, onlinePilots }: CommsFeedProps) {
  return (
    <footer className="w-full bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/30 px-4 sm:px-6 py-2.5 z-30 select-none">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-mono">
        {/* Core & Shield Sync Telemetry */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-on-surface-variant uppercase font-bold">CORE THERMAL</span>
            <div className="flex gap-0.5">
              <div className="w-1.5 h-2.5 bg-secondary rounded-[1px]" />
              <div className="w-1.5 h-2.5 bg-secondary rounded-[1px]" />
              <div className="w-1.5 h-2.5 bg-secondary rounded-[1px]" />
              <div className="w-1.5 h-2.5 bg-surface-container-high rounded-[1px]" />
            </div>
            <span className="text-[11px] text-secondary font-bold">68% NOMINAL</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[10px] text-on-surface-variant uppercase font-bold">COMM-LINK</span>
            <span className="flex items-center gap-1 text-[11px] text-primary font-bold">
              <Wifi className="w-3 h-3 text-primary animate-pulse" />
              {isConnected ? `ACTIVE // ${onlinePilots} PILOTS` : 'LOCAL OFFLINE'}
            </span>
          </div>
        </div>

        {/* Live Comms Feed Ticker */}
        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant overflow-hidden">
          <span className="text-[10px] text-primary font-bold uppercase shrink-0 flex items-center gap-1">
            <Radio className="w-3 h-3 text-primary" />
            [COMMS RELAY]
          </span>
          <span className="truncate max-w-xs md:max-w-lg text-on-surface">
            {latestTicker}
          </span>
        </div>

        {/* Avionics Build Tag */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-on-surface-variant">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span>SYS.AEROSTRIKE AVIONICS VER 4.2.9</span>
        </div>
      </div>
    </footer>
  );
}
