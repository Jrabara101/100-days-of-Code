import React from 'react';
import { Spot } from '../types';
import { X, Volume2, Sun, Sparkles, Check, ShieldCheck, Zap } from 'lucide-react';

interface SeatSightlineModalProps {
  spot: Spot | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSpot: (spot: Spot) => void;
  isCurrentlySelected: boolean;
}

export const SeatSightlineModal: React.FC<SeatSightlineModalProps> = ({
  spot,
  isOpen,
  onClose,
  onConfirmSpot,
  isCurrentlySelected,
}) => {
  if (!isOpen || !spot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#1B1F24] rounded-2xl border border-stone-800/10 dark:border-white/10 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Hero Image of the Seat / Station Sightline */}
        <div className="relative h-56 sm:h-64 w-full bg-stone-900 overflow-hidden">
          <img
            src={spot.photoUrl}
            alt={spot.name}
            className="w-full h-full object-cover brightness-95 hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Floating Spot Badge & Zone */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-[#C85A32] text-white font-bold tracking-wider">
                {spot.code}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mt-1">
                {spot.name}
              </h3>
              <p className="text-xs text-white/80 font-sans">
                {spot.zoneName}
              </p>
            </div>
            <span className="font-mono text-sm text-emerald-400 font-bold bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
              {spot.noiseDb} dB
            </span>
          </div>
        </div>

        {/* Modal Body: Sightline Specs & Sensory Pills */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Spatial Sightline Narrative */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#828B86] mb-1">
              Architectural Sightline &amp; Atmosphere
            </h4>
            <p className="text-sm text-[#18201C] dark:text-[#F6F4F0] leading-relaxed">
              {spot.sightlineSummary}
            </p>
          </div>

          {/* Sensory & Comfort Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#15181C] border border-stone-800/6 dark:border-white/6">
              <span className="text-[10px] font-mono uppercase text-[#828B86] block mb-1">
                Acoustic Dynamics
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E6F50] dark:text-[#2CA376]">
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>{spot.noiseLevel}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#15181C] border border-stone-800/6 dark:border-white/6">
              <span className="text-[10px] font-mono uppercase text-[#828B86] block mb-1">
                Seating Ergonomics
              </span>
              <span className="text-xs font-semibold text-[#18201C] dark:text-[#F6F4F0] block truncate">
                {spot.comfortRating}
              </span>
            </div>
          </div>

          {/* Weather Contingency Note if Applicable */}
          {spot.isWeatherContingency && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Automatic Indoor Shadow Hold</strong>
                Rain contingency table Booth 02 is locked downstream. Zero risk of weather cancellation.
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800/8 dark:border-white/8">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#525B56] dark:text-[#A0A8A3] hover:text-[#18201C] dark:hover:text-[#F6F4F0]"
            >
              Back to Map
            </button>
            <button
              onClick={() => {
                onConfirmSpot(spot);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B24E2A] text-white text-xs font-semibold font-mono flex items-center gap-1.5 shadow-md shadow-[#C85A32]/20 transition-all active:scale-95"
            >
              {isCurrentlySelected ? (
                <>
                  <Check className="w-4 h-4" />
                  Currently Selected Spot
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Lock In {spot.code}
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
