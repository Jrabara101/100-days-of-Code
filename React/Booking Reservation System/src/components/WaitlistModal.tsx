import React, { useState } from 'react';
import { TimeSlot } from '../types';
import { X, Sparkles, Check, Bell, ShieldCheck, Zap } from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimeSlot | null;
  onJoinWaitlist: (slotTime: string, autoClaim: boolean, windowStr: string) => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  onClose,
  slot,
  onJoinWaitlist,
}) => {
  const [autoClaim, setAutoClaim] = useState<boolean>(true);
  const [toleranceWindow, setToleranceWindow] = useState<string>('± 45 Mins (6:15 PM – 7:45 PM)');
  const [joined, setJoined] = useState<boolean>(false);

  if (!isOpen || !slot) return null;

  const handleConfirm = () => {
    setJoined(true);
    setTimeout(() => {
      onJoinWaitlist(slot.timeStr, autoClaim, toleranceWindow);
      onClose();
      setJoined(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1B1F24] rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Waitlist Plum Accent */}
        <div className="p-5 bg-purple-500/10 dark:bg-purple-900/20 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6D4C7D] animate-ping" />
            <h3 className="font-serif text-lg font-medium text-[#18201C] dark:text-[#F6F4F0]">
              Predictive "Spot-Swap" Waitlist Radar
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
          
          {/* Historical Probability Badge */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#15181C] border border-purple-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono uppercase text-[#6D4C7D] font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Historical Turnover Rate
              </span>
              <span className="text-sm font-mono font-bold text-[#1E6F50] dark:text-[#2CA376]">
                84% Probability
              </span>
            </div>

            <p className="text-xs text-[#525B56] dark:text-[#A0A8A3] leading-relaxed">
              Based on historical Thursday cancellation and early turn data, there is an <strong>84% chance</strong> a {slot.timeStr} table opens. You will be <span className="font-mono font-bold text-[#C85A32]">#2 in line</span>.
            </p>
          </div>

          {/* Time Window Tolerance Selector */}
          <div>
            <label className="text-xs font-mono uppercase text-[#828B86] block mb-1.5">
              Arrival Window Tolerance
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                'Exact Time Only',
                '± 15 Mins (6:45 – 7:15 PM)',
                '± 30 Mins (6:30 – 7:30 PM)',
                '± 45 Mins (6:15 – 7:45 PM)',
              ].map((win) => {
                const isSelected = toleranceWindow === win;
                return (
                  <button
                    key={win}
                    onClick={() => setToleranceWindow(win)}
                    className={`p-2 rounded-xl text-left font-medium transition-all ${
                      isSelected
                        ? 'bg-[#6D4C7D] text-white shadow-sm font-semibold'
                        : 'bg-[#FAF7F2] dark:bg-[#15181C] text-[#525B56] dark:text-[#A0A8A3] border border-stone-800/6 dark:border-white/6 hover:border-purple-500/40'
                    }`}
                  >
                    {win}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-Claim Toggle */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#15181C] border border-stone-800/6 dark:border-white/6 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#18201C] dark:text-[#F6F4F0]">
                <Zap className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Instant Auto-Claim Table</span>
              </div>
              <p className="text-[11px] text-[#828B86] mt-0.5">
                Automatically books and texts pass the second a table is released.
              </p>
            </div>

            <button
              onClick={() => setAutoClaim(!autoClaim)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                autoClaim ? 'bg-[#1E6F50]' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  autoClaim ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Footer */}
          <div className="pt-2">
            <button
              onClick={handleConfirm}
              disabled={joined}
              className="w-full py-3 px-4 rounded-xl bg-[#6D4C7D] hover:bg-[#5b3e69] text-white text-xs font-mono font-semibold flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 transition-all active:scale-95 disabled:opacity-80"
            >
              {joined ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Radar! Auto-matcher Active.</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Join Waitlist for {slot.timeStr}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
