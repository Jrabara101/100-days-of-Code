import React, { useState } from 'react';
import { X, Heart, Flame, ShieldAlert, CheckCircle2, Play, Volume2, QrCode, Smartphone } from 'lucide-react';
import { Workout } from '../types';

interface WorkoutPreviewModalProps {
  workout: Workout | null;
  onClose: () => void;
  onOpenQR: () => void;
}

export const WorkoutPreviewModal: React.FC<WorkoutPreviewModalProps> = ({
  workout,
  onClose,
  onOpenQR,
}) => {
  if (!workout) return null;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#111318] border border-white/15 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header Media Stage */}
        <div className="relative h-60 bg-gradient-to-t from-[#111318] via-black/50 to-transparent flex flex-col justify-between p-6">
          <img
            src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"
            alt={workout.title}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-transparent to-black/60" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 border border-white/20 text-zinc-300 hover:text-white transition-all hover:scale-105"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Chips */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#D4FF00] text-[#08090C] font-mono text-xs font-black uppercase">
              {workout.heartRateZone}
            </span>
            {workout.isApartmentFriendly && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-semibold">
                🏢 Apartment Zero-Jump
              </span>
            )}
          </div>

          {/* Title & Coach */}
          <div className="relative z-10">
            <h3 className="font-display text-2xl font-extrabold text-white">
              {workout.title}
            </h3>
            <p className="text-zinc-300 text-sm mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4FF00]"></span>
              {workout.coachName} • {workout.circuitsCount} Coached Circuits
            </p>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Telemetry Grid */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#08090C] border border-white/10 font-mono">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase">Duration</span>
              <span className="text-lg font-bold text-white">{workout.durationMinutes} Mins</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase">Est. Caloric Burn</span>
              <span className="text-lg font-bold text-[#D4FF00]">~{workout.avgCaloriesBurned} kcal</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase">Difficulty</span>
              <span className="text-lg font-bold text-emerald-400 capitalize">{workout.difficulty}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
              Biomechanical Objective
            </h4>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {workout.description}
            </p>
          </div>

          {/* Primary Targeted Muscles */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
              Primary Muscle Activation
            </h4>
            <div className="flex flex-wrap gap-2">
              {workout.primaryMuscles.map((muscle) => (
                <span
                  key={muscle}
                  className="px-3 py-1 rounded-lg bg-white/5 border border-white/15 text-xs font-mono text-[#D4FF00] font-semibold"
                >
                  {muscle}
                </span>
              ))}
            </div>
          </div>

          {/* Equipment Needed */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
              Required Gear
            </h4>
            <div className="flex flex-wrap gap-2">
              {workout.equipmentTags.map((eq) => (
                <span
                  key={eq}
                  className="px-3 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-300"
                >
                  ✓ {eq}
                </span>
              ))}
            </div>
          </div>

          {/* Form Coaching Cues */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold mb-1">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Coach Form Cue:
            </div>
            <p className="text-xs text-zinc-300 italic">
              "Lock the core at the top of the movement. Avoid hyperextending the lumbar spine. Let the eccentric descent take 3 full seconds to maximize mechanical tension."
            </p>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="p-5 border-t border-white/10 bg-[#08090C] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-zinc-400">
            Available on iOS, Android, and Apple TV 4K
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onOpenQR();
              }}
              className="flex-1 sm:flex-initial h-11 px-5 rounded-xl bg-[#D4FF00] text-[#08090C] font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#c3ec00] transition-all glow-volt"
            >
              <Smartphone className="w-4 h-4" />
              Beam Workout to My Phone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
