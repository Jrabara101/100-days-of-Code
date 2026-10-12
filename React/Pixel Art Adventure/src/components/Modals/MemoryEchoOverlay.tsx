import React, { useEffect } from 'react';
import { Sparkles, Eye, X } from 'lucide-react';
import { MemoryEcho } from '../../types/game';
import { audioEngine } from '../../services/audio';

interface MemoryEchoOverlayProps {
  echo: MemoryEcho | null;
  onClose: () => void;
}

export const MemoryEchoOverlay: React.FC<MemoryEchoOverlayProps> = ({ echo, onClose }) => {
  useEffect(() => {
    if (echo) {
      audioEngine.playMemoryEcho();
    }
  }, [echo]);

  if (!echo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#181109]/80 backdrop-blur-md pointer-events-auto sepia-vignette animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg p-8 rounded-lg bg-[#1F1710]/95 border-2 border-[#D97706]/70 shadow-[0_0_50px_rgba(217,119,6,0.3)] text-center flex flex-col items-center">
        {/* Glowing Beacon Icon */}
        <div className="w-12 h-12 rounded-full bg-[#D97706]/20 border border-[#F59E0B] flex items-center justify-center mb-4 shadow-[0_0_15px_#F59E0B]">
          <Eye className="w-6 h-6 text-[#FBBF24] animate-pulse" />
        </div>

        <span className="font-pixel text-[10px] text-[#F59E0B] tracking-widest uppercase mb-1">
          MEMORY ECHO // CONSECRATED FRAGMENT
        </span>

        <h2 className="font-story font-bold text-xl text-[#FEF3C7] mb-1">
          {echo.title}
        </h2>

        <span className="font-mono text-xs text-[#D97706] mb-5">
          {echo.subtitle}
        </span>

        {/* Prose Text in Vintage Parchment Quote */}
        <div className="relative p-5 rounded bg-[#150F0A]/90 border border-[#78350F]/60 text-left mb-6 shadow-inner">
          <p className="font-story text-sm text-[#FDE68A] italic leading-relaxed">
            "{echo.prose}"
          </p>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-2 px-6 py-2.5 rounded bg-[#D97706] hover:bg-[#F59E0B] text-xs font-story font-semibold text-[#0B0D14] shadow-lg transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Absorb Memory & Return [ESC]
        </button>
      </div>
    </div>
  );
};
