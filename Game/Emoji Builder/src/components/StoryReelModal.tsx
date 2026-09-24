import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Repeat,
} from 'lucide-react';
import { StoryPanel, AspectRatio, ThemeConfig } from '../types';
import { sound } from '../utils/soundEngine';

interface StoryReelModalProps {
  isOpen: boolean;
  panels: StoryPanel[];
  initialIndex?: number;
  aspectRatio: AspectRatio;
  theme: ThemeConfig;
  onClose: () => void;
  onSelectBranch?: (targetPanelId: string) => void;
}

export const StoryReelModal: React.FC<StoryReelModalProps> = ({
  isOpen,
  panels,
  initialIndex = 0,
  aspectRatio,
  theme,
  onClose,
  onSelectBranch,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [typewriterText, setTypewriterText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [comicSoundSticker, setComicSoundSticker] = useState<string | null>(null);

  const currentPanel = panels[currentIndex] || panels[0];
  const isDark = theme.isDark;

  // Sync index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsPlaying(true);
    }
  }, [isOpen, initialIndex]);

  // Typewriter micro-caption effect
  useEffect(() => {
    if (!isOpen || !currentPanel) return;
    const fullText = currentPanel.caption || '';
    setTypewriterText('');
    let charIndex = 0;

    // Trigger panel sound effect
    if (!isMuted) {
      sound.playSound(currentPanel.soundEffect || 'whoosh');
    }

    // Trigger a random comic sound sticker
    const stickers = ['💥 POW!', '✨ DING!', '🧁 SQUISH!', '🔔 CHIME!'];
    const randomSticker = stickers[Math.floor(Math.random() * stickers.length)];
    setComicSoundSticker(randomSticker);
    const stickerTimer = setTimeout(() => setComicSoundSticker(null), 1200);

    const timer = setInterval(() => {
      if (charIndex < fullText.length) {
        setTypewriterText(fullText.substring(0, charIndex + 1));
        if (!isMuted && charIndex % 2 === 0) {
          sound.playTypewriter();
        }
        charIndex++;
      } else {
        clearInterval(timer);
      }
    }, 28);

    return () => {
      clearInterval(timer);
      clearTimeout(stickerTimer);
    };
  }, [currentIndex, isOpen, currentPanel, isMuted]);

  // Auto-advance timer based on panel duration
  useEffect(() => {
    if (!isOpen || !isPlaying || !currentPanel) return;

    const dwellTime = (currentPanel.durationMs || 3000) / speedMultiplier;
    const timer = setTimeout(() => {
      if (currentIndex < panels.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Loop back to start
        setCurrentIndex(0);
      }
    }, dwellTime);

    return () => clearTimeout(timer);
  }, [isOpen, isPlaying, currentIndex, currentPanel, panels.length, speedMultiplier]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => Math.min(panels.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, panels.length]);

  if (!isOpen || !currentPanel) return null;

  const aspectClass =
    aspectRatio === '1:1'
      ? 'aspect-square max-w-[620px]'
      : aspectRatio === '9:16'
      ? 'aspect-[9/16] max-h-[82vh] max-w-[420px]'
      : 'aspect-[16/9] max-w-[940px]';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-4 select-none animate-pop-in">
      {/* Top Bar HUD */}
      <div className="w-full max-w-5xl flex items-center justify-between text-white py-2 px-4 z-20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{theme.icon}</span>
          <div className="flex flex-col">
            <span className="font-fredoka text-sm font-bold tracking-wide">
              {currentPanel.title || `Beat #${currentIndex + 1}`}
            </span>
            <span className="text-xs text-stone-400 font-fredoka">
              Beat {currentIndex + 1} of {panels.length} • {theme.name}
            </span>
          </div>
        </div>

        {/* Speed & Mute & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setSpeedMultiplier((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))
            }
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-fredoka font-bold border border-white/20"
          >
            {speedMultiplier}x Speed
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white"
            title="Exit Presenter Mode (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Cinematic Stage with Dynamic Camera Zoom */}
      <div className="relative flex-1 w-full flex items-center justify-center p-2 overflow-hidden">
        <div
          style={{
            backgroundImage: theme.canvasPattern,
            backgroundSize: '24px 24px',
            borderColor: theme.frameBorderColor,
          }}
          className={`relative w-full ${aspectClass} rounded-[32px] border-[6px] shadow-2xl overflow-hidden flex flex-col justify-between p-6 transition-all duration-700 bg-gradient-to-b from-[#FFFDFB] to-[#FFF5EE] dark:from-[#11141c] dark:to-[#0b0e15] ${
            isPlaying ? 'scale-[1.01]' : 'scale-100'
          }`}
        >
          {/* Comic Sound Sticker Splash */}
          {comicSoundSticker && (
            <div className="absolute top-10 right-10 z-40 animate-pop-in pointer-events-none">
              <span className="px-4 py-1.5 rounded-2xl bg-amber-400 text-stone-950 font-fredoka text-lg font-black shadow-brutal-hard rotate-12 inline-block border-2 border-black">
                {comicSoundSticker}
              </span>
            </div>
          )}

          {/* Stickers inside frame */}
          <div className="relative flex-1 w-full">
            {currentPanel.stickers.map((st) => (
              <div
                key={st.id}
                style={{
                  left: `${st.x}%`,
                  top: `${st.y}%`,
                  transform: `translate(-50%, -50%) rotate(${st.rotation || 0}deg) scale(${
                    (st.scale || 1) * 1.15
                  })`,
                }}
                className={`absolute text-7xl select-none filter drop-shadow-xl ${
                  st.animation ? `animate-sticker-${st.animation}` : ''
                }`}
              >
                {st.char}
              </div>
            ))}

            {/* Speech bubbles */}
            {(currentPanel.speechBubbles || []).map((b) => (
              <div
                key={b.id}
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-30 max-w-[320px] p-3.5 rounded-3xl bg-white text-stone-800 shadow-xl border-2 border-rose-200 wobbly-bubble"
              >
                <p className="font-hand text-lg leading-tight font-bold">{b.text}</p>
              </div>
            ))}

            {/* Branching choices if present */}
            {currentPanel.choices && currentPanel.choices.length > 0 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
                {currentPanel.choices.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      const targetIdx = panels.findIndex((p) => p.id === ch.targetPanelId);
                      if (targetIdx !== -1) {
                        setCurrentIndex(targetIdx);
                        sound.playChime();
                      }
                      if (onSelectBranch) onSelectBranch(ch.targetPanelId);
                    }}
                    className="px-4 py-2 rounded-2xl bg-white hover:bg-rose-50 text-stone-800 font-fredoka text-sm font-bold shadow-clay-btn border border-rose-200 clay-puffy flex items-center gap-2"
                  >
                    <span className="text-xl">{ch.labelEmoji}</span>
                    <span>{ch.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Typewriter Subtitle Bar & Transport Controls */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-3 pb-2 z-20">
        {/* Typewriter Subtitle */}
        <div className="w-full min-h-[52px] bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-3 flex items-center justify-center text-center shadow-lg">
          <p className="font-sniglet text-base sm:text-lg text-white font-bold tracking-wide">
            {typewriterText}
            <span className="inline-block w-2 h-4 bg-amber-400 ml-1 animate-pulse" />
          </p>
        </div>

        {/* Transport Controller */}
        <div className="flex items-center gap-3 text-white">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-2xl bg-berry-red hover:bg-rose-600 text-white shadow-clay-btn clay-puffy"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current" />
            )}
          </button>

          <button
            onClick={() => setCurrentIndex((prev) => Math.min(panels.length - 1, prev + 1))}
            disabled={currentIndex === panels.length - 1}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5 ml-4">
            {panels.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/30'
                }`}
                title={`Jump to Beat #${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
