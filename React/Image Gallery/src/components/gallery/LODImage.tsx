import React, { useState } from 'react';

interface LODImageProps {
  srcThumbnail: string;
  srcFull?: string;
  alt: string;
  className?: string;
  loadFullRes?: boolean;
  aspectRatio?: number; // width / height
}

export const LODImage: React.FC<LODImageProps> = ({
  srcThumbnail,
  srcFull,
  alt,
  className = '',
  loadFullRes = false,
}) => {
  const [stage, setStage] = useState<'micro' | 'thumb' | 'full'>('micro');
  const [hasError, setHasError] = useState(false);

  const activeSrc = loadFullRes && srcFull && stage === 'full' ? srcFull : srcThumbnail;

  return (
    <div className="relative w-full h-full overflow-hidden bg-surface-container-lowest">
      {/* Stage 0: Micro-proxy Optical Aperture placeholder */}
      {stage === 'micro' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#131315]">
          <div className="w-full h-full bg-gradient-to-tr from-[#0e0e10] via-[#1c1b1d] to-[#201f22] animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <svg
              className="w-10 h-10 text-primary animate-spin"
              style={{ animationDuration: '4s' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            </svg>
          </div>
        </div>
      )}

      {/* Stage 1 & Stage 2 Image */}
      {!hasError ? (
        <img
          src={activeSrc}
          alt={alt}
          loading="lazy"
          onLoad={() => {
            if (stage === 'micro') {
              setStage('thumb');
              if (loadFullRes && srcFull) {
                // Trigger full-res raw load
                const fullImg = new Image();
                fullImg.src = srcFull;
                fullImg.onload = () => setStage('full');
              }
            }
          }}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-all duration-700 ${
            stage === 'micro' ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0'
          } ${className}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container p-4 text-center">
          <span className="material-symbols-outlined text-outline text-2xl mb-1">
            broken_image
          </span>
          <span className="font-mono-data text-[10px] text-outline">RAW Texture Offline</span>
        </div>
      )}

      {/* Stage 2 Full-res Indicator Badge (shown if loaded in full resolution) */}
      {stage === 'full' && (
        <div className="absolute bottom-1.5 right-1.5 px-1 py-0.2 rounded bg-black/60 backdrop-blur-sm border border-primary/30 text-[8px] font-mono-data text-primary">
          RAW 16-BIT
        </div>
      )}
    </div>
  );
};
