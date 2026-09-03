import React from 'react';
import type { Direction, PlayerId, OpponentMode, AiDifficulty } from '../engine/types';
import { Info, Bot } from 'lucide-react';

interface ControlsLegendProps {
  activeKeys: Set<string>;
  onVirtualInput: (playerId: PlayerId, direction: Direction) => void;
  opponentMode: OpponentMode;
  aiDifficulty: AiDifficulty;
}

export const ControlsLegend: React.FC<ControlsLegendProps> = ({
  activeKeys,
  onVirtualInput,
  opponentMode,
  aiDifficulty,
}) => {
  const isKeyActive = (key: string) => activeKeys.has(key.toLowerCase());
  const isP2Ai = opponentMode !== 'HUMAN_P2';

  return (
    <footer className="w-full flex flex-col gap-4 px-4 sm:px-6 py-4 text-center bg-white brutal-border brutal-shadow">
      <div className="flex flex-wrap items-center justify-center gap-4 md:justify-around font-display">
        {/* P1 Controls Pad */}
        <div className="flex items-center gap-3 bg-[#0055ff] text-white px-4 sm:px-6 py-2.5 brutal-border brutal-shadow-sm">
          <span className="text-sm sm:text-base">P1 [WASD]</span>
          <div className="flex gap-1 font-mono-code font-bold text-xs text-black">
            <button
              onClick={() => onVirtualInput(1, 'UP')}
              className={`w-7 h-7 brutal-border-2 flex items-center justify-center cursor-pointer transition-colors ${
                isKeyActive('w') ? 'bg-[#ffea00] scale-95' : 'bg-white hover:bg-white/80'
              }`}
            >
              W
            </button>
            <button
              onClick={() => onVirtualInput(1, 'LEFT')}
              className={`w-7 h-7 brutal-border-2 flex items-center justify-center cursor-pointer transition-colors ${
                isKeyActive('a') ? 'bg-[#ffea00] scale-95' : 'bg-white hover:bg-white/80'
              }`}
            >
              A
            </button>
            <button
              onClick={() => onVirtualInput(1, 'DOWN')}
              className={`w-7 h-7 brutal-border-2 flex items-center justify-center cursor-pointer transition-colors ${
                isKeyActive('s') ? 'bg-[#ffea00] scale-95' : 'bg-white hover:bg-white/80'
              }`}
            >
              S
            </button>
            <button
              onClick={() => onVirtualInput(1, 'RIGHT')}
              className={`w-7 h-7 brutal-border-2 flex items-center justify-center cursor-pointer transition-colors ${
                isKeyActive('d') ? 'bg-[#ffea00] scale-95' : 'bg-white hover:bg-white/80'
              }`}
            >
              D
            </button>
          </div>
        </div>

        {/* P2 Controls Pad or AI Agent Indicator */}
        {isP2Ai ? (
          <div className="flex items-center gap-3 bg-[#121316] text-[#00ff66] px-4 sm:px-6 py-2.5 brutal-border brutal-shadow-sm font-mono-code text-xs">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#ff0033] animate-pulse" />
              <div className="text-left font-bold">
                <div className="text-white text-[13px] font-display">AI {aiDifficulty} BOT ACTIVE</div>
                <div className="text-[11px] text-[#00ff66]">
                  {opponentMode === 'AI_ENEMY' ? '⚔️ HOSTILE RIVAL ENGAGED' : '🤝 CO-OP COMPANION READY'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-[#ff0033] text-white px-4 sm:px-6 py-2.5 brutal-border brutal-shadow-sm">
            <span className="text-sm sm:text-base">P2 [ARROWS]</span>
            <div className="flex gap-1 font-mono-code font-bold text-xs text-black">
              <button
                onClick={() => onVirtualInput(2, 'UP')}
                className={`w-7 h-7 brutal-border-2 flex items-center justify-center cursor-pointer transition-colors ${
                  isKeyActive('arrowup') ? 'bg-[#ffea00] scale-95' : 'bg-white hover:bg-white/80'
                }`}
              >
                ↑
              </button>
              <button
                onClick={() => onVirtualInput(2, 'LEFT')}
                className={`w-7 h-7 brutal-border-2 flex items-center justify-center cursor-pointer transition-colors ${
                  isKeyActive('arrowleft') ? 'bg-[#ffea00] scale-95' : 'bg-white hover:bg-white/80'
                }`}
              >
                ←
              </button>
              <button
                onClick={() => onVirtualInput(2, 'DOWN')}
                className={`w-7 h-7 brutal-border-2 flex items-center justify-center cursor-pointer transition-colors ${
                  isKeyActive('arrowdown') ? 'bg-[#ffea00] scale-95' : 'bg-white hover:bg-white/80'
                }`}
              >
                ↓
              </button>
              <button
                onClick={() => onVirtualInput(2, 'RIGHT')}
                className={`w-7 h-7 brutal-border-2 flex items-center justify-center cursor-pointer transition-colors ${
                  isKeyActive('arrowright') ? 'bg-[#ffea00] scale-95' : 'bg-white hover:bg-white/80'
                }`}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Synergistic Co-op Rule Tag */}
      <div className="flex justify-center items-center gap-2 bg-black text-white py-1.5 px-4 brutal-border inline-flex mx-auto text-xs font-mono-code font-bold">
        <Info className="w-4 h-4 text-[#ffea00]" />
        <span>
          {opponentMode === 'AI_ENEMY'
            ? 'VERSUS MATCH: OUTLIVE THE AI RIVAL OR SCORE MORE POINTS • [SPACE] PAUSE • [R] REBOOT'
            : 'CO-OP MATCH: ALTERNATING EATS TRIGGER COMBO MULTIPLIER • [SPACE] PAUSE'}
        </span>
      </div>
    </footer>
  );
};
