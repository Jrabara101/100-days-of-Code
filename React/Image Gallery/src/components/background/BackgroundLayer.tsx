import React from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { ParticleCanvas } from './ParticleCanvas';

export const BackgroundLayer: React.FC = () => {
  const bgVariation = useGalleryStore((s) => s.bgVariation);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-all duration-700">
      {/* Base Obsidian Void Ground */}
      <div className="absolute inset-0 bg-[#0e0e10]" />

      {/* Variation 1: Void Reticle Grid */}
      {bgVariation === 'void' && (
        <div className="absolute inset-0 opacity-40">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 60%),
                linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 64px 64px, 64px 64px',
            }}
          />
          {/* Subtle aperture coordinate marks */}
          <div className="absolute top-24 left-1/4 w-3 h-3 border-t border-l border-primary/20" />
          <div className="absolute top-24 right-1/4 w-3 h-3 border-t border-r border-primary/20" />
          <div className="absolute bottom-24 left-1/3 w-3 h-3 border-b border-l border-primary/20" />
          <div className="absolute bottom-24 right-1/3 w-3 h-3 border-b border-r border-primary/20" />
        </div>
      )}

      {/* Variation 2: Interactive HTML5 Canvas Particles */}
      {bgVariation === 'canvas' && <ParticleCanvas />}

      {/* Variation 3: Volumetric Cyan Glow */}
      {bgVariation === 'volumetric' && (
        <div className="absolute inset-0 animate-pulse-subtle">
          <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-primary-container/10 blur-[130px]" />
          <div className="absolute top-[40%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-[#3b82f6]/10 blur-[140px]" />
          <div className="absolute -bottom-[20%] left-[20%] w-[55vw] h-[55vw] rounded-full bg-[#06b6d4]/10 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
      )}

      {/* Variation 4: Darkroom Studio Photographic Backdrop */}
      {bgVariation === 'studio' && (
        <div className="absolute inset-0">
          <div
            className="w-full h-full opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 20%, #201f22 0%, #131315 50%, #09090b 100%)`,
            }}
          />
          {/* Soft optical vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#09090b]/60 to-[#09090b]/95" />
          {/* Studio floor hairline horizon */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent" />
        </div>
      )}
    </div>
  );
};
