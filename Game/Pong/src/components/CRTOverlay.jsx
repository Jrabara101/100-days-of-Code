import React from 'react';

export function CRTOverlay({ isEnabled }) {
  if (!isEnabled) return null;

  return (
    <>
      {/* Scanline pattern */}
      <div className="crt-overlay crt-flicker" />
      {/* Curved CRT Vignette */}
      <div className="pointer-events-none fixed inset-0 z-[998] crt-vignette opacity-80" />
    </>
  );
}
