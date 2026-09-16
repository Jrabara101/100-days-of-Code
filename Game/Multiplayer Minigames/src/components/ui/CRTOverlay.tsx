import React from 'react';
import { useHubStore } from '../../store/useHubStore';

export const CRTOverlay: React.FC = () => {
  const crtFilterEnabled = useHubStore((s) => s.crtFilterEnabled);

  if (!crtFilterEnabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {/* Scanline pattern */}
      <div className="absolute inset-0 crt-overlay opacity-40" />

      {/* Subtle vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />
    </div>
  );
};
