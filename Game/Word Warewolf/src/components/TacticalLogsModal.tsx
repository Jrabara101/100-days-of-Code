import React from 'react';
import { CouncilSessionState } from '../engine/types';
import { soundEngine } from '../audio/soundEngine';
import { Terminal, X, Download } from 'lucide-react';

interface TacticalLogsModalProps {
  session: CouncilSessionState;
  onClose: () => void;
}

export const TacticalLogsModal: React.FC<TacticalLogsModalProps> = ({
  session,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-[#0b0d1a] pixel-frame-sky p-5 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#323442] pb-3">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-[#38bdf8]" />
            <span className="font-display text-sm md:text-base text-[#38bdf8] uppercase tracking-wider font-bold">
              TACTICAL TELEMETRY ARCHIVE // ROUND 0{session.round}
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

        {/* Logs Terminal View */}
        <div className="bg-[#060814] p-3 font-mono text-xs text-[#94a3b8] overflow-y-auto flex flex-col gap-1.5 border border-[#323442] h-96">
          <div className="text-[10px] text-[#38bdf8] font-bold border-b border-[#323442] pb-1 mb-1">
            CONCLAVE AUDIT TRAIL STREAM [TICK: {session.tickHex}]
          </div>
          {session.telemetryLog.map((evt) => (
            <div
              key={evt.id}
              className={`flex items-start gap-2 leading-relaxed ${
                evt.highlight ? 'text-[#f43f5e] font-bold' : 'text-[#e1e1f3]'
              }`}
            >
              <span className="text-[#94a3b8] shrink-0">[{evt.timestamp}]</span>
              <span className="text-[#f59e0b] shrink-0">[{evt.tickHex}]</span>
              <span className="text-[#38bdf8] shrink-0">[{evt.type}]</span>
              <span>{evt.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
