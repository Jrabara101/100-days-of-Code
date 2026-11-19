import React, { useState } from 'react';
import { ConfirmedReservation, TimeSlot } from '../types';
import { X, RotateCcw, ArrowRight, Check, Users, Sparkles } from 'lucide-react';

interface NoPenaltySwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ConfirmedReservation | null;
  onConfirmSwap: (newTime: string) => void;
  onReleaseToWaitlistSuccess: () => void;
}

export const NoPenaltySwapModal: React.FC<NoPenaltySwapModalProps> = ({
  isOpen,
  onClose,
  reservation,
  onConfirmSwap,
  onReleaseToWaitlistSuccess,
}) => {
  const [selectedTargetTime, setSelectedTargetTime] = useState<string>('08:15 PM');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [swapDone, setSwapDone] = useState<boolean>(false);

  if (!isOpen || !reservation) return null;

  const handleExecuteSwap = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onConfirmSwap(selectedTargetTime);
      setSwapDone(true);
      setTimeout(() => {
        onClose();
        setSwapDone(false);
        setIsProcessing(false);
      }, 1000);
    }, 600);
  };

  const handleReleaseToWaitlist = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onReleaseToWaitlistSuccess();
      onClose();
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1B1F24] rounded-2xl border border-stone-800/10 dark:border-white/10 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#FAF7F2] dark:bg-[#15181C] border-b border-stone-800/8 dark:border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6D4C7D]" />
            <h3 className="font-serif text-lg font-medium text-[#18201C] dark:text-[#F6F4F0]">
              The "No-Penalty Swap" Marketplace
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-[#828B86] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4">
          
          <div className="p-3.5 rounded-xl bg-purple-500/10 dark:bg-purple-900/20 border border-purple-500/20 text-xs">
            <p className="font-semibold text-[#6D4C7D] dark:text-[#A78BFA] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Atomic Two-Party Reservation Transfer
            </p>
            <p className="text-[#525B56] dark:text-[#A0A8A3] leading-relaxed">
              Plans changed? Swap into an open late-evening slot without fees, or release your table directly to an auto-claim waitlister to waive late fees instantly.
            </p>
          </div>

          {/* Current Booking */}
          <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#15181C] border border-stone-800/6 dark:border-white/6 text-xs flex items-center justify-between">
            <span className="text-[#828B86] font-mono uppercase">Current Slot:</span>
            <span className="font-mono font-bold text-[#18201C] dark:text-[#F6F4F0]">
              {reservation.timeStr} • {reservation.spot.code}
            </span>
          </div>

          {/* Available Swap Target Slots */}
          <div>
            <label className="text-xs font-mono uppercase text-[#828B86] block mb-2">
              Select Alternate Seamless Slot
            </label>
            <div className="space-y-2">
              {[
                { time: '08:15 PM', note: 'Window Booth B02 • High Demand' },
                { time: '08:45 PM', note: 'Heated Courtyard P01 • Olive Pergola' },
                { time: '09:15 PM', note: "Chef's Hearth Counter C02" },
              ].map((target) => {
                const isSelected = selectedTargetTime === target.time;
                return (
                  <div
                    key={target.time}
                    onClick={() => setSelectedTargetTime(target.time)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'bg-[#C85A32]/10 border-[#C85A32] text-[#C85A32] font-semibold'
                        : 'bg-[#FAF7F2] dark:bg-[#15181C] border-stone-800/6 dark:border-white/6 text-[#525B56] dark:text-[#A0A8A3] hover:border-stone-400'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-sm block">{target.time}</span>
                      <span className="text-[11px] opacity-75">{target.note}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#C85A32] bg-[#C85A32] text-white' : 'border-stone-400'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleExecuteSwap}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-[#C85A32] hover:bg-[#B24E2A] text-white text-xs font-mono font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-[#C85A32]/20 transition-all active:scale-95 disabled:opacity-80"
            >
              {swapDone ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Swapped to {selectedTargetTime}!</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirm Swap to {selectedTargetTime} ($0 Fee)</span>
                </>
              )}
            </button>

            <button
              onClick={handleReleaseToWaitlist}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-[#6D4C7D] dark:text-[#A78BFA] text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Release to Waitlist #2 &amp; Waive All Fees</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
