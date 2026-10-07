import React, { useState } from 'react';
import { PlayerProfile, WeeklyRecap } from '../../types/telemetry';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Trophy, 
  Flame, 
  Target, 
  Clock, 
  Share2,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SeasonWrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerProfile;
  recap: WeeklyRecap;
}

export const SeasonWrappedModal: React.FC<SeasonWrappedModalProps> = ({
  isOpen,
  onClose,
  player,
  recap
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [muted, setMuted] = useState(false);

  if (!isOpen) return null;

  const slides = [
    {
      title: 'SEASON 04 // STORY DEBRIEF',
      badge: 'PROTOCOL RED ARCHIVE',
      headline: 'You deployed deeper than 96% of active operators.',
      stat: '104.5 Hours',
      subtext: 'Across 182 competitive matches logged in US-EAST servers.',
      color: 'from-cyan-900/60 via-[#0d1322] to-[#090d16]',
      accent: '#00F0FF'
    },
    {
      title: 'PRECISION BREAKTHROUGH',
      badge: 'RECOIL MASTERY',
      headline: 'Your crosshair discipline took a massive leap forward.',
      stat: '+8.4% Accuracy',
      subtext: 'Your average accuracy surged from 34.2% to 42.6%, anchored by your evening session routines.',
      color: 'from-emerald-950/60 via-[#0d1322] to-[#090d16]',
      accent: '#10B981'
    },
    {
      title: 'THE SIGNATURE MATCH',
      badge: 'MASTERPIECE PROTOCOL',
      headline: 'Neon Haven on Sept 28 was pure tactical brilliance.',
      stat: '3,050 Damage',
      subtext: 'You logged 27 kills, 3 clutch defuses, and set your 2026 season damage peak in a single 13-9 battle.',
      color: 'from-amber-950/60 via-[#0d1322] to-[#090d16]',
      accent: '#F59E0B'
    },
    {
      title: 'HABIT & RESILIENCE',
      badge: 'NO BURNOUT DETECTED',
      headline: 'You sustained consistency without falling to tilt.',
      stat: '22 Days Peak Streak',
      subtext: 'Utilized weekly forgiving freezes responsibly to protect streaks across busy weeks.',
      color: 'from-purple-950/60 via-[#0d1322] to-[#090d16]',
      accent: '#A855F7'
    },
    {
      title: 'APEX STATUS SECURED',
      badge: 'SEASON 04 GRADUATION',
      headline: `You wrapped Season 04 in S-Tier ranking.`,
      stat: `${player.elo} ELO`,
      subtext: 'Top 4% worldwide, framed against your own personal best progress.',
      color: 'from-cyan-950/80 via-indigo-950/60 to-[#090d16]',
      accent: '#00F0FF'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const active = slides[currentSlide];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={`w-full max-w-lg aspect-[9/14] sm:aspect-[9/13] rounded-2xl bg-gradient-to-b ${active.color} border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col justify-between relative overflow-hidden`}
      >
        {/* Story Progress Indicators at Top */}
        <div className="flex gap-1.5 z-10">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  idx <= currentSlide ? 'bg-cyan-400' : 'bg-transparent'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Top Controls: Sound & Close */}
        <div className="flex items-center justify-between z-10 pt-4">
          <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 uppercase">
            {active.badge}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuted(!muted)}
              className="p-1 rounded bg-[#111827]/80 text-slate-400 hover:text-white"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded bg-[#111827]/80 text-slate-400 hover:text-white"
              aria-label="Close Season Wrapped"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Content */}
        <div className="relative z-10 py-6 space-y-4 my-auto text-center">
          <div className="font-['JetBrains_Mono'] text-xs text-slate-400 tracking-widest uppercase">
            {active.title}
          </div>

          <div 
            className="font-['JetBrains_Mono'] text-4xl sm:text-5xl font-black text-slate-100 tracking-tight tabular-nums"
            style={{ color: active.accent }}
          >
            {active.stat}
          </div>

          <h2 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
            "{active.headline}"
          </h2>

          <p className="font-['Inter'] text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
            {active.subtext}
          </p>
        </div>

        {/* Slide Navigation Controls */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`p-2 rounded font-['JetBrains_Mono'] text-xs flex items-center gap-1 ${
              currentSlide === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <span className="font-['JetBrains_Mono'] text-xs text-slate-400">
            {currentSlide + 1} / {slides.length}
          </span>

          {currentSlide < slides.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-[#090d16] font-['Space_Grotesk'] text-xs font-bold transition flex items-center gap-1 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                handleNext();
                onClose();
              }}
              className="px-4 py-2 rounded bg-emerald-400 hover:bg-emerald-300 text-[#090d16] font-['Space_Grotesk'] text-xs font-bold transition flex items-center gap-1 shadow-[0_0_15px_#10B981]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Complete Wrapped</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
