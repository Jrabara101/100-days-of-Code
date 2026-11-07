import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Flame,
  TrendingUp,
  Dumbbell,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Send,
  QrCode,
  Check,
} from 'lucide-react';
import { useBlueprintArchitect } from '../hooks/useBlueprintArchitect';
import { TrainingGoal, EquipmentTier } from '../types';

interface FourWeekPlanConfiguratorProps {
  onOpenQRModal: () => void;
}

export const FourWeekPlanConfigurator: React.FC<FourWeekPlanConfiguratorProps> = ({
  onOpenQRModal,
}) => {
  const {
    goal,
    setGoal,
    daysPerWeek,
    setDaysPerWeek,
    equipment,
    setEquipment,
    selectedWeek,
    setSelectedWeek,
    schedule,
    estimatedWeeklyCalories,
    projectedLeanMassDeltaLbs,
    projectedVo2MaxDelta,
    goalTitle,
    equipmentTitle,
    token,
    deepLinkUrl,
    isSyncing,
  } = useBlueprintArchitect();

  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [smsSent, setSmsSent] = useState<boolean>(false);
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsSendingSms(true);
    setTimeout(() => {
      setIsSendingSms(false);
      setSmsSent(true);
    }, 900);
  };

  return (
    <section className="py-20 md:py-28 border-t border-white/10 relative" id="plan-builder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main 2-Column Asymmetric Configurator Card */}
        <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-[#111318] via-[#0E1015] to-[#08090C] p-6 sm:p-10 lg:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: 3-Step Constraint Controls (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#D4FF00] font-bold block mb-2">
                CUSTOMIZE YOUR TRAINING SPLIT
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Build your 4-week blueprint in 30 seconds
              </h2>
              <p className="text-zinc-400 text-sm mt-2">
                Every parameter updates your microcycle calendar and generates a live
                deferred deep-link payload.
              </p>
            </div>

            {/* Step 1: Primary Goal */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-mono uppercase font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#D4FF00] text-[#08090C] flex items-center justify-center font-mono text-xs font-black">
                    1
                  </span>
                  Primary Goal Driver
                </span>
                <span className="text-[#D4FF00] lowercase font-normal">{goal}</span>
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: 'hypertrophy',
                    title: '💪 Lean Hypertrophy & Density',
                    desc: 'Mechanical tension, progressive overload & muscle growth',
                  },
                  {
                    id: 'conditioning',
                    title: '🔥 Metabolic Conditioning & Power',
                    desc: 'Lactate threshold, sprint engine & fat oxidation',
                  },
                  {
                    id: 'longevity',
                    title: '🧬 Joint Longevity, Core & VO2 Max',
                    desc: 'Zone 2 base, thoracic decompression & mobility',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setGoal(item.id as TrainingGoal)}
                    className={`text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      goal === item.id
                        ? 'bg-[#181B22] border-[#D4FF00] text-white shadow-lg'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {item.title}
                      </span>
                      <span className="text-xs text-zinc-400 mt-0.5 block">
                        {item.desc}
                      </span>
                    </div>
                    {goal === item.id ? (
                      <CheckCircle2 className="w-5 h-5 text-[#D4FF00] shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Weekly Days */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-mono uppercase font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#D4FF00] text-[#08090C] flex items-center justify-center font-mono text-xs font-black">
                    2
                  </span>
                  Weekly Commitment
                </span>
                <span className="text-[#D4FF00]">{daysPerWeek} Days / Week</span>
              </label>

              <div className="grid grid-cols-4 gap-2">
                {[3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setDaysPerWeek(num)}
                    className={`py-3 rounded-xl font-mono text-xs font-bold transition-all ${
                      daysPerWeek === num
                        ? 'bg-[#D4FF00] text-[#08090C] shadow-md shadow-[#D4FF00]/20'
                        : 'bg-black/50 border border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {num} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Equipment */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-mono uppercase font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#D4FF00] text-[#08090C] flex items-center justify-center font-mono text-xs font-black">
                    3
                  </span>
                  Available Gear
                </span>
                <span className="text-[#D4FF00] capitalize">{equipment}</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bodyweight', label: 'Bodyweight' },
                  { id: 'dumbbells', label: 'Home DBs' },
                  { id: 'full_gym', label: 'Full Gym' },
                ].map((gear) => (
                  <button
                    key={gear.id}
                    onClick={() => setEquipment(gear.id as EquipmentTier)}
                    className={`py-3 px-2 rounded-xl font-mono text-xs font-bold text-center transition-all ${
                      equipment === gear.id
                        ? 'bg-[#D4FF00] text-[#08090C] shadow-md shadow-[#D4FF00]/20'
                        : 'bg-black/50 border border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {gear.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sync Status Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                State Persistence Active
              </span>
              <span className="text-[#D4FF00] font-bold">
                Token: {token}
              </span>
            </div>
          </div>

          {/* Right Column: Live Generated 4-Week Schedule Preview & QR Handoff (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            {/* Header Strip & Projections */}
            <div className="p-5 rounded-2xl bg-[#08090C] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                  Generated Microcycle
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  {daysPerWeek}-Day {goalTitle} ({equipmentTitle})
                </h3>
              </div>

              {/* Dynamic Projection Pills */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
                  <Flame className="w-3.5 h-3.5" />
                  ~{estimatedWeeklyCalories.toLocaleString()} kcal/wk
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#D4FF00]/10 border border-[#D4FF00]/30 font-mono text-xs font-bold text-[#D4FF00]">
                  +{projectedLeanMassDeltaLbs} lb Mass Delta
                </div>
              </div>
            </div>

            {/* Week Selector Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((wk) => (
                  <button
                    key={wk}
                    onClick={() => setSelectedWeek(wk)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                      selectedWeek === wk
                        ? 'bg-white/20 text-[#D4FF00] border border-[#D4FF00]/40'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Week {wk} {wk === 4 ? '(Peak)' : ''}
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Auto-Scales with Apple Watch Data
              </span>
            </div>

            {/* 7-Day Interactive Schedule Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              {schedule.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[140px] ${
                    isSyncing ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                  } ${
                    day.isRest
                      ? 'bg-black/30 border-white/5 text-zinc-500'
                      : day.colorScheme === 'emerald'
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400'
                      : day.colorScheme === 'volt'
                      ? 'bg-[#D4FF00]/10 border-[#D4FF00]/30 hover:border-[#D4FF00]'
                      : day.colorScheme === 'crimson'
                      ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400'
                      : 'bg-sky-950/20 border-sky-500/30 hover:border-sky-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-white">
                        {day.dayName}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400">
                        {day.isRest ? 'REST' : `${day.duration}m`}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-200 line-clamp-2 leading-tight">
                      {day.title}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5">
                    <span
                      className={`text-[9px] font-mono uppercase font-semibold block truncate ${
                        day.isRest
                          ? 'text-zinc-500'
                          : day.colorScheme === 'emerald'
                          ? 'text-emerald-400'
                          : day.colorScheme === 'volt'
                          ? 'text-[#D4FF00]'
                          : day.colorScheme === 'crimson'
                          ? 'text-rose-400'
                          : 'text-sky-400'
                      }`}
                    >
                      {day.focus}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Web-to-App Deep-Link Handoff Box */}
            <div className="rounded-2xl bg-black/75 border border-[#D4FF00]/40 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              {/* Left: Dynamic QR Code + Copy */}
              <div
                onClick={onOpenQRModal}
                className="flex items-center gap-4 cursor-pointer group"
              >
                {/* Simulated High-Res SVG QR Code */}
                <div className="w-20 h-20 rounded-xl bg-black p-1.5 border border-[#D4FF00] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                  <div className="grid grid-cols-5 gap-0.5 w-full h-full p-0.5">
                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-[#D4FF00] rounded-xs" />

                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-black" />
                    <div className="bg-black" />
                    <div className="bg-black" />
                    <div className="bg-[#D4FF00] rounded-xs" />

                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-black" />
                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-black" />
                    <div className="bg-[#D4FF00] rounded-xs" />

                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-black" />
                    <div className="bg-black" />
                    <div className="bg-black" />
                    <div className="bg-[#D4FF00] rounded-xs" />

                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-[#D4FF00] rounded-xs" />
                    <div className="bg-[#D4FF00] rounded-xs" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white group-hover:text-[#D4FF00] transition-colors flex items-center gap-1">
                    Scan-to-Pocket Handoff <QrCode className="w-3.5 h-3.5 text-[#D4FF00]" />
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight max-w-[200px]">
                    Scan with your camera. Your custom 4-week split hydrates on first app
                    launch.
                  </p>
                </div>
              </div>

              {/* Right: SMS Magic Link Form */}
              <div className="w-full sm:w-auto flex-1 sm:max-w-xs">
                {smsSent ? (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold">Magic Link Sent!</span> Check your phone
                      messages to claim your plan.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendSms} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="📱 (555) 019-2834"
                        className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4FF00]"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSendingSms}
                        className="h-11 px-4 rounded-xl bg-[#D4FF00] text-[#08090C] text-xs font-bold font-mono whitespace-nowrap hover:bg-[#c3ec00] transition-all flex items-center gap-1.5 glow-volt shrink-0"
                      >
                        {isSendingSms ? 'Sending...' : 'Text Link'}
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 text-center">
                      No spam. Standard carrier SMS rates apply.
                    </span>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
