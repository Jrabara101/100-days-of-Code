import React, { useState, useEffect } from 'react';
import { useVault } from '../../context/VaultContext';
import { Wifi, Signal, Battery, Smartphone, Maximize2, RotateCcw } from 'lucide-react';

export default function AndroidDeviceFrame({ children }) {
  const { isAndroidFrameMode, setIsAndroidFrameMode } = useVault();
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  if (!isAndroidFrameMode) {
    return (
      <div className="w-full min-h-screen bg-surface flex flex-col">
        {/* Responsive Desktop Banner */}
        <div className="w-full bg-primary-container text-surface-container px-4 py-2 flex items-center justify-between text-xs border-b border-secondary/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
            <span className="font-medium text-white">Responsive Web / Tablet Viewport Active</span>
            <span className="text-on-primary-container hidden sm:inline">• Vault &amp; Stream Hybrid Core</span>
          </div>
          <button
            onClick={() => setIsAndroidFrameMode(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-secondary/40 hover:bg-secondary text-white transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Switch to Android Frame</span>
          </button>
        </div>
        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col shadow-sm">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900/95 py-6 px-4 flex flex-col items-center justify-center font-sans antialiased">
      {/* Top Controls Toolbar */}
      <div className="w-full max-w-[430px] mb-3 flex items-center justify-between text-slate-300 text-xs px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-semibold text-white tracking-wide">Android Native Simulator</span>
          <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono">Pixel 8 / API 35</span>
        </div>
        <button
          onClick={() => setIsAndroidFrameMode(false)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors text-xs font-medium border border-slate-700"
          title="Expand to Fullscreen / Desktop view"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Desktop View</span>
        </button>
      </div>

      {/* Android Device Mockup Frame */}
      <div className="relative w-full max-w-[400px] h-[870px] bg-black rounded-[48px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.12)] flex flex-col overflow-hidden ring-1 ring-slate-700/50">
        {/* Device Outer Metallic Edge Highlights */}
        <div className="absolute inset-0 rounded-[48px] pointer-events-none border border-white/10"></div>

        {/* Screen Bezel & Display Viewport */}
        <div className="relative w-full h-full bg-surface rounded-[40px] overflow-hidden flex flex-col shadow-inner select-none">
          {/* Android Status Bar */}
          <div className="h-8 w-full bg-surface-container-lowest/95 backdrop-blur-md px-6 flex items-center justify-between z-50 text-slate-800 flex-shrink-0 select-none">
            {/* Clock */}
            <span className="text-xs font-semibold tracking-tight text-primary font-mono">
              {currentTime}
            </span>

            {/* Front Camera Punch Hole */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-4 h-4 rounded-full bg-black flex items-center justify-center ring-2 ring-slate-800/40">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80"></div>
            </div>

            {/* System Status Glyphs */}
            <div className="flex items-center gap-1.5 text-primary">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-mono font-medium">5G</span>
                <Battery className="w-4 h-4 fill-primary" />
              </div>
            </div>
          </div>

          {/* Core App Viewport */}
          <div className="flex-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col relative bg-surface">
            {children}
          </div>

          {/* Android Bottom Navigation Gesture Bar */}
          <div className="h-5 w-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center flex-shrink-0 z-50">
            <div className="w-32 h-1 bg-slate-400/80 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Footer Info Pill */}
      <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-2">
        <span>Vault &amp; Stream React Android Application</span>
        <span>•</span>
        <span className="text-emerald-400 font-medium">Zero-Knowledge Hardware Enclave</span>
      </div>
    </div>
  );
}

