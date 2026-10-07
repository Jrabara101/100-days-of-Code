import React, { useState } from 'react';
import { HostProfile } from '../../types';

interface TimezoneComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  host: HostProfile;
  selectedTimezone: string;
  onSelectTimezone: (tz: string) => void;
}

const COMMON_TIMEZONES = [
  { id: 'America/New_York', label: 'Eastern Time (EDT, GMT-4)', offset: -4 },
  { id: 'America/Chicago', label: 'Central Time (CDT, GMT-5)', offset: -5 },
  { id: 'America/Denver', label: 'Mountain Time (MDT, GMT-6)', offset: -6 },
  { id: 'America/Los_Angeles', label: 'Pacific Time (PDT, GMT-7)', offset: -7 },
  { id: 'Europe/London', label: 'London (BST, GMT+1)', offset: 1 },
  { id: 'Europe/Paris', label: 'Central European (CEST, GMT+2)', offset: 2 },
  { id: 'Asia/Dubai', label: 'Gulf Standard (GST, GMT+4)', offset: 4 },
  { id: 'Asia/Kolkata', label: 'India Standard (IST, GMT+5:30)', offset: 5.5 },
  { id: 'Asia/Singapore', label: 'Singapore (SGT, GMT+8)', offset: 8 },
  { id: 'Asia/Tokyo', label: 'Japan (JST, GMT+9)', offset: 9 },
  { id: 'Australia/Sydney', label: 'Australian Eastern (AEST, GMT+10)', offset: 10 },
];

export const TimezoneComparisonModal: React.FC<TimezoneComparisonModalProps> = ({
  isOpen,
  onClose,
  host,
  selectedTimezone,
  onSelectTimezone,
}) => {
  const [sliderHour, setSliderHour] = useState(14); // 2:00 PM EDT (Host hour)
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Host is EDT (offset -4)
  const hostOffset = -4;
  const currentGuestTz = COMMON_TIMEZONES.find(t => t.id === selectedTimezone) || {
    id: selectedTimezone,
    label: selectedTimezone,
    offset: -4,
  };

  const guestHour = (sliderHour + (currentGuestTz.offset - hostOffset) + 24) % 24;

  const formatHour = (hourFloat: number) => {
    const hour = Math.floor(hourFloat);
    const minute = Math.round((hourFloat - hour) * 60);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute < 10 ? '0' + minute : minute;
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const isHostWorkHours = sliderHour >= 9 && sliderHour <= 17;
  const isGuestWorkHours = guestHour >= 9 && guestHour <= 17;
  const isOverlap = isHostWorkHours && isGuestWorkHours;

  const filteredTimezones = COMMON_TIMEZONES.filter(tz =>
    tz.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tz.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs transition-opacity" />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-border-divider/70 p-5 z-50 animate-slide-up flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-divider/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-surface-variant text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">public</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Timezone Comparison</h3>
              <p className="text-xs text-text-secondary">Side-by-side working hours alignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-neutral text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Real-time Side-by-Side Comparison Slider Box */}
        <div className="bg-surface-neutral/80 rounded-xl p-4 border border-border-divider/60 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-text-secondary">Drag time slider to check overlap:</span>
            {isOverlap ? (
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-status-available animate-pulse"></span>
                Optimal Overlap
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-text-secondary text-[11px]">
                Outside Mutual Hours
              </span>
            )}
          </div>

          {/* Dual Clocks Display */}
          <div className="grid grid-cols-2 gap-3 text-center">
            {/* Host Side */}
            <div className={`p-3 rounded-xl border transition-all ${isHostWorkHours ? 'bg-surface-container-lowest border-primary/30 shadow-xs' : 'bg-surface-dim/30 border-transparent opacity-70'}`}>
              <span className="text-[11px] text-text-secondary font-medium block">Host: Alex Rivera (EDT)</span>
              <span className="text-lg font-bold text-primary block mt-0.5">
                {formatHour(sliderHour)}
              </span>
              <span className={`text-[10px] font-semibold ${isHostWorkHours ? 'text-status-available' : 'text-text-secondary'}`}>
                {isHostWorkHours ? '● Host Working (9am-5pm)' : '○ Host Off-hours'}
              </span>
            </div>

            {/* Guest Side */}
            <div className={`p-3 rounded-xl border transition-all ${isGuestWorkHours ? 'bg-surface-container-lowest border-secondary/30 shadow-xs' : 'bg-surface-dim/30 border-transparent opacity-70'}`}>
              <span className="text-[11px] text-text-secondary font-medium block">Your Local Time</span>
              <span className="text-lg font-bold text-secondary block mt-0.5">
                {formatHour(guestHour)}
              </span>
              <span className={`text-[10px] font-semibold ${isGuestWorkHours ? 'text-status-available' : 'text-text-secondary'}`}>
                {isGuestWorkHours ? '● Your Working (9am-5pm)' : '○ Your Off-hours'}
              </span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="pt-2">
            <input
              type="range"
              min="0"
              max="23.5"
              step="0.5"
              value={sliderHour}
              onChange={(e) => setSliderHour(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-secondary mt-1">
              <span>12:00 AM</span>
              <span>08:00 AM</span>
              <span className="font-semibold text-primary">12:00 PM</span>
              <span>05:00 PM</span>
              <span>11:59 PM</span>
            </div>
          </div>
        </div>

        {/* Change Timezone Dropdown / Search */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-primary block">
            Select or Switch Your Timezone:
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search city, region or timezone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface border border-border-divider focus:border-primary text-xs outline-none"
            />
            <span className="material-symbols-outlined text-[16px] text-text-secondary absolute left-2.5 top-2.5">
              search
            </span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {filteredTimezones.map((tz) => (
              <button
                key={tz.id}
                onClick={() => {
                  onSelectTimezone(tz.id);
                  onClose();
                }}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-all ${
                  selectedTimezone === tz.id
                    ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                    : 'bg-surface hover:bg-surface-neutral text-text-primary'
                }`}
              >
                <span>{tz.label}</span>
                {selectedTimezone === tz.id && (
                  <span className="material-symbols-filled text-[14px]">check</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-border-divider/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-container text-on-primary font-semibold text-xs rounded-xl shadow-xs hover:bg-primary-hover active:scale-95 transition-all"
          >
            Apply Timezone
          </button>
        </div>
      </div>
    </div>
  );
};
