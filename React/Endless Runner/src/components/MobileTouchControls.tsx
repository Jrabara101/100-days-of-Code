import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface MobileTouchControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  onOverdrive: () => void;
  isOverdriveReady: boolean;
}

export const MobileTouchControls: React.FC<MobileTouchControlsProps> = ({
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
  onOverdrive,
  isOverdriveReady,
}) => {
  return (
    <div className="md:hidden absolute inset-x-0 bottom-4 px-4 flex items-end justify-between pointer-events-none select-none z-20">
      {/* Left / Right Lane Navigation */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onMoveLeft();
          }}
          onClick={onMoveLeft}
          className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-neon-cyan active:bg-neon-cyan/20 active:scale-90 transition-all border border-neon-cyan/30"
          aria-label="Move Left"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onMoveRight();
          }}
          onClick={onMoveRight}
          className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-neon-cyan active:bg-neon-cyan/20 active:scale-90 transition-all border border-neon-cyan/30"
          aria-label="Move Right"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Overdrive Instant Burst Trigger */}
      {isOverdriveReady && (
        <div className="pointer-events-auto">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onOverdrive();
            }}
            onClick={onOverdrive}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-neon-magenta to-neon-cyan flex items-center justify-center text-white active:scale-90 transition-all shadow-xl shadow-neon-magenta/50 animate-pulse border-2 border-white"
            aria-label="Trigger Overdrive"
          >
            <Zap className="w-8 h-8 fill-current" />
          </button>
        </div>
      )}

      {/* Jump & Slide Verticals */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onJump();
          }}
          onClick={onJump}
          className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-neon-cyan active:bg-neon-cyan/20 active:scale-90 transition-all border border-neon-cyan/30"
          aria-label="Jump"
        >
          <ArrowUp className="w-6 h-6" />
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onSlide();
          }}
          onClick={onSlide}
          className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-neon-magenta active:bg-neon-magenta/20 active:scale-90 transition-all border border-neon-magenta/30"
          aria-label="Slide"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
