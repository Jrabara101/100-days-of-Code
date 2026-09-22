import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getTheme } from '@/game/themes';

export const AuroraBackground: React.FC = () => {
  const { settings, audioMetrics } = useGameStore();
  const theme = getTheme(settings.visualTheme);

  // Modulate opacity and border glow based on live beat & bass energy
  const pulseOpacity = audioMetrics.isBeat ? 0.65 : Math.max(0.15, audioMetrics.bassIntensity * 0.4);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Dynamic Beat Reactive Border */}
      <div
        className="absolute inset-0 border-2 transition-all duration-100 ease-out"
        style={{
          borderColor: audioMetrics.isBeat ? theme.secondary : theme.primary,
          boxShadow: audioMetrics.isBeat
            ? `0 0 35px ${theme.secondary}, inset 0 0 25px ${theme.secondary}`
            : `0 0 15px ${theme.primary}, inset 0 0 10px rgba(6, 182, 212, 0.05)`,
          opacity: pulseOpacity + 0.2,
        }}
      />

      {/* Top and Bottom Aurora Gradients */}
      <div
        className="absolute -top-32 left-1/4 w-1/2 h-64 rounded-full blur-3xl transition-opacity duration-300 pointer-events-none"
        style={{
          backgroundColor: theme.primary,
          opacity: pulseOpacity * 0.35,
        }}
      />
      <div
        className="absolute -bottom-32 right-1/4 w-1/2 h-64 rounded-full blur-3xl transition-opacity duration-300 pointer-events-none"
        style={{
          backgroundColor: theme.secondary,
          opacity: pulseOpacity * 0.25,
        }}
      />
    </div>
  );
};
