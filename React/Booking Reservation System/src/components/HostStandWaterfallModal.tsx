import React from 'react';
import { Archetype, HostStandTableStatus, TimeSlot } from '../types';
import { X, Flame, Users, Clock, AlertTriangle, Sparkles, ChefHat, CheckCircle2, TrendingUp } from 'lucide-react';

interface HostStandWaterfallModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetype: Archetype;
  timeSlots: TimeSlot[];
  tableStatuses: HostStandTableStatus[];
}

export const HostStandWaterfallModal: React.FC<HostStandWaterfallModalProps> = ({
  isOpen,
  onClose,
  archetype,
  timeSlots,
  tableStatuses,
}) => {
  if (!isOpen) return null;

  // Filter 6 key evening arrival buckets to demonstrate pacing waterfall
  const eveningBuckets = timeSlots.filter(s => s.minutesFromMidnight >= 18 * 60 && s.minutesFromMidnight <= 20 * 60 + 30).slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-4xl bg-white dark:bg-[#1B1F24] rounded-2xl border border-stone-800/10 dark:border-white/10 shadow-2xl overflow-hidden my-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#18201C] text-[#FAF7F2] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C85A32] flex items-center justify-center text-white">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold">
                  Host Stand &amp; Pacing Waterfall Lens
                </h3>
                <span className="text-[10px] font-mono uppercase bg-[#1E6F50] text-white px-2 py-0.5 rounded font-bold">
                  Live Operator View
                </span>
              </div>
              <p className="text-xs text-white/70 font-sans">
                Real-time kitchen throttle, 15-min arrival buckets &amp; table turn pacing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Section 1: 15-Minute Kitchen Arrival Throttle Waterfall */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-[#828B86] font-semibold">
                <TrendingUp className="w-4 h-4 text-[#C85A32]" />
                <span>15-Minute Kitchen Arrival Throttle (Max 16 Guests / Bucket)</span>
              </div>
              <span className="text-[11px] font-mono text-[#1E6F50] dark:text-[#2CA376]">
                Kitchen Load: Optimal Pacing
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {eveningBuckets.map((bucket) => {
                const percent = Math.min(100, Math.round((bucket.arrivalLoad / bucket.maxPacingArrivals) * 100));
                const isCapped = bucket.arrivalLoad >= bucket.maxPacingArrivals;

                return (
                  <div
                    key={bucket.id}
                    className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#15181C] border border-stone-800/6 dark:border-white/6 flex flex-col justify-between"
                  >
                    <span className="font-mono text-xs font-bold text-[#18201C] dark:text-[#F6F4F0]">
                      {bucket.timeStr.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-mono text-[#828B86]">
                      {bucket.arrivalLoad}/{bucket.maxPacingArrivals} guests
                    </span>

                    {/* Mini Progress Bar */}
                    <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mt-1.5">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCapped
                            ? 'bg-[#6D4C7D]'
                            : percent > 75
                            ? 'bg-[#C85A32]'
                            : 'bg-[#1E6F50]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Live Table Turn-Time Progress Bars */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-[#828B86] font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#D9822B]" />
                Live Table Turn-Time &amp; Course Progression
              </span>
              <span className="text-[11px] text-[#828B86] font-mono">
                Buffer cushion protected
              </span>
            </div>

            <div className="space-y-2.5">
              {tableStatuses.map((table) => {
                return (
                  <div
                    key={table.tableId}
                    className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#15181C] border border-stone-800/6 dark:border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white dark:bg-[#1B1F24] border border-stone-800/10 dark:border-white/10 text-[#C85A32]">
                        {table.tableCode}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#18201C] dark:text-[#F6F4F0]">
                            {table.currentPartyName || 'Vacant Table'}
                          </span>
                          {table.isVip && (
                            <span className="text-[9px] font-mono uppercase bg-[#C85A32]/10 text-[#C85A32] px-1.5 py-0.2 rounded font-bold">
                              VIP Streak
                            </span>
                          )}
                        </div>
                        {table.alerts && table.alerts.length > 0 && (
                          <span className="text-[11px] text-[#828B86]">
                            {table.alerts.join(' • ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full sm:w-48 shrink-0">
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-[#828B86]">
                        <span>{table.elapsedMinutes}m / {table.expectedTurnTimeMinutes}m turn</span>
                        <span>{table.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1E6F50] rounded-full transition-all"
                          style={{ width: `${table.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Pre-Shift VIP Guest Briefing & Tetris Gap Unlock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            
            {/* VIP Guest Dossier */}
            <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#D9822B]" />
                <span className="text-xs font-mono uppercase font-bold text-[#D9822B]">
                  Pre-Shift VIP Concierge Briefing
                </span>
              </div>
              <h4 className="font-serif text-base font-semibold text-[#18201C] dark:text-[#F6F4F0]">
                {archetype.sampleVipGuest.name}
              </h4>
              <p className="text-xs text-[#525B56] dark:text-[#A0A8A3] mt-1 leading-relaxed">
                {archetype.sampleVipGuest.notes}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {archetype.sampleVipGuest.preferences.map((pref, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-white/70 dark:bg-stone-800 text-[10px] font-mono text-[#18201C] dark:text-[#F6F4F0] font-medium"
                  >
                    ★ {pref}
                  </span>
                ))}
              </div>
            </div>

            {/* Tetris Gap-Fitting Engine Unlock Summary */}
            <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#1E6F50]" />
                <span className="text-xs font-mono uppercase font-bold text-[#1E6F50] dark:text-[#2CA376]">
                  Tetris Gap-Fitting Revenue Engine
                </span>
              </div>
              <p className="text-xs text-[#525B56] dark:text-[#A0A8A3] leading-relaxed">
                By allowing <strong>45-Min Express Visits</strong>, the system identified <strong>3 interstitial gap windows</strong> that normally remain dormant between 90-minute prime seatings.
              </p>
              <div className="mt-3 p-2 rounded-lg bg-white/80 dark:bg-[#1B1F24] text-xs font-mono text-[#1E6F50] dark:text-[#2CA376] flex items-center justify-between">
                <span>Recovered Idle Table Time:</span>
                <span className="font-bold">+135 Mins (+3 Covers)</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
