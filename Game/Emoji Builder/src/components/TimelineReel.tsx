import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Repeat,
  PlusCircle,
  Copy,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { StoryPanel, ThemeConfig } from '../types';
import { sound } from '../utils/soundEngine';

interface TimelineReelProps {
  panels: StoryPanel[];
  activePanelId: string;
  theme: ThemeConfig;
  playback: {
    isPlaying: boolean;
    currentIndex: number;
    speedMultiplier: number;
    loop: boolean;
  };
  onSelectPanel: (panelId: string) => void;
  onAddPanel: () => void;
  onDuplicatePanel: (panelId: string) => void;
  onDeletePanel: (panelId: string) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onSetPlaybackSpeed: (speed: number) => void;
}

export const TimelineReel: React.FC<TimelineReelProps> = ({
  panels,
  activePanelId,
  theme,
  playback,
  onSelectPanel,
  onAddPanel,
  onDuplicatePanel,
  onDeletePanel,
  onTogglePlay,
  onToggleLoop,
  onSetPlaybackSpeed,
}) => {
  const isDark = theme.isDark;

  // Calculate total duration in seconds
  const totalDurationSec = panels.reduce((acc, p) => acc + (p.durationMs || 3000) / 1000, 0);

  // Calculate elapsed time to active panel
  const activeIndex = panels.findIndex((p) => p.id === activePanelId);
  const elapsedSec = panels
    .slice(0, activeIndex)
    .reduce((acc, p) => acc + (p.durationMs || 3000) / 1000, 0);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${String(mins).padStart(2, '0')}:${s.padStart(4, '0')}`;
  };

  const handleSpeedCycle = () => {
    const speeds = [0.5, 1.0, 1.5, 2.0];
    const currIdx = speeds.indexOf(playback.speedMultiplier);
    const nextSpeed = speeds[(currIdx + 1) % speeds.length];
    onSetPlaybackSpeed(nextSpeed);
    sound.playPop();
  };

  return (
    <footer
      className={`fixed bottom-2 left-4 right-4 h-[122px] rounded-3xl border p-2.5 flex flex-col justify-between z-40 backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-[#10131a]/95 border-[#374151] shadow-brutal-hard text-stone-100'
          : 'bg-white/92 border-white/90 shadow-marshmallow text-stone-800'
      }`}
    >
      {/* 1. Top Transport Strip */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Rewind to first */}
          <button
            onClick={() => {
              onSelectPanel(panels[0].id);
              sound.playPop();
            }}
            className={`w-7 h-7 rounded-xl flex items-center justify-center clay-puffy transition-colors ${
              isDark
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                : 'bg-stone-100 hover:bg-rose-100 text-stone-700'
            }`}
            title="Rewind to First Frame"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Prev */}
          <button
            onClick={() => {
              const prevIdx = Math.max(0, activeIndex - 1);
              onSelectPanel(panels[prevIdx].id);
            }}
            className={`w-7 h-7 rounded-xl flex items-center justify-center clay-puffy transition-colors ${
              isDark
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                : 'bg-stone-100 hover:bg-rose-100 text-stone-700'
            }`}
            title="Previous Frame"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Hero Play Button */}
          <button
            onClick={onTogglePlay}
            className={`px-4 h-7 rounded-xl flex items-center gap-1.5 font-fredoka text-xs font-bold transition-all clay-puffy ${
              isDark
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-brutal-hard'
                : 'bg-gradient-to-r from-berry-red to-rose-500 hover:from-red-500 hover:to-rose-600 text-white shadow-clay-btn'
            }`}
          >
            {playback.isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Story Animatic</span>
              </>
            )}
          </button>

          {/* Next */}
          <button
            onClick={() => {
              const nextIdx = Math.min(panels.length - 1, activeIndex + 1);
              onSelectPanel(panels[nextIdx].id);
            }}
            className={`w-7 h-7 rounded-xl flex items-center justify-center clay-puffy transition-colors ${
              isDark
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                : 'bg-stone-100 hover:bg-rose-100 text-stone-700'
            }`}
            title="Next Frame"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Loop Toggle */}
          <button
            onClick={onToggleLoop}
            className={`w-7 h-7 rounded-xl flex items-center justify-center clay-puffy font-bold transition-colors ${
              playback.loop
                ? isDark
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-matcha-soft text-emerald-800 border border-emerald-300'
                : isDark
                ? 'bg-stone-800 text-stone-400'
                : 'bg-stone-100 text-stone-400'
            }`}
            title={`Loop Playback: ${playback.loop ? 'ON' : 'OFF'}`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Timecode Pellet */}
          <div
            className={`ml-2 flex items-center gap-1.5 px-3 py-0.5 rounded-xl font-fredoka text-xs font-bold border ${
              isDark
                ? 'bg-[#191b23] border-[#374151] text-amber-400'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${playback.isPlaying ? 'bg-berry-red animate-ping' : 'bg-emerald-500'}`}
            />
            <span>{formatTime(elapsedSec)}</span>
            <span className="opacity-40">/</span>
            <span className="opacity-80">{formatTime(totalDurationSec)}</span>
          </div>

          {/* Speed Multiplier Pill */}
          <button
            onClick={handleSpeedCycle}
            className={`px-2 py-0.5 rounded-lg font-fredoka text-[11px] font-bold shadow-sm clay-puffy border ${
              isDark
                ? 'bg-stone-800 border-stone-700 text-stone-200'
                : 'bg-vanilla-custard border-amber-200 text-amber-900'
            }`}
            title="Click to change playback speed multiplier"
          >
            {playback.speedMultiplier.toFixed(1)}x Bounce
          </button>
        </div>

        {/* Right Status */}
        <div className="hidden sm:flex items-center gap-3 font-fredoka text-xs">
          <span className="text-stone-400 font-medium">
            {panels.length} Story Beats Baked
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full font-bold shadow-sm"
            style={{ backgroundColor: theme.primaryLight, color: theme.primaryColor }}
          >
            {theme.icon} Ready for Reel
          </span>
        </div>
      </div>

      {/* 2. Bottom Bouncy Bubble Panels Strip */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none px-1">
        {panels.map((p, idx) => {
          const isActive = p.id === activePanelId;
          const leadChar = p.stickers[0]?.char || '⭐';

          return (
            <div
              key={p.id}
              onClick={() => onSelectPanel(p.id)}
              className={`group relative flex-shrink-0 w-44 sm:w-48 h-[54px] rounded-2xl p-1.5 border flex items-center justify-between cursor-pointer transition-all clay-puffy ${
                isActive
                  ? isDark
                    ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 border-2 border-amber-400 scale-[1.03] shadow-brutal-glow'
                    : 'bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border-2 border-berry-red scale-[1.03] shadow-clay-card'
                  : isDark
                  ? 'bg-[#191b23] hover:bg-stone-800 border-[#374151]'
                  : 'bg-white hover:bg-stone-50 border-stone-200/80 shadow-clay-sm'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Drag icon */}
                <GripVertical className="w-3.5 h-3.5 opacity-30 group-hover:opacity-80 shrink-0" />

                {/* Emoji thumbnail */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-inner shrink-0 ${
                    isDark ? 'bg-stone-800' : 'bg-rose-100/60'
                  }`}
                >
                  {leadChar}
                </div>

                {/* Title & Info */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-fredoka text-xs font-bold truncate">
                      {p.title || `#${idx + 1}`}
                    </span>
                    {isActive && (
                      <span className="px-1 py-0.2 rounded-full bg-berry-red text-white font-fredoka text-[7px] font-bold">
                        LIVE
                      </span>
                    )}
                  </div>
                  <span className="font-fredoka text-[9px] text-stone-400 font-medium">
                    {((p.durationMs || 3000) / 1000).toFixed(1)}s • {p.stickers.length} emojis
                  </span>
                </div>
              </div>

              {/* Hover actions: Duplicate & Delete */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicatePanel(p.id);
                  }}
                  className="p-1 rounded-lg hover:bg-stone-200/60 text-stone-600"
                  title="Duplicate Beat"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {panels.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePanel(p.id);
                    }}
                    className="p-1 rounded-lg hover:bg-rose-100 text-rose-600"
                    title="Delete Beat"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add New Page Button */}
        <button
          onClick={onAddPanel}
          className={`flex-shrink-0 h-[54px] px-4 rounded-2xl border-2 border-dashed flex items-center gap-1.5 font-fredoka text-xs font-bold clay-puffy transition-all ${
            isDark
              ? 'border-amber-500/50 hover:border-amber-400 bg-amber-500/10 text-amber-400'
              : 'border-rose-300 hover:border-berry-red bg-rose-50/50 hover:bg-rose-50 text-berry-red'
          }`}
          title="Add a new story page / beat"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Story Page</span>
        </button>
      </div>
    </footer>
  );
};
