import React from 'react';
import { Play, RotateCcw, Settings } from 'lucide-react';
import { globalAudio } from '../engine/AudioEngine';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex flex-col items-center gap-6 brutal-border px-8 py-8 bg-[#ffea00] brutal-shadow-lg max-w-[420px] w-full text-black">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-xs font-mono-code font-black bg-black text-[#ffea00] px-3 py-1 brutal-border-2">
            SIMULATION SUSPENDED
          </span>
          <h2 className="text-4xl font-display mt-2 tracking-tight">GAME PAUSED</h2>
          <p className="text-xs font-mono-code font-bold mt-1 text-black/70">
            PRESS [SPACE] OR SELECT AN OPTION
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full font-display text-lg">
          <button
            onClick={() => {
              globalAudio.playClick();
              onResume();
            }}
            className="flex items-center justify-center gap-2 h-13 bg-[#0055ff] text-white brutal-border brutal-shadow-hover hover:bg-black transition-colors cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            RESUME ENGINE [SPACE]
          </button>

          <button
            onClick={() => {
              globalAudio.playClick();
              onRestart();
            }}
            className="flex items-center justify-center gap-2 h-12 bg-white text-black brutal-border brutal-shadow-hover hover:bg-[#ff0033] hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            RESTART RUN [R]
          </button>

          <button
            onClick={() => {
              globalAudio.playClick();
              onOpenSettings();
            }}
            className="flex items-center justify-center gap-2 h-12 bg-white text-black brutal-border brutal-shadow-hover hover:bg-[#e5e5e5] transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5 stroke-[2.5]" />
            ENGINE SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
};
