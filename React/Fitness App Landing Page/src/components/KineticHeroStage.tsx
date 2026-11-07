import React, { useState, useEffect } from 'react';
import {
  Apple,
  Play,
  QrCode,
  Heart,
  TrendingUp,
  Flame,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Watch,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useSmartDeviceDetection } from '../hooks/useSmartDeviceDetection';

interface KineticHeroStageProps {
  onOpenQRModal: () => void;
  onOpenHsaModal: () => void;
}

export const KineticHeroStage: React.FC<KineticHeroStageProps> = ({
  onOpenQRModal,
  onOpenHsaModal,
}) => {
  const { isMobile, isIOS, isAndroid } = useSmartDeviceDetection();
  const [bpm, setBpm] = useState<number>(164);
  const [activeKcal, setActiveKcal] = useState<number>(312);
  const [timerSeconds, setTimerSeconds] = useState<number>(45);
  const [isWorkPhase, setIsWorkPhase] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Live telemetry pulse simulation
  useEffect(() => {
    const bpmInterval = setInterval(() => {
      setBpm((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(176, Math.max(158, prev + delta));
      });
      setActiveKcal((prev) => prev + 1);
    }, 2000);

    return () => clearInterval(bpmInterval);
  }, []);

  // Interval timer tick simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsWorkPhase((current) => !current);
          return isWorkPhase ? 15 : 45; // Toggle 45s work / 15s rest
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isWorkPhase]);

  return (
    <section className="relative pt-6 pb-20 md:pt-14 md:pb-28 overflow-hidden" id="hero">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-[#D4FF00]/10 via-emerald-500/10 to-transparent rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Value Proposition & Store Deck (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6 z-10">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#111318]/90 border border-white/10 shadow-inner">
              <span className="text-amber-400 font-mono text-xs font-bold flex items-center gap-1">
                ★ 4.92
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
              <span className="text-zinc-300 text-xs font-mono">
                48,210+ Verified App Store Reviews
              </span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-zinc-600"></span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-[#D4FF00] uppercase tracking-wider font-semibold">
                Apple Design Finalist
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Elite strength & conditioning.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                Zero guesswork.
              </span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4FF00] to-[#10B981]">
                Built for your exact space.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-zinc-400 font-normal leading-relaxed max-w-2xl">
              Adaptive workouts, real-time Apple Watch & Whoop heart-rate zones, and
              personalized 4-week splits that evolve every time you train. Filter by your
              space, preview form loops at 60fps, and beam your custom plan straight to your
              phone.
            </p>

            {/* Primary Acquisition & Omni-Store Download Deck */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              {/* Apple App Store Button */}
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noreferrer"
                className={`h-14 px-5 rounded-2xl border ${
                  isIOS ? 'border-[#D4FF00] bg-[#D4FF00]/10' : 'border-white/15 bg-white/5'
                } hover:bg-white/10 hover:border-white/30 flex items-center gap-3 transition-all active:scale-95 group shadow-lg`}
              >
                <Apple className="w-7 h-7 text-white fill-white group-hover:scale-110 transition-transform" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono font-medium leading-tight">
                    Download on the
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-tight leading-tight">
                      App Store
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-white/10 text-amber-300 text-[10px] font-mono font-bold">
                      4.9 ★
                    </span>
                  </div>
                </div>
              </a>

              {/* Google Play Button */}
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noreferrer"
                className={`h-14 px-5 rounded-2xl border ${
                  isAndroid ? 'border-[#D4FF00] bg-[#D4FF00]/10' : 'border-white/15 bg-white/5'
                } hover:bg-white/10 hover:border-white/30 flex items-center gap-3 transition-all active:scale-95 group shadow-lg`}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <Play className="w-5 h-5 text-[#D4FF00] fill-[#D4FF00] group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono font-medium leading-tight">
                    GET IT ON
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-tight leading-tight">
                      Google Play
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-white/10 text-amber-300 text-[10px] font-mono font-bold">
                      4.8 ★
                    </span>
                  </div>
                </div>
              </a>

              {/* Desktop Scan-to-Pocket QR Capsule */}
              <button
                onClick={onOpenQRModal}
                className="h-14 px-4 rounded-2xl border border-[#D4FF00]/40 bg-[#D4FF00]/10 hover:bg-[#D4FF00]/20 flex items-center gap-3 cursor-pointer transition-all active:scale-95 group shadow-lg"
              >
                <div className="w-9 h-9 rounded-lg bg-black/60 border border-[#D4FF00]/40 flex items-center justify-center p-1.5">
                  <QrCode className="w-full h-full text-[#D4FF00] group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    Scan to Pocket <ArrowRight className="w-3 h-3 text-[#D4FF00]" />
                  </span>
                  <span className="text-[10px] font-mono text-[#D4FF00]">
                    14-Day Free Pass Included
                  </span>
                </div>
              </button>
            </div>

            {/* Proof Stats Ticker */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg">
              <div className="flex flex-col">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                  94%
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mt-0.5">
                  Member Retention
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#D4FF00] tabular-nums">
                  +18.4 <span className="text-sm font-normal">lbs</span>
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mt-0.5">
                  Avg Lean Delta
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums">
                  100%
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mt-0.5">
                  HSA/FSA Eligible
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Composite Device & Biometric HUD Stage (5 Columns) */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Ambient Backlight Aura */}
            <div className="absolute w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-[#D4FF00]/20 to-[#10B981]/25 blur-3xl -z-10 animate-pulse pointer-events-none" />

            {/* iPhone 16 Pro Titanium Bezel Frame */}
            <div className="relative w-full max-w-[325px] sm:max-w-[340px] rounded-[48px] p-3.5 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black border-4 border-zinc-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
              {/* Dynamic Island Pill */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700" />
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">LIVE</span>
                </div>
              </div>

              {/* Phone Display Screen */}
              <div className="relative rounded-[38px] overflow-hidden bg-[#0A0C10] border border-white/10 flex flex-col pt-10 pb-5 px-3.5 gap-3.5">
                {/* 60fps Movement Loop Reel */}
                <div className="relative h-56 rounded-2xl overflow-hidden bg-[#12141A] border border-white/10 shadow-inner group">
                  {/* Form Video Simulation / Athlete Form */}
                  <img
                    src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80"
                    alt="Athlete performing high-intensity Kettlebell Clean"
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                  {/* Audio Cue Button Overlay */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md hover:bg-black/90 transition-all"
                    title={isMuted ? 'Listen to coach cue' : 'Mute cue'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-[#D4FF00]" />
                    )}
                  </button>

                  {/* Bottom Movement Tag */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 border border-white/20 text-[#D4FF00] font-semibold uppercase tracking-wider">
                        Set 3 of 4 • 24kg
                      </span>
                      <h4 className="font-display text-sm font-bold text-white mt-1">
                        Kettlebell Clean & Push Press
                      </h4>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-400 bg-black/60 px-1.5 py-0.5 rounded">
                      60 FPS
                    </span>
                  </div>
                </div>

                {/* Work / Rest Interval Timer Bar */}
                <div className="p-3 rounded-2xl bg-[#111318] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Radial Timer Progress */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12 -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke={isWorkPhase ? '#D4FF00' : '#38BDF8'}
                          strokeWidth="3.5"
                          strokeDasharray="125"
                          strokeDashoffset={125 - (125 * timerSeconds) / (isWorkPhase ? 45 : 15)}
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      </svg>
                      <span className="absolute font-mono text-xs font-bold text-white tabular-nums">
                        {timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                        {isWorkPhase ? 'Interval Phase' : 'Rest Phase'}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold tracking-tight ${
                          isWorkPhase ? 'text-[#D4FF00]' : 'text-sky-400'
                        }`}
                      >
                        {isWorkPhase ? '00:45 WORK CADENCE' : '00:15 RECOVERY BREATH'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-zinc-400 block">Coach</span>
                    <span className="text-xs font-bold text-white">Elena Rostova</span>
                  </div>
                </div>

                {/* Micro Telemetry Strip */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#111318] border border-white/10">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block">
                      Active Burn
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-lg font-bold text-[#D4FF00] tabular-nums">
                        {activeKcal}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">kcal</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">14.2 kcal/min</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#111318] border border-white/10">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block">
                      Strain Index
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
                        15.2
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">/ 21</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">Optimal Overload</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Biometric HUD Pill 1: Apple Watch Live HR (Top-Left Parallax) */}
            <div className="absolute -top-3 -left-4 sm:-left-10 p-3.5 rounded-2xl bg-[#14171E]/90 border border-emerald-500/40 backdrop-blur-xl shadow-2xl max-w-[210px] hidden sm:block glow-emerald z-30">
              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 mb-1">
                <span className="flex items-center gap-1.5 font-bold">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-heart-pulse" />
                  ZONE 4 THRESHOLD
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 font-bold">
                  LIVE
                </span>
              </div>
              <div className="flex items-baseline gap-1 font-mono text-2xl font-extrabold text-white tabular-nums">
                {bpm} <span className="text-xs font-normal text-zinc-400">BPM</span>
              </div>

              {/* Sparkline ECG Representation */}
              <div className="flex items-end gap-1 h-5 mt-2">
                <div className="w-1.5 bg-emerald-500/30 h-2 rounded-full" />
                <div className="w-1.5 bg-emerald-500/50 h-3 rounded-full" />
                <div className="w-1.5 bg-emerald-500/70 h-4 rounded-full" />
                <div className="w-1.5 bg-emerald-500 h-5 rounded-full" />
                <div className="w-1.5 bg-emerald-400 h-3 rounded-full" />
                <div className="w-1.5 bg-emerald-500 h-5 rounded-full" />
                <div className="w-1.5 bg-emerald-500/80 h-4 rounded-full" />
                <div className="w-1.5 bg-emerald-500 h-4.5 rounded-full" />
              </div>
            </div>

            {/* Floating Biometric HUD Pill 2: Progressive Overload Tracker (Bottom-Right) */}
            <div className="absolute -bottom-6 -right-3 sm:-right-8 p-3.5 rounded-2xl bg-[#14171E]/95 border border-[#D4FF00]/40 backdrop-blur-xl shadow-2xl max-w-[220px] hidden sm:block glow-volt z-30">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#D4FF00] font-bold uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#D4FF00]" />
                  Progressive Overload
                </span>
              </div>
              <div className="text-sm font-bold text-white font-mono">
                Goblet Squat: 24 kg × 10 reps
              </div>
              <div className="text-[11px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                +2 reps vs. Last Week (Peak)
              </div>
            </div>

            {/* Apple Watch Ultra Hardware Pip */}
            <div className="absolute top-1/2 -right-8 -translate-y-1/2 hidden xl:flex items-center gap-2 p-2.5 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md shadow-xl text-xs font-mono text-zinc-300">
              <Watch className="w-5 h-5 text-[#D4FF00]" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-zinc-400">Apple Watch Ultra</span>
                <span className="text-[11px] text-emerald-400 font-bold">Haptic Sync On</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
