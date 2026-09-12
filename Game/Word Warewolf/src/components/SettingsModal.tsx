import React from 'react';
import { soundEngine } from '../audio/soundEngine';
import { Settings, X, Volume2, VolumeX, Monitor, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  isMuted: boolean;
  onToggleMute: () => void;
  showCrt: boolean;
  onToggleCrt: () => void;
  onRestartMatch: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isMuted,
  onToggleMute,
  showCrt,
  onToggleCrt,
  onRestartMatch,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0b0d1a] pixel-frame-sky p-5 flex flex-col gap-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#323442] pb-3">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-[#38bdf8]" />
            <span className="font-display text-sm text-[#38bdf8] uppercase tracking-wider font-bold">
              SYSTEM CONFIGURATION
            </span>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center bg-[#191b28] hover:bg-[#272937] text-[#94a3b8] pixel-frame-neutral"
          >
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 font-mono text-xs">
          {/* Audio Synthesizer Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#10131f] pixel-inset-panel">
            <div className="flex items-center gap-2">
              {isMuted ? <VolumeX size={16} className="text-[#f43f5e]" /> : <Volume2 size={16} className="text-[#38bdf8]" />}
              <span>SYNTHESIZER SOUND EFFECTS</span>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onToggleMute();
              }}
              className={`px-3 py-1 font-display text-[10px] font-bold ${
                !isMuted ? 'bg-[#38bdf8] text-[#00354a]' : 'bg-[#191b28] text-[#94a3b8]'
              } pixel-btn`}
            >
              {!isMuted ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          {/* CRT Scanline Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#10131f] pixel-inset-panel">
            <div className="flex items-center gap-2">
              <Monitor size={16} className="text-[#f59e0b]" />
              <span>CRT SCANLINE RASTER OVERLAY</span>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onToggleCrt();
              }}
              className={`px-3 py-1 font-display text-[10px] font-bold ${
                showCrt ? 'bg-[#f59e0b] text-[#2a1700]' : 'bg-[#191b28] text-[#94a3b8]'
              } pixel-btn`}
            >
              {showCrt ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          {/* Resolution Info */}
          <div className="p-3 bg-[#10131f] pixel-inset-panel flex flex-col gap-1 text-[11px] text-[#94a3b8]">
            <div className="flex justify-between">
              <span>INTERNAL VOXEL BUFFER:</span>
              <strong className="text-[#38bdf8]">320 x 200 (16:10)</strong>
            </div>
            <div className="flex justify-between">
              <span>RASTER INTERPOLATION:</span>
              <strong className="text-[#38bdf8]">NEAREST-NEIGHBOR</strong>
            </div>
            <div className="flex justify-between">
              <span>INFERENCE ENGINE:</span>
              <strong className="text-[#38bdf8]">BAYESIAN SUSPICION MATRIX</strong>
            </div>
          </div>

          {/* Reset Match Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onRestartMatch();
              onClose();
            }}
            className="w-full py-2 bg-[#b50036] hover:bg-[#f43f5e] text-[#ffdadb] font-display text-xs font-bold uppercase tracking-wider pixel-btn shadow-[inset_2px_2px_0_0_#ffb2b7,inset_-2px_-2px_0_0_#40000d] flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            <span>RESTART CONCLAVE SESSION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
