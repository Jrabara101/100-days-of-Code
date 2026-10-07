import React, { useState } from 'react';
import { HostProfile, EventType, TimeSlot } from '../../types';

interface SlotPickerProps {
  host: HostProfile;
  eventType: EventType;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string, formattedDate: string) => void;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  onProceedToForm: (slot: TimeSlot) => void;
  onOpenTimezoneModal: () => void;
  guestTimezone: string;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  host,
  eventType,
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
  onProceedToForm,
  onOpenTimezoneModal,
  guestTimezone,
}) => {
  const [isHostCollapsed, setIsHostCollapsed] = useState(false);
  const [currentMonth, setCurrentMonth] = useState({ year: 2024, month: 9, name: 'October 2024' }); // 0-indexed month 9 = October

  // Day data for October 2024
  // Monday start: Oct 1 is Tuesday, so Oct 1 index in row is 1 (0 is Sep 30)
  const daysInOctober = 31;
  const activeDays = [22, 23, 24, 25, 28, 29, 31];
  const selectedDayNum = parseInt(selectedDate.split('-')[2] || '24', 10);

  // Dynamic slots based on day
  const slotsForDay: TimeSlot[] = [
    { id: 's1', time: '09:30 AM', period: 'Morning', isAvailable: true },
    { id: 's2', time: '11:00 AM', period: 'Morning', isAvailable: true },
    { id: 's3', time: '01:30 PM', period: 'Afternoon', isAvailable: true },
    { id: 's4', time: '03:00 PM', period: 'Afternoon', isAvailable: true },
    { id: 's5', time: '04:30 PM', period: 'Afternoon', isAvailable: true },
  ];

  const handleDayClick = (day: number) => {
    const formatted = `2024-10-${day < 10 ? '0' + day : day}`;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dateObj = new Date(2024, 9, day);
    const dayName = dayNames[dateObj.getDay()];
    onSelectDate(formatted, `${dayName}, October ${day}, 2024`);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-20">
      {/* 1. Host Header Summary Card */}
      <section className="w-full bg-surface-container-lowest rounded-2xl shadow-xs border border-border-divider/70 p-4 sm:p-5 flex flex-col gap-3 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 shrink-0">
              <img
                alt={host.name}
                className="w-12 h-12 rounded-full object-cover shadow-xs border border-surface-container"
                src={host.avatarUrl}
              />
              {host.verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-filled text-[10px] leading-none">check</span>
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[16px] font-semibold text-text-primary truncate">{host.name}</span>
                <span className="material-symbols-filled text-primary-container text-[16px] shrink-0">verified</span>
              </div>
              <span className="text-xs text-text-secondary truncate">{host.role}</span>
            </div>
          </div>
          <button
            aria-label="Toggle Host Details"
            onClick={() => setIsHostCollapsed(!isHostCollapsed)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-neutral text-text-secondary hover:text-text-primary active:scale-95 transition-all"
          >
            <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isHostCollapsed ? 'rotate-180' : ''}`}>
              expand_less
            </span>
          </button>
        </div>

        {!isHostCollapsed && (
          <div className="flex flex-col gap-2 pt-1 border-t border-border-divider/50 transition-all">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">{eventType.title}</h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {eventType.description}
            </p>
            {/* Metadata Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-neutral text-text-primary text-xs font-medium border border-border-divider/50">
                <span className="material-symbols-outlined text-[15px] text-text-secondary">schedule</span>
                <span>{eventType.durationMinutes} mins</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-neutral text-text-primary text-xs font-medium border border-border-divider/50">
                <span className="material-symbols-outlined text-[15px] text-text-secondary">videocam</span>
                <span>
                  {eventType.locationType === 'google-meet'
                    ? 'Google Meet'
                    : eventType.locationType === 'zoom'
                    ? 'Zoom'
                    : eventType.locationType === 'phone'
                    ? 'Phone Call'
                    : 'In-person'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-neutral text-text-primary text-xs font-medium border border-border-divider/50">
                <span className="material-symbols-outlined text-[15px] text-status-available">public</span>
                <span>{host.timezoneLabel}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Quick Info Banner */}
      <div className="w-full bg-surface-variant/40 border border-surface-variant/60 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-xs">
        <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-xs">
          <span className="material-symbols-outlined text-[16px]">touch_app</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-text-primary truncate">Select a booking date</span>
          <span className="text-[11px] text-text-secondary truncate">Real-time open slots update instantly below</span>
        </div>
      </div>

      {/* 2. Full-width Interactive Touch Calendar */}
      <section className="w-full bg-surface-container-lowest rounded-2xl shadow-xs border border-border-divider/70 p-4 sm:p-5 flex flex-col gap-3">
        {/* Month/Year Nav */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-text-primary">{currentMonth.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-neutral font-semibold text-[11px] text-text-secondary border border-border-divider/50">
              {host.activeQuarter}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              aria-label="Previous Month"
              onClick={() => setCurrentMonth({ year: 2024, month: 8, name: 'September 2024' })}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-neutral text-text-secondary hover:text-text-primary active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              aria-label="Next Month"
              onClick={() => setCurrentMonth({ year: 2024, month: 10, name: 'November 2024' })}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-neutral text-text-secondary hover:text-text-primary active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] text-text-secondary uppercase tracking-wider py-1 border-b border-border-divider/40">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* 7-Column Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 select-none" id="calendarGrid">
          {/* Prior month offset: 30 Sep */}
          <div className="min-w-[40px] h-11 flex flex-col items-center justify-center rounded-xl text-status-unavailable opacity-30 text-xs font-medium">
            30
          </div>

          {/* Days 1 to 31 */}
          {Array.from({ length: daysInOctober }, (_, i) => i + 1).map((day) => {
            const isWeekend = (day % 7 === 5 || day % 7 === 6); // Sat & Sun approximate for Oct 2024
            const isPast = day < 22;
            const isAvailable = activeDays.includes(day);
            const isSelected = day === selectedDayNum;

            if (isPast || (isWeekend && !isAvailable)) {
              return (
                <div
                  key={day}
                  className="min-w-[40px] h-11 flex flex-col items-center justify-center rounded-xl text-status-unavailable opacity-45 cursor-not-allowed text-xs font-medium"
                >
                  <span>{day}</span>
                </div>
              );
            }

            if (isSelected) {
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className="min-w-[40px] h-11 flex flex-col items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-md active:scale-95 transition-all font-bold text-xs"
                >
                  <span>{day}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-on-primary mt-0.5"></span>
                </button>
              );
            }

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className="min-w-[40px] h-11 flex flex-col items-center justify-center rounded-xl bg-surface hover:bg-surface-neutral active:scale-95 transition-all text-text-primary text-xs font-semibold border border-transparent hover:border-border-divider"
              >
                <span>{day}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-status-available mt-0.5"></span>
              </button>
            );
          })}

          {/* Next month offset */}
          <div className="min-w-[40px] h-11 flex flex-col items-center justify-center rounded-xl text-status-unavailable opacity-30 text-xs font-medium">1</div>
          <div className="min-w-[40px] h-11 flex flex-col items-center justify-center rounded-xl text-status-unavailable opacity-30 text-xs font-medium">2</div>
          <div className="min-w-[40px] h-11 flex flex-col items-center justify-center rounded-xl text-status-unavailable opacity-30 text-xs font-medium">3</div>
        </div>

        {/* Calendar Availability Key */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-border-divider/40 text-text-secondary text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-available"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-unavailable"></span>
            <span>Unavailable</span>
          </div>
        </div>
      </section>

      {/* 3. Available Slots Preview Panel */}
      <section className="w-full bg-surface-container-lowest rounded-2xl shadow-xs border border-border-divider/70 p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-text-primary">
              October {selectedDayNum}, 2024
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container text-[11px] font-semibold">
              5 slots open
            </span>
          </div>
          <span className="text-xs text-text-secondary font-medium">
            {eventType.durationMinutes}m slots
          </span>
        </div>

        {/* Time Slot Pill Buttons */}
        <div className="grid grid-cols-1 gap-2.5">
          {slotsForDay.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;

            if (isSelected) {
              return (
                <div key={slot.id} className="w-full flex items-center gap-2 animate-fade-in">
                  <button
                    onClick={() => onSelectSlot(slot)}
                    className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-surface-variant text-primary font-bold flex items-center justify-between shadow-xs border border-primary/20"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-filled text-[18px] text-primary">check_circle</span>
                      <span className="text-sm font-semibold">{slot.time}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-lowest text-primary font-semibold">
                      Selected
                    </span>
                  </button>
                  <button
                    onClick={() => onProceedToForm(slot)}
                    className="min-w-[110px] min-h-[46px] px-4 rounded-xl bg-primary-container hover:bg-primary-hover active:scale-95 text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Next</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              );
            }

            return (
              <div key={slot.id} className="w-full flex items-center gap-2">
                <button
                  onClick={() => onSelectSlot(slot)}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-surface-neutral hover:bg-surface-variant/40 active:scale-[0.99] text-text-primary flex items-center justify-between transition-all border border-border-divider/50 group"
                >
                  <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {slot.time}
                  </span>
                  <div className="flex items-center gap-1.5 text-text-secondary group-hover:text-primary transition-colors">
                    <span className="text-xs font-medium">EDT</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Timezone Switcher & Comparison Container */}
      <section className="w-full bg-surface-container-lowest rounded-2xl shadow-xs border border-border-divider/70 p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-primary">Your Timezone</span>
          <span className="text-[11px] text-status-available font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-status-available animate-pulse"></span>
            Auto-detected
          </span>
        </div>
        <button
          onClick={onOpenTimezoneModal}
          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-surface-neutral hover:bg-surface-variant/50 text-text-primary flex items-center justify-between transition-colors border border-border-divider/60 active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-[18px] text-text-secondary shrink-0">globe</span>
            <span className="text-xs sm:text-sm font-medium truncate">{guestTimezone}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-text-secondary">
            <span className="text-xs font-semibold text-primary">Compare</span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
        </button>
        {/* Trust Assurance Footer */}
        <div className="flex items-center justify-center gap-1.5 pt-1 text-text-secondary text-[11px]">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span>Encrypted & powered by CalSync Instant Booking</span>
        </div>
      </section>
    </div>
  );
};
