import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Video } from 'lucide-react';

export default function AudioVideoPlayer({ file }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(35);

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden shadow-sm">
      {/* Top Header */}
      <div className="p-2.5 bg-surface-container-low flex items-center justify-between border-b border-surface-container">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-secondary" />
          <span className="text-xs font-mono font-medium text-primary">
            {file.typeName || 'ProRes 422 QuickTime'} • 4K UHD 60fps
          </span>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          Hardware Accelerated
        </span>
      </div>

      {/* Video Viewport */}
      <div className="relative w-full h-56 bg-slate-950 flex items-center justify-center overflow-hidden">
        <img
          src={file.previewUrl || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80"}
          alt={file.name}
          className={`w-full h-full object-cover opacity-85 transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
        />

        {/* Big Center Play/Pause button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute w-14 h-14 rounded-full bg-slate-900/80 hover:bg-slate-900 border border-white/20 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all active:scale-95"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-white" />
          ) : (
            <Play className="w-6 h-6 fill-white ml-0.5" />
          )}
        </button>

        {/* Bottom Scrubber & Controls Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-1.5 text-white">
          {/* Progress bar */}
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              setProgress(Math.round((clickX / rect.width) * 100));
            }}
            className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden flex items-center"
          >
            <div 
              className="h-full bg-secondary-container rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span>01:12</span>
              <span className="text-white/40">/</span>
              <span>{file.duration || '02:45'}</span>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

