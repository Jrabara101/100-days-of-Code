import React from 'react';

interface MainTimerDisplayProps {
  mainTextRef: React.RefObject<HTMLSpanElement | null>;
  msTextRef: React.RefObject<HTMLSpanElement | null>;
  deltaStatus?: 'AHEAD' | 'BEHIND' | 'GOLD' | 'NEUTRAL';
  size?: 'normal' | 'hero' | 'compact';
}

export const MainTimerDisplay: React.FC<MainTimerDisplayProps> = ({
  mainTextRef,
  msTextRef,
  deltaStatus = 'NEUTRAL',
  size = 'hero',
}) => {
  // Color tokens based on pacing delta
  const getGlowAndTextColor = () => {
    switch (deltaStatus) {
      case 'GOLD':
        return 'text-neon-gold drop-shadow-[0_0_16px_rgba(255,184,0,0.6)] animate-gold-flare';
      case 'AHEAD':
        return 'text-neon-emerald drop-shadow-[0_0_16px_rgba(0,255,136,0.6)]';
      case 'BEHIND':
        return 'text-neon-ruby drop-shadow-[0_0_16px_rgba(255,42,95,0.6)]';
      case 'NEUTRAL':
      default:
        return 'text-neon-cyan drop-shadow-[0_0_16px_rgba(0,240,255,0.5)]';
    }
  };

  const sizeClasses = {
    hero: 'text-5xl sm:text-6xl md:text-7xl',
    normal: 'text-4xl sm:text-5xl',
    compact: 'text-3xl sm:text-4xl',
  };

  const msSizeClasses = {
    hero: 'text-3xl sm:text-4xl md:text-5xl opacity-80',
    normal: 'text-2xl sm:text-3xl opacity-80',
    compact: 'text-xl sm:text-2xl opacity-80',
  };

  return (
    <div className="flex items-baseline justify-center select-none font-mono tracking-tight tabular-nums py-2 px-4 rounded-[6px] bg-obsidian-void/70 border border-obsidian-border/50">
      {/* Decoupled Leaf Node: Main Time (HH:MM:SS) */}
      <span
        ref={mainTextRef as React.RefObject<HTMLSpanElement>}
        className={`font-black ${sizeClasses[size]} ${getGlowAndTextColor()} transition-colors duration-200`}
      >
        00:00
      </span>

      {/* Decoupled Leaf Node: Milliseconds (.ms) */}
      <span
        ref={msTextRef as React.RefObject<HTMLSpanElement>}
        className={`font-bold ${msSizeClasses[size]} ${getGlowAndTextColor()} ml-0.5`}
      >
        .00
      </span>
    </div>
  );
};
