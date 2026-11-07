import React, { useState, useMemo } from 'react';
import {
  Check,
  ShieldCheck,
  Sparkles,
  Zap,
  HelpCircle,
  ArrowRight,
  Gift,
  Bell,
  Clock,
  Lock,
} from 'lucide-react';
import { MEMBERSHIP_PLANS } from '../data/mockData';
import { MembershipPlan } from '../types';

interface MembershipPricingMatrixProps {
  onOpenQRModal: () => void;
  onOpenHsaModal: () => void;
}

export const MembershipPricingMatrix: React.FC<MembershipPricingMatrixProps> = ({
  onOpenQRModal,
  onOpenHsaModal,
}) => {
  const [weeklyFrequency, setWeeklyFrequency] = useState<number>(4);

  // Dynamic calculations based on slider
  const { costPerWorkout, studioMonthly, trainerMonthly, annualSavings } = useMemo(() => {
    const workoutsPerMonth = weeklyFrequency * 4.33;
    const flagshipMonthlyPrice = 9.99;
    const perWorkout = (flagshipMonthlyPrice / workoutsPerMonth).toFixed(2);

    const studioMonthlyCost = Math.round(workoutsPerMonth * 34); // $34 / class
    const trainerMonthlyCost = Math.round(workoutsPerMonth * 95); // $95 / hr

    const annualPulseFit = 119.88;
    const annualStudio = studioMonthlyCost * 12;
    const savings = annualStudio - annualPulseFit;

    return {
      costPerWorkout: perWorkout,
      studioMonthly: studioMonthlyCost,
      trainerMonthly: trainerMonthlyCost,
      annualSavings: savings.toLocaleString(),
    };
  }, [weeklyFrequency]);

  return (
    <section className="py-20 md:py-28 border-t border-white/10 relative" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111318] border border-[#D4FF00]/30 text-[#D4FF00] text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Economics
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Transparent Membership & "Cost-Per-Sweat" ROI
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-2">
            No gym initiation fees, zero hidden cancellation lock-ins, and 100% HSA/FSA pre-tax
            reimbursable.
          </p>
        </div>

        {/* Top Interactive "Cost-Per-Sweat" ROI Calculator Card */}
        <div className="max-w-3xl mx-auto mb-16 rounded-3xl border border-white/15 bg-gradient-to-b from-[#14171E] to-[#0E1015] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                Interactive Studio Replacement Calculator
              </span>
              <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                How many times do you plan to train per week?
              </h3>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-[#D4FF00] text-[#08090C] font-mono text-sm font-black self-start sm:self-auto shadow-md shadow-[#D4FF00]/20">
              {weeklyFrequency}x / Week
            </div>
          </div>

          {/* Slider */}
          <div className="relative mb-8">
            <input
              type="range"
              min="1"
              max="7"
              step="1"
              value={weeklyFrequency}
              onChange={(e) => setWeeklyFrequency(Number(e.target.value))}
              className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
            />
            <div className="flex justify-between text-xs font-mono text-zinc-500 mt-2 px-1">
              <span>1x (Casual)</span>
              <span>3x (Standard)</span>
              <span>5x (Athlete)</span>
              <span>7x (Elite)</span>
            </div>
          </div>

          {/* Dynamic 3-Column Comparison Readout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-white/10 items-center">
            {/* Boutique Studio */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">
                Boutique Studio Classes ({weeklyFrequency}x/wk)
              </span>
              <span className="font-mono text-xl font-bold text-zinc-500 line-through mt-1">
                ${studioMonthly} / mo
              </span>
              <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
                Avg $34 per class drop-in
              </span>
            </div>

            {/* In-Person Trainer */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">
                1-on-1 Personal Trainer
              </span>
              <span className="font-mono text-xl font-bold text-zinc-500 line-through mt-1">
                ${trainerMonthly} / mo
              </span>
              <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
                Avg $95 / 60-min session
              </span>
            </div>

            {/* PulseFit Membership Highlight */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col glow-emerald">
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">
                PulseFit Flagship
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono text-2xl font-black text-white tabular-nums">
                  ${costPerWorkout}
                </span>
                <span className="text-xs font-mono text-zinc-300">/ workout</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 font-semibold mt-0.5">
                Saves ${annualSavings} / year vs Studio
              </span>
            </div>
          </div>
        </div>

        {/* 3-Tier Membership Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {/* Card 1: Monthly Flexible */}
          <div className="rounded-3xl bg-[#111318] border border-white/10 p-8 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  Monthly Flexible
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-mono text-zinc-300 font-bold">
                  No Commitment
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-display text-4xl font-black text-white">$19.99</span>
                <span className="text-sm font-mono text-zinc-400">/ month</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6">
                Billed monthly. Pause, resume, or cancel in 1 tap from your phone settings.
              </p>

              <div className="space-y-3 pt-4 border-t border-white/10">
                {MEMBERSHIP_PLANS[0].features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={onOpenQRModal}
                className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all"
              >
                Start 7-Day Free Trial
              </button>
            </div>
          </div>

          {/* Card 2: Annual Athlete Flagship (Elevated) */}
          <div className="rounded-3xl bg-gradient-to-b from-[#181B22] via-[#12141A] to-[#0A0C10] border-2 border-[#D4FF00] p-8 flex flex-col justify-between shadow-2xl relative glow-volt-lg scale-100 lg:scale-105 z-20">
            {/* Top Ribbon */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#D4FF00] text-[#08090C] font-mono text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 fill-[#08090C]" />
              MOST POPULAR • SAVE 50% + FREE JUMP ROPE
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[#D4FF00] font-bold">
                  Annual Athlete Flagship
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                  Save $120/yr
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display text-5xl font-black text-white">$9.99</span>
                <span className="text-sm font-mono text-zinc-400">/ month</span>
              </div>
              <span className="text-xs font-mono text-zinc-400 block mb-4">
                Billed annually at $119.88 after 14-day trial
              </span>

              {/* Visual 14-Day Zero-Surprise Trial Timeline */}
              <div className="rounded-2xl bg-black/60 border border-white/10 p-4 mb-6">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-3">
                  Zero-Surprise 14-Day Free Trial Timeline:
                </span>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#D4FF00] mt-1.5 shrink-0 shadow-[0_0_8px_#D4FF00]" />
                    <div>
                      <span className="font-bold text-white">Day 1: Instant Full Access</span>
                      <p className="text-[11px] text-zinc-400 leading-tight">
                        Unlock 450+ workouts & custom blueprint ($0 charged today).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-400">Day 12: Heads-up Alert</span>
                      <p className="text-[11px] text-zinc-400 leading-tight">
                        We send an email & push notification before any billing occurs.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full border border-zinc-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold text-zinc-300">Day 14: Membership Begins</span>
                      <p className="text-[11px] text-zinc-400 leading-tight">
                        Cancel anytime with 1 click before Day 14 for $0.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2.5">
                {MEMBERSHIP_PLANS[1].features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-200">
                    <Check className="w-4 h-4 text-[#D4FF00] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={onOpenQRModal}
                className="w-full h-13 py-3.5 rounded-2xl bg-[#D4FF00] text-[#08090C] font-display text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-[#c3ec00] transition-all glow-volt active:scale-98 shadow-xl"
              >
                Claim 14-Day Free Trial & Blueprint
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenHsaModal}
                className="w-full mt-3 flex items-center justify-center gap-1.5 text-[11px] font-mono text-amber-400 hover:underline"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Check HSA/FSA TrueMed Pre-Tax Savings (~30% off)
              </button>
            </div>
          </div>

          {/* Card 3: Household & Fleet */}
          <div className="rounded-3xl bg-[#111318] border border-white/10 p-8 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  Household & Fleet
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-mono text-zinc-300 font-bold">
                  Up to 4 Profiles
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-display text-4xl font-black text-white">$14.99</span>
                <span className="text-sm font-mono text-zinc-400">/ month</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6">
                Billed annually at $179.88 ($3.74/mo per athlete profile).
              </p>

              <div className="space-y-3 pt-4 border-t border-white/10">
                {MEMBERSHIP_PLANS[2].features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={onOpenQRModal}
                className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all"
              >
                Start 14-Day Household Trial
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
