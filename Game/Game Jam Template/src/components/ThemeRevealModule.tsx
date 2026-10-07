import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundFx } from '../lib/soundFx';
import type { CountdownResult } from '../hooks/useJamCountdown';
import { 
  Sparkles, 
  Lock, 
  Dices, 
  Zap, 
  Flame 
} from 'lucide-react';

interface ThemeRevealModuleProps {
  themeRevealed: boolean;
  themeKeyword: string;
  themeTagline: string;
  wildcardRules: string[];
  countdown: CountdownResult;
  onTriggerReveal: () => void;
}

export const ThemeRevealModule = ({
  themeRevealed,
  themeKeyword,
  themeTagline,
  wildcardRules,
  countdown,
  onTriggerReveal
}: ThemeRevealModuleProps) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(themeRevealed);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);

  // Trigger celebration effects
  const fireCelebrationConfetti = () => {
    try {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ['#F43F5E', '#06B6D4', '#F59E0B']
      });
      fire(0.2, {
        spread: 60,
        colors: ['#A855F7', '#10B981', '#ffffff']
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        colors: ['#F43F5E', '#06B6D4']
      });
    } catch {
      // Confetti fallback
    }
  };

  const handleRevealClimax = () => {
    setIsGlitching(true);
    soundFx.playGlitchStinger();

    setTimeout(() => {
      setIsFlipped(true);
      setIsGlitching(false);
      onTriggerReveal();
      fireCelebrationConfetti();
      soundFx.playThemeRevealFanfare();
    }, 450);
  };

  useEffect(() => {
    if (themeRevealed && !isFlipped) {
      setIsFlipped(true);
      fireCelebrationConfetti();
    }
  }, [themeRevealed, isFlipped]);

  return (
    <div 
      id="theme-reveal"
      className={`bg-[#0F121C] border border-[#222B42] rounded-xl p-6 shadow-2xl relative overflow-hidden transition-all ${
        isGlitching ? 'animate-shake ring-2 ring-rose-500' : ''
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Module Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[#222B42] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-white tracking-wide">
                THE UNVEILING BELL // SECRET THEME
              </h2>
              <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                isFlipped 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {isFlipped ? 'STATUS: UNMASKED' : 'STATUS: ENCRYPTED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Global zero-hour synchronization protocol. Unlocks creative theme & wildcard modifiers.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isFlipped ? (
            <button
              onClick={handleRevealClimax}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-bold font-mono text-xs rounded-lg shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              TRIGGER BELL CLIMAX
            </button>
          ) : (
            <button
              onClick={() => {
                fireCelebrationConfetti();
                soundFx.playThemeRevealFanfare();
              }}
              className="px-3 py-1.5 bg-[#171D2F] hover:bg-[#222B42] text-cyan-400 border border-cyan-500/30 font-mono text-xs rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              REPLAY FANFARE
            </button>
          )}
        </div>
      </div>

      {/* Hero Hologram Mystery Card */}
      <div className="my-2">
        {!isFlipped ? (
          /* Shrouded Pre-Reveal Vault */
          <div className="relative rounded-xl border-2 border-dashed border-amber-500/40 bg-gradient-to-b from-[#171D2F]/80 to-[#0F121C] p-8 text-center space-y-4 shadow-inner">
            <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <div className="font-mono text-xs text-amber-400 font-bold tracking-widest uppercase mb-1">
                [ CRYPTOGRAPHIC VAULT LOCKED ]
              </div>
              <h3 className="font-display font-black text-2xl md:text-3xl text-slate-200 tracking-wider">
                SECRET THEME ENCRYPTED
              </h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
                The jury has sealed the theme. The Unveiling Bell will automatically chime when the monotonic countdown reaches zero.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <div className="inline-flex items-center gap-2 bg-[#08090D] border border-amber-500/40 px-4 py-2 rounded-lg font-mono text-sm text-amber-300">
                <span>REVEAL COUNTDOWN:</span>
                <span className="font-bold text-white">{countdown.formattedClock}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Unmasked Theme Showcase Card */
          <div className="relative rounded-xl border border-cyan-500/40 bg-gradient-to-br from-[#171D2F] via-[#0F121C] to-[#171D2F] p-8 text-center space-y-4 shadow-2xl glow-cyan">
            <div className="flex items-center justify-center gap-2 text-rose-400 font-mono text-xs font-bold tracking-widest">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              OFFICIAL JAM THEME ANNOUNCEMENT
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>

            <h3 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-rose-300 tracking-wider uppercase drop-shadow-md">
              {themeKeyword}
            </h3>

            <p className="text-cyan-300 font-sans text-base md:text-lg max-w-xl mx-auto italic font-medium">
              "{themeTagline}"
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-700/50 text-cyan-300 text-xs font-mono">
                ✓ ALL GAME ENGINES PERMITTED
              </span>
              <span className="px-3 py-1 rounded-full bg-rose-950/40 border border-rose-700/50 text-rose-300 text-xs font-mono">
                ✓ 48-HOUR SPRINT
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-950/40 border border-purple-700/50 text-purple-300 text-xs font-mono">
                ✓ COMMUNITY RATED
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Wildcard Modifiers Section */}
      <div id="wildcards" className="mt-6 pt-5 border-t border-[#222B42]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Dices className="w-4 h-4 text-purple-400" />
            <h4 className="font-display font-bold text-sm text-white tracking-wide">
              WILDCARD MODIFIERS (OPTIONAL BRAINSTORM FUEL)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-purple-400 bg-purple-950/30 border border-purple-800/40 px-2 py-0.5 rounded">
            PICK 1 OR MIX MULTIPLE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {wildcardRules.map((rule, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border text-xs font-sans transition-all flex items-start gap-2.5 ${
                isFlipped
                  ? 'bg-[#171D2F] border-purple-500/30 hover:border-purple-500 text-slate-200 hover:shadow-lg hover:shadow-purple-950/40'
                  : 'bg-[#171D2F]/50 border-[#222B42] text-slate-500'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="leading-relaxed">
                {isFlipped ? rule : '[ENCRYPTED MODIFIER // UNLOCKED UPON ZERO-HOUR]'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
