import React from 'react';

interface HistogramScopeProps {
  spectralRGB?: { r: number; g: number; b: number };
}

export const HistogramScope: React.FC<HistogramScopeProps> = ({
  spectralRGB = { r: 28, g: 42, b: 30 },
}) => {
  return (
    <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-surface-container-lowest/85 backdrop-blur-md border border-outline-variant/30">
      <div className="flex items-center justify-between font-mono-data text-[9px] text-outline">
        <span className="font-semibold uppercase tracking-wider">RGB Histogram Scope</span>
        <span className="text-primary font-medium">16-BIT FLOAT</span>
      </div>

      {/* SVG Vector Histogram with overlapping R, G, B channel waves */}
      <svg className="w-full h-12" viewBox="0 0 100 40" fill="none">
        {/* Blue channel fill */}
        <path
          d="M0 38 Q 15 35, 25 18 T 50 12 T 75 22 T 100 35 L 100 40 L 0 40 Z"
          fill="#38bdf8"
          fillOpacity="0.25"
        />
        {/* Red channel wave */}
        <path
          d="M0 40 Q 20 37, 35 24 T 60 14 T 85 18 T 100 38"
          fill="none"
          stroke="#f87171"
          strokeWidth="1.2"
          opacity="0.8"
        />
        {/* Green channel wave */}
        <path
          d="M0 40 Q 30 38, 45 16 T 70 20 T 90 28 T 100 39"
          fill="none"
          stroke="#4ade80"
          strokeWidth="1.2"
          opacity="0.8"
        />
        {/* Cyan peak outline */}
        <path
          d="M0 38 Q 15 35, 25 18 T 50 12 T 75 22 T 100 35"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.4"
        />
      </svg>

      {/* Spectral Distribution Bars */}
      <div className="space-y-1">
        <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-surface-container-highest">
          <div
            className="bg-red-500/80 h-full transition-all"
            style={{ width: `${spectralRGB.r}%` }}
          />
          <div
            className="bg-emerald-500/80 h-full transition-all"
            style={{ width: `${spectralRGB.g}%` }}
          />
          <div
            className="bg-sky-400/90 h-full transition-all"
            style={{ width: `${spectralRGB.b}%` }}
          />
        </div>
        <div className="flex justify-between font-mono-data text-[9px] text-outline">
          <span className="text-red-400">R: {spectralRGB.r}%</span>
          <span className="text-emerald-400">G: {spectralRGB.g}%</span>
          <span className="text-sky-400">B: {spectralRGB.b}%</span>
        </div>
      </div>
    </div>
  );
};
