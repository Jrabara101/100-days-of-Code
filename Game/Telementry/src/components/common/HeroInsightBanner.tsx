import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Clock, 
  TrendingUp, 
  HelpCircle 
} from 'lucide-react';

interface HeroInsightBannerProps {
  sentence: string;
  onOpenWhy: () => void;
  weeklyPlaytimeHours: number;
  showPlaytimeAwareness: boolean;
  setShowPlaytimeAwareness: (show: boolean) => void;
  streakDays: number;
  wasStreakForgiven: boolean;
}

export const HeroInsightBanner: React.FC<HeroInsightBannerProps> = ({
  sentence,
  onOpenWhy,
  weeklyPlaytimeHours,
  showPlaytimeAwareness,
  setShowPlaytimeAwareness,
  streakDays,
  wasStreakForgiven
}) => {
  return (
    <section 
      className="relative rounded bg-gradient-to-r from-[#0d1322] via-[#101828] to-[#0d1322] border border-cyan-500/30 p-5 sm:p-6 shadow-[0_0_25px_rgba(0,240,255,0.08)] overflow-hidden"
      aria-label="Cognitive Hero Insight"
    >
      {/* Subtle decorative background laser lines */}
      <div className="absolute top-0 right-0 w-96 h-full bg-[radial-gradient(circle_at_top_right,rgba(0,240,255,0.06),transparent_70%)] pointer-events-none" />
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          {/* Diagnostic Tag */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              AI COMBAT COGNITION // REAL-TIME DEBRIEF
            </span>

            {/* Streak with Forgiveness Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <TrendingUp className="w-3 h-3" />
              {streakDays} DAY STREAK
              {wasStreakForgiven && (
                <span className="text-amber-300 ml-1 font-bold">(Protected by Freeze)</span>
              )}
            </span>
          </div>

          {/* The Hero Sentence (Decision 2: Plain-language insight, not raw KPIs) */}
          <div className="pt-1">
            <h1 className="font-['Space_Grotesk'] text-lg sm:text-xl md:text-2xl font-semibold text-slate-100 leading-snug tracking-tight">
              "{sentence}"
            </h1>
          </div>

          {/* Supporting Evidence Trigger & Context Tags */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onOpenWhy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 hover:text-white text-xs font-['JetBrains_Mono'] font-bold transition shadow-[0_0_12px_rgba(0,240,255,0.25)] group"
              aria-label="Open supporting data explanation"
            >
              <span>[ Why? View Supporting Evidence ]</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>

            <span className="text-[11px] font-['JetBrains_Mono'] text-slate-400 hidden sm:inline">
              Trigger: Recoil stabilization on Phantom-X • Ranked Elo +142
            </span>
          </div>
        </div>

        {/* Gentle Playtime Awareness Line (Decision 5: Non-judgmental, optional, hideable) */}
        <div className="flex flex-col items-start md:items-end justify-between self-stretch border-t md:border-t-0 md:border-l border-[#1f293d] pt-3 md:pt-0 md:pl-5 min-w-[190px]">
          <div className="flex items-center gap-2">
            <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400 uppercase tracking-wider">
              Health Awareness
            </span>
            <button
              onClick={() => setShowPlaytimeAwareness(!showPlaytimeAwareness)}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition"
              title={showPlaytimeAwareness ? 'Hide weekly playtime awareness' : 'Show weekly playtime awareness'}
              aria-label="Toggle weekly playtime"
            >
              {showPlaytimeAwareness ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showPlaytimeAwareness ? (
            <div className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-['JetBrains_Mono'] text-lg font-bold text-slate-200">
                  {weeklyPlaytimeHours}h
                </span>
                <span className="text-xs text-slate-400 font-['Inter']">this week</span>
              </div>
              <p className="text-[10px] text-slate-500 font-['Inter'] mt-0.5">
                Paced session schedule (3.2h daily avg)
              </p>
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-slate-500 italic">
              Playtime counter hidden
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
