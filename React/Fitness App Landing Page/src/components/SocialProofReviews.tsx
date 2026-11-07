import React, { useState } from 'react';
import { Star, ShieldCheck, Heart, TrendingUp, CheckCircle2, Sparkles, Filter } from 'lucide-react';
import { MEMBER_REVIEWS } from '../data/mockData';
import { MemberReview } from '../types';

export const SocialProofReviews: React.FC = () => {
  const [selectedSentiment, setSelectedSentiment] = useState<string>('All');

  const filteredReviews = MEMBER_REVIEWS.filter((r) => {
    if (selectedSentiment === 'All') return true;
    return r.highlightCategory === selectedSentiment;
  });

  return (
    <section className="py-20 md:py-28 border-t border-white/10 relative" id="reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111318] border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Consistency Over Hype
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Verified Telemetry & Athletic Outcomes
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-2">
            No crash diet photoshoots. Real members, verified Apple Watch and Whoop
            telemetry, and genuine cardiovascular improvements.
          </p>

          {/* Rating Summary Bar */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-4 p-3 rounded-2xl bg-[#111318] border border-white/10">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-mono text-sm font-bold text-white">4.92 ★</span>
            <span className="text-zinc-500">•</span>
            <span className="font-mono text-xs text-zinc-300">
              48,400+ App Store & Play Store Reviews
            </span>
          </div>
        </div>

        {/* Clickable Sentiment Filter Chips */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {[
            'All',
            'Apartment-friendly',
            'Apple Watch integration',
            'Zero knee pain',
            'Busy schedule',
          ].map((chip) => (
            <button
              key={chip}
              onClick={() => setSelectedSentiment(chip)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                selectedSentiment === chip
                  ? 'bg-[#D4FF00] text-[#08090C] shadow-md shadow-[#D4FF00]/20'
                  : 'bg-[#111318] text-zinc-400 border border-white/10 hover:border-white/20'
              }`}
            >
              {chip === 'All' ? 'All Outcomes' : chip}
            </button>
          ))}
        </div>

        {/* Telemetry Progression Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-3xl bg-[#111318] border border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-xl hover:border-white/20 transition-all"
            >
              <div>
                {/* Author Info & Badges */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.avatar}
                      alt={rev.author}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/50"
                    />
                    <div>
                      <h4 className="font-display text-base font-bold text-white">
                        {rev.author}
                      </h4>
                      <span className="text-xs font-mono text-zinc-400">
                        {rev.ageBracket} • {rev.tagline}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    {rev.workoutsCompleted} Workouts
                  </span>
                </div>

                {/* Telemetry Metric Before & After Pill */}
                <div className="my-4 p-3.5 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-zinc-500">
                    <span className="text-[10px] uppercase text-zinc-500 block">Baseline:</span>
                    {rev.beforeMetric}
                  </div>
                  <div className="text-emerald-400 font-bold">
                    <span className="text-[10px] uppercase text-emerald-500 block">Verified Delta:</span>
                    {rev.afterMetric}
                  </div>
                </div>

                {/* Quote */}
                <p className="text-sm text-zinc-300 leading-relaxed italic">
                  "{rev.quote}"
                </p>
              </div>

              {/* Bottom Tags */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {rev.verifiedBadges.map((b, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono text-[#D4FF00] bg-[#D4FF00]/10 px-2 py-0.5 rounded border border-[#D4FF00]/20"
                    >
                      ✓ {b}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
