import React, { useEffect, useRef } from 'react';
import { SnakeEngine } from '../engine/SnakeEngine';
import { CanvasRenderer } from '../rendering/CanvasRenderer';
import type { GameState } from '../engine/types';
import { HeartPulse, Zap } from 'lucide-react';

interface CanvasViewportProps {
  engine: SnakeEngine;
  gameState: GameState;
  retroScanlines: boolean;
  onRestart: () => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  engine,
  gameState,
  retroScanlines,
  onRestart,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animFrameIdRef = useRef<number>(0);

  // Initialize Canvas Renderer and Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas, engine);
    rendererRef.current = renderer;

    const renderLoop = (timestamp: number) => {
      // Step the fixed-timestep simulation and particle systems
      engine.update(timestamp);

      // Render interpolated canvas frame
      renderer.render(timestamp);

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [engine]);

  // Handle Resize and High-DPI Scaling
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();

      // Target aspect ratio (3:2)
      const targetAspect = engine.settings.gridWidth / engine.settings.gridHeight;
      let targetWidth = rect.width;
      let targetHeight = targetWidth / targetAspect;

      if (targetHeight > rect.height) {
        targetHeight = rect.height;
        targetWidth = targetHeight * targetAspect;
      }

      // Base internal canvas dimensions
      const baseWidth = engine.settings.gridWidth * 32;
      const baseHeight = engine.settings.gridHeight * 32;

      canvas.width = baseWidth;
      canvas.height = baseHeight;

      canvas.style.width = `${Math.floor(targetWidth)}px`;
      canvas.style.height = `${Math.floor(targetHeight)}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [engine.settings.gridWidth, engine.settings.gridHeight]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full min-h-[420px] max-h-[640px] flex items-center justify-center p-2 sm:p-4 overflow-hidden"
    >
      <div className="relative brutal-border bg-black brutal-shadow-lg overflow-hidden">
        {/* Main Canvas Viewport */}
        <canvas
          ref={canvasRef}
          className="block image-render-crisp"
        />

        {/* CRT Scanline Overlay */}
        {retroScanlines && (
          <div className="absolute inset-0 crt-overlay pointer-events-none" />
        )}

        {/* Countdown Overlay */}
        {gameState === 'COUNTDOWN' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xs pointer-events-none">
            <div className="flex flex-col items-center animate-bounce">
              <span className="text-7xl sm:text-9xl font-display text-[#ffea00] drop-shadow-[6px_6px_0px_#000]">
                {engine.countdownNumber > 0 ? engine.countdownNumber : 'GO!'}
              </span>
              <span className="text-white font-mono-code font-bold text-sm sm:base bg-black px-4 py-1.5 brutal-border-2 mt-4 tracking-widest uppercase">
                INITIALIZING DUAL ENGINES...
              </span>
            </div>
          </div>
        )}

        {/* Downed Player Revive Alert Banner */}
        {gameState === 'PLAYING' && (engine.p1.status === 'DOWNED' || engine.p2.status === 'DOWNED') && (
          <div className="absolute top-4 inset-x-4 flex items-center justify-between bg-[#ff0033] text-white px-4 py-2 brutal-border brutal-shadow animate-pulse">
            <div className="flex items-center gap-2 font-display text-sm sm:text-base">
              <HeartPulse className="w-5 h-5 animate-bounce" />
              <span>
                {engine.p1.status === 'DOWNED' ? 'PLAYER 1 DOWNED' : 'PLAYER 2 DOWNED'} — COLLECT REVIVE BEACON!
              </span>
            </div>
            <div className="font-mono-code font-bold text-xs sm:text-sm bg-black text-[#ffea00] px-2 py-0.5 brutal-border-2">
              {(engine.reviveCountdownMs / 1000).toFixed(1)}s
            </div>
          </div>
        )}

        {/* Start Game Hero Overlay for IDLE State */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/75 backdrop-blur-xs text-white">
            <div className="flex flex-col items-center text-center max-w-[500px] gap-4">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 bg-[#0055ff] inline-block brutal-border-2"></span>
                <span className="w-4 h-4 bg-[#ff0033] inline-block brutal-border-2"></span>
                <span className="w-4 h-4 bg-[#ffea00] inline-block brutal-border-2"></span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-display leading-tight tracking-tight text-[#ffea00]">
                2-PLAYER CO-OP SNAKE
              </h2>
              <p className="font-mono-code text-xs sm:text-sm text-white/90 bg-white/10 p-3 brutal-border-2">
                Decoupled Fixed-Step Grid Logic (10Hz) & Continuous Sub-Pixel Viewport Rendering (144Hz) with O(1) Dual-Body Collision Matrix.
              </p>
              <button
                onClick={onRestart}
                className="flex items-center gap-3 h-14 px-8 bg-[#00ff66] text-black font-display text-xl sm:text-2xl brutal-border brutal-shadow-hover hover:bg-[#ffea00] transition-colors cursor-pointer mt-2"
              >
                <Zap className="w-6 h-6 fill-current" />
                START SIMULATION
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
