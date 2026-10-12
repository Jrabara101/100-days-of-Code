import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hand, Flame } from 'lucide-react';

interface VirtualControlsProps {
  onDirectionChange: (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => void;
  onActionButton: () => void;
  onToolButton: () => void;
  activePromptText?: string;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onDirectionChange,
  onActionButton,
  onToolButton,
  activePromptText,
}) => {
  return (
    <div className="absolute inset-x-0 bottom-4 pointer-events-none z-30 flex justify-between items-end px-5 pb-2 md:hidden">
      {/* 4-Way Virtual D-Pad */}
      <div className="relative w-36 h-36 pointer-events-auto select-none">
        {/* Center circle */}
        <div className="absolute inset-8 rounded-full bg-[#131826]/80 border border-[#2D3954] backdrop-blur-sm" />

        {/* UP */}
        <button
          onTouchStart={() => onDirectionChange('up', true)}
          onTouchEnd={() => onDirectionChange('up', false)}
          onMouseDown={() => onDirectionChange('up', true)}
          onMouseUp={() => onDirectionChange('up', false)}
          className="absolute top-0 left-12 w-12 h-12 rounded-t-lg bg-[#1E293B]/90 border border-[#2D3954] active:bg-[#F59E0B] flex items-center justify-center text-[#F8FAFC] shadow-md touch-none"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        {/* DOWN */}
        <button
          onTouchStart={() => onDirectionChange('down', true)}
          onTouchEnd={() => onDirectionChange('down', false)}
          onMouseDown={() => onDirectionChange('down', true)}
          onMouseUp={() => onDirectionChange('down', false)}
          className="absolute bottom-0 left-12 w-12 h-12 rounded-b-lg bg-[#1E293B]/90 border border-[#2D3954] active:bg-[#F59E0B] flex items-center justify-center text-[#F8FAFC] shadow-md touch-none"
        >
          <ArrowDown className="w-5 h-5" />
        </button>

        {/* LEFT */}
        <button
          onTouchStart={() => onDirectionChange('left', true)}
          onTouchEnd={() => onDirectionChange('left', false)}
          onMouseDown={() => onDirectionChange('left', true)}
          onMouseUp={() => onDirectionChange('left', false)}
          className="absolute top-12 left-0 w-12 h-12 rounded-l-lg bg-[#1E293B]/90 border border-[#2D3954] active:bg-[#F59E0B] flex items-center justify-center text-[#F8FAFC] shadow-md touch-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* RIGHT */}
        <button
          onTouchStart={() => onDirectionChange('right', true)}
          onTouchEnd={() => onDirectionChange('right', false)}
          onMouseDown={() => onDirectionChange('right', true)}
          onMouseUp={() => onDirectionChange('right', false)}
          className="absolute top-12 right-0 w-12 h-12 rounded-r-lg bg-[#1E293B]/90 border border-[#2D3954] active:bg-[#F59E0B] flex items-center justify-center text-[#F8FAFC] shadow-md touch-none"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Action [A] and Tool [B] Buttons */}
      <div className="flex items-center gap-4 pointer-events-auto select-none">
        {/* Tool Button [B] */}
        <button
          onClick={onToolButton}
          className="w-14 h-14 rounded-full bg-[#1E293B]/90 border-2 border-[#38BDF8] active:scale-95 flex flex-col items-center justify-center text-[#38BDF8] shadow-xl backdrop-blur-md cursor-pointer"
        >
          <Flame className="w-5 h-5" />
          <span className="font-pixel text-[8px] mt-0.5">TOOL</span>
        </button>

        {/* Primary Action Button [A] */}
        <button
          onClick={onActionButton}
          className="w-16 h-16 rounded-full bg-[#D97706]/90 border-2 border-[#FBBF24] active:scale-95 flex flex-col items-center justify-center text-[#0B0D14] shadow-2xl backdrop-blur-md cursor-pointer"
        >
          <Hand className="w-6 h-6 text-[#0B0D14]" />
          <span className="font-pixel text-[9px] font-bold mt-0.5">
            {activePromptText ? 'ACTION' : 'ACT'}
          </span>
        </button>
      </div>
    </div>
  );
};
