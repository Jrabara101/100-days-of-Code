import React, { useState, useMemo } from 'react';
import {
  Flame,
  Zap,
  Building,
  Dumbbell,
  ShieldCheck,
  Play,
  Volume2,
  Clock,
  Sparkles,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { WORKOUTS } from '../data/mockData';
import { Workout } from '../types';
import { WorkoutPreviewModal } from './WorkoutPreviewModal';

interface InteractiveWorkoutExplorerProps {
  onOpenQR: () => void;
}

type MuscleZone =
  | 'All Muscles'
  | 'Glutes & Posterior Chain'
  | 'Core & Spinal Mobility'
  | 'Upper Push'
  | 'Upper Pull & Lats'
  | 'Quads & Anterior'
  | 'VO2 Max Cardio';

export const InteractiveWorkoutExplorer: React.FC<InteractiveWorkoutExplorerProps> = ({
  onOpenQR,
}) => {
  const [selectedConstraint, setSelectedConstraint] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleZone>('All Muscles');
  const [anatomyView, setAnatomyView] = useState<'front' | 'back'>('front');
  const [activePreviewWorkout, setActivePreviewWorkout] = useState<Workout | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Filter workouts based on environment, duration, and muscle
  const filteredWorkouts = useMemo(() => {
    return WORKOUTS.filter((w) => {
      // Constraint filter
      if (selectedConstraint === 'apartment' && !w.isApartmentFriendly) return false;
      if (selectedConstraint === 'dumbbells' && !w.equipmentTags.some((t) => t.toLowerCase().includes('dumbbell'))) return false;
      if (selectedConstraint === 'kettlebell' && !w.equipmentTags.some((t) => t.toLowerCase().includes('kettlebell'))) return false;
      if (selectedConstraint === 'mobility' && w.category !== 'mobility') return false;
      if (selectedConstraint === 'hiit' && w.category !== 'hiit') return false;

      // Duration filter
      if (selectedDuration === '15' && w.durationMinutes > 15) return false;
      if (selectedDuration === '20' && (w.durationMinutes < 16 || w.durationMinutes > 25)) return false;
      if (selectedDuration === '30' && (w.durationMinutes < 26 || w.durationMinutes > 35)) return false;
      if (selectedDuration === '45' && w.durationMinutes < 36) return false;

      // Muscle target filter
      if (selectedMuscle !== 'All Muscles') {
        const matchesMuscle = w.primaryMuscles.some((m) =>
          m.toLowerCase().includes(selectedMuscle.toLowerCase().split(' ')[0])
        );
        if (!matchesMuscle) return false;
      }

      return true;
    });
  }, [selectedConstraint, selectedDuration, selectedMuscle]);

  return (
    <section className="py-20 md:py-28 border-t border-white/10 relative" id="workouts">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111318] border border-[#D4FF00]/30 text-[#D4FF00] text-xs font-mono font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Try Before You Download
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Interactive Workout & Muscle Explorer
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-xl">
              Toggle your exact room constraints and target muscle zones to watch the catalog
              dynamically adapt. Test form loops before ever touching the App Store.
            </p>
          </div>

          {/* Duration Selector Segmented Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-[#111318] rounded-xl border border-white/10 self-start md:self-auto overflow-x-auto">
            <span className="text-[11px] font-mono text-zinc-400 px-2 uppercase hidden sm:inline">
              Duration:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: '15', label: '15m' },
              { id: '20', label: '20m' },
              { id: '30', label: '30m' },
              { id: '45', label: '45m+' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDuration(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  selectedDuration === d.id
                    ? 'bg-[#D4FF00] text-[#08090C] shadow-md shadow-[#D4FF00]/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top Environment & Space Filter Matrix */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {[
            { id: 'all', label: 'All Workouts (450+)' },
            { id: 'apartment', label: '🏢 Apartment / Zero-Jump' },
            { id: 'dumbbells', label: '🏋️ Dumbbells Only' },
            { id: 'kettlebell', label: '🔔 Kettlebell Flow' },
            { id: 'mobility', label: '🧘 Mobility & Core' },
            { id: 'hiit', label: '🏃 HIIT & Conditioning' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedConstraint(pill.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                selectedConstraint === pill.id
                  ? 'bg-white/15 text-[#D4FF00] border border-[#D4FF00]/50 shadow-md'
                  : 'bg-[#111318] text-zinc-400 border border-white/5 hover:border-white/20'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* 2-Column Split: Anatomy Explorer (4 cols) & Bento Grid (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Pane: Interactive SVG Muscle-Target Map (4 Columns) */}
          <div className="lg:col-span-4 rounded-3xl bg-[#111318] border border-white/10 p-6 flex flex-col items-center justify-between shadow-xl">
            {/* Header & Front/Back Toggle */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-400 block tracking-wider">
                  Biomechanical Target
                </span>
                <span className="text-sm font-bold text-white font-display">
                  Anatomy Explorer
                </span>
              </div>

              {/* View Switcher Pill */}
              <div className="flex items-center gap-1 p-1 bg-black/60 rounded-xl border border-white/10 text-xs font-mono">
                <button
                  onClick={() => setAnatomyView('front')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    anatomyView === 'front'
                      ? 'bg-[#D4FF00] text-[#08090C] font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Front
                </button>
                <button
                  onClick={() => setAnatomyView('back')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    anatomyView === 'back'
                      ? 'bg-[#D4FF00] text-[#08090C] font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Back
                </button>
              </div>
            </div>

            {/* Interactive Anatomical SVG Diagram */}
            <div className="relative my-6 w-full max-w-[260px] h-[340px] flex items-center justify-center">
              <svg viewBox="0 0 200 320" className="w-full h-full drop-shadow-2xl">
                {/* Background grid lines */}
                <defs>
                  <linearGradient id="voltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4FF00" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                  <linearGradient id="defaultGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#252A36" />
                    <stop offset="100%" stopColor="#181C26" />
                  </linearGradient>
                </defs>

                {/* Head */}
                <circle
                  cx="100"
                  cy="32"
                  r="18"
                  fill="url(#defaultGradient)"
                  stroke="#3A4150"
                  strokeWidth="1.5"
                />

                {/* Neck & Traps */}
                <path
                  d="M90 48 L110 48 L125 65 L75 65 Z"
                  fill={selectedMuscle === 'Upper Push' || selectedMuscle === 'Upper Pull & Lats' ? '#D4FF00' : 'url(#defaultGradient)'}
                  stroke="#3A4150"
                  strokeWidth="1.2"
                  className="cursor-pointer hover:opacity-80 transition-all"
                  onClick={() => setSelectedMuscle('Upper Push')}
                />

                {/* Chest (Front) or Upper Back / Lats (Back) */}
                {anatomyView === 'front' ? (
                  <path
                    d="M75 68 L125 68 L120 105 L80 105 Z"
                    fill={selectedMuscle === 'Upper Push' ? '#D4FF00' : '#1F2430'}
                    stroke={selectedMuscle === 'Upper Push' ? '#D4FF00' : '#3A4150'}
                    strokeWidth="1.5"
                    className="cursor-pointer hover:fill-[#D4FF00]/80 transition-all"
                    onClick={() => setSelectedMuscle('Upper Push')}
                  />
                ) : (
                  <path
                    d="M75 68 L125 68 L122 115 L78 115 Z"
                    fill={selectedMuscle === 'Upper Pull & Lats' ? '#D4FF00' : '#1F2430'}
                    stroke={selectedMuscle === 'Upper Pull & Lats' ? '#D4FF00' : '#3A4150'}
                    strokeWidth="1.5"
                    className="cursor-pointer hover:fill-[#D4FF00]/80 transition-all"
                    onClick={() => setSelectedMuscle('Upper Pull & Lats')}
                  />
                )}

                {/* Core / Abdominals (Front) or Lower Back & Erector (Back) */}
                <path
                  d="M80 108 L120 108 L115 155 L85 155 Z"
                  fill={selectedMuscle === 'Core & Spinal Mobility' ? '#10B981' : '#1A1E28'}
                  stroke={selectedMuscle === 'Core & Spinal Mobility' ? '#10B981' : '#3A4150'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-emerald-400 transition-all"
                  onClick={() => setSelectedMuscle('Core & Spinal Mobility')}
                />

                {/* Shoulders / Deltoids Left & Right */}
                <circle
                  cx="65"
                  cy="75"
                  r="12"
                  fill={selectedMuscle === 'Upper Push' ? '#D4FF00' : '#1F2430'}
                  stroke="#3A4150"
                  strokeWidth="1.2"
                  className="cursor-pointer hover:fill-[#D4FF00] transition-all"
                  onClick={() => setSelectedMuscle('Upper Push')}
                />
                <circle
                  cx="135"
                  cy="75"
                  r="12"
                  fill={selectedMuscle === 'Upper Push' ? '#D4FF00' : '#1F2430'}
                  stroke="#3A4150"
                  strokeWidth="1.2"
                  className="cursor-pointer hover:fill-[#D4FF00] transition-all"
                  onClick={() => setSelectedMuscle('Upper Push')}
                />

                {/* Arms */}
                <rect
                  x="50"
                  y="90"
                  width="12"
                  height="50"
                  rx="6"
                  fill="#181C26"
                  stroke="#3A4150"
                  strokeWidth="1"
                />
                <rect
                  x="138"
                  y="90"
                  width="12"
                  height="50"
                  rx="6"
                  fill="#181C26"
                  stroke="#3A4150"
                  strokeWidth="1"
                />

                {/* Glutes & Hips (Back) vs Hips & Quads (Front) */}
                {anatomyView === 'back' ? (
                  <path
                    d="M82 158 C85 158 98 175 98 190 C85 190 74 180 74 165 Z"
                    fill={selectedMuscle === 'Glutes & Posterior Chain' ? '#D4FF00' : '#1F2430'}
                    stroke={selectedMuscle === 'Glutes & Posterior Chain' ? '#D4FF00' : '#3A4150'}
                    strokeWidth="1.5"
                    className="cursor-pointer hover:fill-[#D4FF00] transition-all"
                    onClick={() => setSelectedMuscle('Glutes & Posterior Chain')}
                  />
                ) : (
                  <path
                    d="M85 158 L115 158 L120 185 L80 185 Z"
                    fill={selectedMuscle === 'Glutes & Posterior Chain' ? '#D4FF00' : '#1F2430'}
                    stroke={selectedMuscle === 'Glutes & Posterior Chain' ? '#D4FF00' : '#3A4150'}
                    strokeWidth="1.5"
                    className="cursor-pointer hover:fill-[#D4FF00] transition-all"
                    onClick={() => setSelectedMuscle('Glutes & Posterior Chain')}
                  />
                )}

                {anatomyView === 'back' && (
                  <path
                    d="M118 158 C115 158 102 175 102 190 C115 190 126 180 126 165 Z"
                    fill={selectedMuscle === 'Glutes & Posterior Chain' ? '#D4FF00' : '#1F2430'}
                    stroke={selectedMuscle === 'Glutes & Posterior Chain' ? '#D4FF00' : '#3A4150'}
                    strokeWidth="1.5"
                    className="cursor-pointer hover:fill-[#D4FF00] transition-all"
                    onClick={() => setSelectedMuscle('Glutes & Posterior Chain')}
                  />
                )}

                {/* Quads / Hamstrings Left & Right */}
                <path
                  d="M75 192 L96 192 L93 255 L78 255 Z"
                  fill={
                    anatomyView === 'front'
                      ? selectedMuscle === 'Quads & Anterior'
                        ? '#10B981'
                        : '#181C26'
                      : selectedMuscle === 'Glutes & Posterior Chain'
                      ? '#D4FF00'
                      : '#181C26'
                  }
                  stroke="#3A4150"
                  strokeWidth="1.2"
                  className="cursor-pointer hover:opacity-80 transition-all"
                  onClick={() =>
                    anatomyView === 'front'
                      ? setSelectedMuscle('Quads & Anterior')
                      : setSelectedMuscle('Glutes & Posterior Chain')
                  }
                />
                <path
                  d="M104 192 L125 192 L122 255 L107 255 Z"
                  fill={
                    anatomyView === 'front'
                      ? selectedMuscle === 'Quads & Anterior'
                        ? '#10B981'
                        : '#181C26'
                      : selectedMuscle === 'Glutes & Posterior Chain'
                      ? '#D4FF00'
                      : '#181C26'
                  }
                  stroke="#3A4150"
                  strokeWidth="1.2"
                  className="cursor-pointer hover:opacity-80 transition-all"
                  onClick={() =>
                    anatomyView === 'front'
                      ? setSelectedMuscle('Quads & Anterior')
                      : setSelectedMuscle('Glutes & Posterior Chain')
                  }
                />

                {/* Calves */}
                <rect
                  x="78"
                  y="260"
                  width="13"
                  height="45"
                  rx="6"
                  fill="#151822"
                  stroke="#3A4150"
                  strokeWidth="1"
                />
                <rect
                  x="109"
                  y="260"
                  width="13"
                  height="45"
                  rx="6"
                  fill="#151822"
                  stroke="#3A4150"
                  strokeWidth="1"
                />
              </svg>
            </div>

            {/* Quick Muscle Selector Chips */}
            <div className="w-full flex flex-wrap gap-1.5 justify-center mb-4">
              {[
                'All Muscles',
                'Glutes & Posterior Chain',
                'Core & Spinal Mobility',
                'Upper Push',
                'Upper Pull & Lats',
                'VO2 Max Cardio',
              ].map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMuscle(m as MuscleZone)}
                  className={`text-[10px] font-mono px-2 py-1 rounded-lg transition-all ${
                    selectedMuscle === m
                      ? 'bg-[#D4FF00] text-[#08090C] font-bold shadow'
                      : 'bg-black/40 text-zinc-400 hover:text-white'
                  }`}
                >
                  {m.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Bottom Readout Status */}
            <div className="w-full p-3 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between text-xs font-mono">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 uppercase">Focus Zone</span>
                <span className="text-emerald-400 font-bold truncate max-w-[170px]">
                  {selectedMuscle}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                {filteredWorkouts.length} Workouts
              </span>
            </div>
          </div>

          {/* Right Pane: 60fps Hover-Play Workout Bento Grid (8 Columns) */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredWorkouts.length === 0 ? (
              <div className="md:col-span-2 p-12 text-center rounded-3xl bg-[#111318] border border-white/10">
                <p className="text-zinc-400 font-mono text-sm">
                  No workouts found with this specific filter combination.
                </p>
                <button
                  onClick={() => {
                    setSelectedConstraint('all');
                    setSelectedDuration('all');
                    setSelectedMuscle('All Muscles');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#D4FF00] text-[#08090C] font-mono text-xs font-bold"
                >
                  Reset Constraints
                </button>
              </div>
            ) : (
              filteredWorkouts.map((w) => (
                <div
                  key={w.id}
                  onMouseEnter={() => setHoveredCardId(w.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className="group rounded-3xl bg-[#111318] border border-white/10 overflow-hidden hover:border-[#D4FF00]/50 transition-all duration-300 shadow-xl flex flex-col justify-between"
                >
                  {/* Card Media Reel */}
                  <div className="relative aspect-video overflow-hidden bg-black flex flex-col justify-between p-3.5">
                    {/* Simulated High-Res Video Loop */}
                    <img
                      src={
                        w.category === 'kettlebell'
                          ? 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'
                          : w.category === 'mobility'
                          ? 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80'
                          : w.category === 'hiit'
                          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
                          : 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={w.title}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                        hoveredCardId === w.id ? 'scale-110 opacity-90' : 'opacity-65'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-transparent to-black/60 pointer-events-none" />

                    {/* Top Chips */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-black/75 border border-white/20 text-[#D4FF00] font-mono text-[10px] font-bold">
                          ⚡ {w.durationMinutes} MIN
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/75 border border-white/20 text-zinc-300 font-mono text-[10px]">
                          🔥 {w.avgCaloriesBurned} KCAL
                        </span>
                        {w.isApartmentFriendly && (
                          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] border border-emerald-500/30">
                            🏢 LOW NOISE
                          </span>
                        )}
                      </div>

                      {/* Heart Rate Zone */}
                      <span className="px-2 py-0.5 rounded-full bg-black/80 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-bold">
                        {w.heartRateZone.split(' ')[0]} {w.heartRateZone.split(' ')[1]}
                      </span>
                    </div>

                    {/* Hover Overlay Feedback */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm">
                        {hoveredCardId === w.id ? '60fps Form Loop Running' : 'Hover to preview circuit'}
                      </span>
                      <button
                        onClick={() => setActivePreviewWorkout(w)}
                        className="px-2 py-1 rounded bg-[#D4FF00] text-[#08090C] text-[10px] font-mono font-bold flex items-center gap-1 hover:brightness-110"
                      >
                        <Play className="w-2.5 h-2.5 fill-[#08090C]" /> Preview
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="font-display text-base font-extrabold text-white group-hover:text-[#D4FF00] transition-colors leading-snug">
                        {w.title}
                      </h3>
                      <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                        {w.description}
                      </p>
                    </div>

                    {/* Coach & Equipment Row */}
                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={w.coachAvatar}
                          alt={w.coachName}
                          className="w-7 h-7 rounded-full object-cover border border-[#D4FF00]/40"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white leading-none">
                            {w.coachName}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            {w.equipmentTags[0]}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActivePreviewWorkout(w)}
                        className="text-xs font-mono font-bold text-[#D4FF00] hover:underline flex items-center gap-1"
                      >
                        Full Circuit <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Circuit Modal */}
      <WorkoutPreviewModal
        workout={activePreviewWorkout}
        onClose={() => setActivePreviewWorkout(null)}
        onOpenQR={onOpenQR}
      />
    </section>
  );
};
