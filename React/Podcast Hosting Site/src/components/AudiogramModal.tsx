import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  Sparkles, 
  Palette,
  Volume2
} from 'lucide-react';
import { usePodcast } from '../context/PodcastContext';

export const AudiogramModal: React.FC = () => {
  const { 
    isAudiogramModalOpen, 
    setIsAudiogramModalOpen, 
    activeAudiogramClip,
    currentEpisode,
    seekTo,
    isPlaying,
    togglePlay
  } = usePodcast();

  const [themeIndex, setThemeIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isAudiogramModalOpen || !activeAudiogramClip) return null;

  const themes = [
    {
      name: 'Studio Amber',
      bg: 'from-amber-600/30 via-neutral-900 to-black',
      border: 'border-amber-500/40',
      accent: '#F59E0B',
      textColor: 'text-amber-400'
    },
    {
      name: 'Coral Sunset',
      bg: 'from-rose-600/30 via-orange-950/40 to-black',
      border: 'border-rose-500/40',
      accent: '#FB7185',
      textColor: 'text-rose-400'
    },
    {
      name: 'Emerald Broadcast',
      bg: 'from-emerald-600/30 via-slate-950 to-black',
      border: 'border-emerald-500/40',
      accent: '#10B981',
      textColor: 'text-emerald-400'
    },
    {
      name: 'Cyber Obsidian',
      bg: 'from-indigo-600/30 via-neutral-900 to-black',
      border: 'border-indigo-500/40',
      accent: '#818CF8',
      textColor: 'text-indigo-400'
    }
  ];

  const currentTheme = themes[themeIndex];

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(`"${activeAudiogramClip.quoteText}" — ${activeAudiogramClip.speakerName} on Resonance Studio`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert('Audiogram video & quote card successfully generated and downloaded!');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl glass-modal rounded-3xl border border-[var(--border-hairline-strong)] p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Export Animated Audiogram Card
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Ready-to-share vertical video and quote card for social broadcasting.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAudiogramModalOpen(false)}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Selector Strip */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono-tabular text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            Color Aesthetic:
          </span>
          <div className="flex items-center gap-2">
            {themes.map((t, idx) => (
              <button
                key={t.name}
                onClick={() => setThemeIndex(idx)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  themeIndex === idx
                    ? 'bg-white/20 text-white border border-white/40 shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-white border border-transparent'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Audiogram Card Preview */}
        <div 
          className={`relative p-8 rounded-3xl bg-gradient-to-br ${currentTheme.bg} border ${currentTheme.border} shadow-2xl flex flex-col justify-between min-h-[320px] transition-all duration-500`}
        >
          {/* Top Stamp */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-display font-extrabold text-xs tracking-tight text-white uppercase">
                RESONANCE STUDIO
              </span>
            </div>
            <span className="font-mono-tabular text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90">
              EPISODE {currentEpisode.number}
            </span>
          </div>

          {/* Quote Body */}
          <div className="my-6">
            <p className="font-display font-bold text-lg md:text-xl text-white leading-snug tracking-tight">
              "{activeAudiogramClip.quoteText}"
            </p>
          </div>

          {/* Bottom Speaker Info & Animated Waveform */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-sm text-white block">
                {activeAudiogramClip.speakerName}
              </span>
              <span className={`text-[11px] font-mono-tabular ${currentTheme.textColor} font-semibold`}>
                Timecode: {Math.floor(activeAudiogramClip.startTimeSec / 60)}:{(activeAudiogramClip.startTimeSec % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Animated Audio Waveform Bars */}
            <div className="flex items-end gap-1 h-7">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: currentTheme.accent,
                    height: isPlaying ? `${30 + Math.sin(i * 1.5) * 60}%` : '40%',
                    animationDuration: `${0.4 + (i % 4) * 0.2}s`
                  }}
                  className={`w-1 rounded-full ${isPlaying ? 'animate-vu' : ''} transition-all`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={() => {
              seekTo(activeAudiogramClip.startTimeSec);
              if (!isPlaying) togglePlay();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-2 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            <span>{isPlaying ? 'Pause Clip' : 'Listen to 27s Clip'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyQuote}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] hover:border-amber-500/50 text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Quote' : 'Copy Quote Text'}</span>
            </button>

            <button
              onClick={handleSimulateDownload}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Rendering MP4...' : 'Export Audiogram'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
