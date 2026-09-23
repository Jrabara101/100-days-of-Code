import React, { useState, useEffect } from 'react';
import { audioEngine } from '../audio/audioGraph';
import { Share2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface HardwareChassisProps {
  children: React.ReactNode;
  onOpenExport: () => void;
  isTapeStopped: boolean;
}

export const HardwareChassis: React.FC<HardwareChassisProps> = ({
  children,
  onOpenExport,
  isTapeStopped,
}) => {
  const [kickFlash, setKickFlash] = useState(false);

  useEffect(() => {
    audioEngine.onKickTrigger = () => {
      setKickFlash(true);
      setTimeout(() => setKickFlash(false), 90);
    };
    return () => {
      audioEngine.onKickTrigger = undefined;
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-between select-none">
      {/* Dynamic Audio-Reactive Ambient Backlight Glow */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-150 z-0 ${
          kickFlash ? 'opacity-35' : 'opacity-10'
        }`}
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.45) 0%, rgba(239, 68, 68, 0.15) 35%, transparent 70%)',
        }}
      />

      {/* TOP STATUS / TELEMETRY META BAR */}
      <header className="relative z-10 border-b border-[#24201D] bg-[#141211]/90 backdrop-blur px-6 py-2.5 flex items-center justify-between text-xs text-[#78716C]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono uppercase tracking-widest text-[#E7E5E4] font-bold text-[11px]">
              AUDIO ENGINE // ONLINE
            </span>
          </div>
          <span className="text-[#3E3834] hidden sm:inline">|</span>
          <span className="font-mono text-[11px] text-[#A8A29E] hidden sm:inline">
            44.1kHz • 25ms Lookahead • WebAudio DSP
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 font-mono text-[11px]">
            <kbd className="px-1.5 py-0.5 rounded bg-[#24201D] border border-[#383330] text-[#D6D3D1]">SPACE</kbd>
            <span>Play/Stop</span>
            <span className="text-[#3E3834] mx-1">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#24201D] border border-[#383330] text-[#D6D3D1]">1-6</kbd>
            <span>Preview</span>
            <span className="text-[#3E3834] mx-1">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#24201D] border border-[#383330] text-[#D6D3D1]">C</kbd>
            <span>Clear</span>
            <span className="text-[#3E3834] mx-1">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#24201D] border border-[#383330] text-[#D6D3D1]">R</kbd>
            <span>Chaos</span>
          </div>

          <Button
            onClick={onOpenExport}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs text-[#E7E5E4] hover:border-amber-500"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-500" />
            Export & Share
          </Button>
        </div>
      </header>

      {/* MAIN HARDWARE HOUSING CONTAINER */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-7 flex flex-col justify-center">
        <div
          className={`relative rounded-3xl bg-[#181615] border-2 border-[#2A2623] shadow-2xl p-4 sm:p-6 md:p-8 transition-all duration-300 ${
            isTapeStopped ? 'saturate-50 contrast-125' : ''
          }`}
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 0)',
            backgroundSize: '10px 10px',
          }}
        >
          {/* Hardware screw details in four corners */}
          <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#444] to-[#181615] border border-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />
          <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#444] to-[#181615] border border-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />
          <div className="absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#444] to-[#181615] border border-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />
          <div className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#444] to-[#181615] border border-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />

          {children}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[#201D1B] py-2.5 px-6 text-center text-[11px] font-mono text-[#78716C] bg-[#100E0D] flex items-center justify-center gap-2">
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span>POCKET-BEAT AUDIO ARCHITECTURE // ZERO-DRIFT 100MS LOOKAHEAD • PROCEDURAL SOUND SYNTHESIS</span>
      </footer>
    </div>
  );
};
