import React, { useState } from 'react';
import { Sparkles, Calendar, Check, X, ArrowRight, Clock, Shield } from 'lucide-react';
import { sounds } from '../../services/audioEffects';

interface ScheduleRebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectedDate: string;
  onConfirmRebalance: (preferredDays: number[], weeklyMinutes: number) => void;
}

export const ScheduleRebalanceModal: React.FC<ScheduleRebalanceModalProps> = ({
  isOpen,
  onClose,
  currentProjectedDate,
  onConfirmRebalance
}) => {
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [weeklyMinutes, setWeeklyMinutes] = useState<number>(120);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  if (!isOpen) return null;

  const daysOfWeek = [
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
    { id: 0, label: 'Sun' }
  ];

  const toggleDay = (dayId: number) => {
    sounds.playClick();
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== dayId));
      }
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  // Compute realistic recalculated date
  const lessonsRemaining = 9;
  const sessionsPerWeek = selectedDays.length;
  const minutesPerSession = Math.round(weeklyMinutes / sessionsPerWeek);
  const lessonsPerWeek = Math.max(1, Math.round(weeklyMinutes / 35));
  const weeksNeeded = Math.ceil(lessonsRemaining / lessonsPerWeek);

  const forecastDate = new Date();
  forecastDate.setDate(forecastDate.getDate() + weeksNeeded * 7);
  const newForecastStr = forecastDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleApply = () => {
    sounds.playSuccess();
    onConfirmRebalance(selectedDays, weeklyMinutes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#171B26] border border-black/10 dark:border-white/10 shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Zero-Guilt Schedule Rebalancer
              </h3>
              <p className="text-xs text-slate-500">
                Pacing adapts to you—never the other way around
              </p>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Philosophy Note */}
        <div className="my-4 p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40 text-xs flex items-start gap-3">
          <Shield className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-slate-700 dark:text-slate-300">
            Had a busy week? Don't sweat it. No overdue red alerts, no guilt trips, and your <strong>18-Day Streak</strong> stays completely protected.
          </p>
        </div>

        {/* Commitment Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
              1. Choose Preferred Study Days:
            </label>
            <div className="flex gap-1.5">
              {daysOfWeek.map(day => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs scale-102'
                        : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              <span>2. Weekly Commitment:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {weeklyMinutes} mins / week (~{minutesPerSession}m / day)
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="300"
              step="30"
              value={weeklyMinutes}
              onChange={e => {
                sounds.playClick();
                setWeeklyMinutes(Number(e.target.value));
              }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>1 hr/wk</span>
              <span>2.5 hrs/wk (Recommended)</span>
              <span>5 hrs/wk</span>
            </div>
          </div>

          {/* New Forecast Projection Display */}
          <div className="p-4 rounded-2xl bg-surface-secondary dark:bg-[#11141C] border border-black/10 dark:border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Adjusted Target Graduation
              </span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                <Calendar className="w-4 h-4 text-emerald-500" />
                {newForecastStr}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                On pace with {selectedDays.length} sessions weekly
              </span>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                ✓ Smooth Rebalance
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
          >
            <span>Confirm & Update Schedule</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

