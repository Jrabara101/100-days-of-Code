import React, { useRef } from 'react';
import { useWeatherParticles } from '../../hooks/useWeatherParticles';

export interface AtmosphericCanvasProps {
  onFpsUpdate?: (fps: number, count: number) => void;
}

export const AtmosphericCanvas: React.FC<AtmosphericCanvasProps> = ({ onFpsUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { fps, particleCount } = useWeatherParticles(canvasRef);

  React.useEffect(() => {
    if (onFpsUpdate) {
      onFpsUpdate(fps, particleCount);
    }
  }, [fps, particleCount, onFpsUpdate]);

  return (
    <div className="fixed inset-0 pointer-events-auto z-0 overflow-hidden select-none">
      {/* 60fps Environmental Particle Stage */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Cinematic Vignette & Atmospheric Depth Gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,7,18,0.4)_70%,rgba(3,7,18,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
      
      {/* Subtle Aerospace Telemetry Grid Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
};
