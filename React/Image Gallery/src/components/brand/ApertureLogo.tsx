import React from 'react';

interface ApertureLogoProps {
  className?: string;
  size?: number;
}

export const ApertureLogo: React.FC<ApertureLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      className={`shrink-0 ${className}`}
    >
      <rect width="120" height="120" rx="28" fill="#09090b" />
      <rect x="1" y="1" width="118" height="118" rx="27" stroke="#27272a" strokeWidth="2" />
      {/* Spatial aperture optic symbol with cyan glow */}
      <circle
        cx="60"
        cy="60"
        r="34"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeDasharray="4 3"
        opacity="0.6"
      />
      <circle cx="60" cy="60" r="22" stroke="#38bdf8" strokeWidth="3" />
      <polygon
        points="60,34 76,46 76,68 60,82 44,68 44,46"
        fill="none"
        stroke="#f4f4f5"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="60" r="5" fill="#38bdf8" />
      <circle cx="60" cy="26" r="2.5" fill="#38bdf8" />
      <circle cx="60" cy="94" r="2.5" fill="#38bdf8" />
      <circle cx="26" cy="60" r="2.5" fill="#38bdf8" />
      <circle cx="94" cy="60" r="2.5" fill="#38bdf8" />
    </svg>
  );
};
