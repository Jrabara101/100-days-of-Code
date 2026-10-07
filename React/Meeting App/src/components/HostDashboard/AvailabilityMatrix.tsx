import React, { useState } from 'react';

interface Shift {
  id: string;
  start: string;
  end: string;
}

interface DaySchedule {
  day: string;
  enabled: boolean;
  shifts: Shift[];
}

export const AvailabilityMatrix: React.FC = () => {
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([
    {
      day: 'Monday',
      enabled: true,
      shifts: [
        { id: '1', start: '09:00', end: '12:00' },
        { id: '2', start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 'Tuesday',
      enabled: true,
      shifts: [
        { id: '3', start: '09:00', end: '12:00' },
        { id: '4', start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 'Wednesday',
      enabled: true,
      shifts: [
        { id: '5', start: '09:00', end: '12:00' },
        { id: '6', start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 'Thursday',
      enabled: true,
      shifts: [
        { id: '7', start: '09:00', end: '12:00' },
        { id: '8', start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 'Friday',
      enabled: true,
      shifts: [{ id: '9', start: '09:30', end: '15:00' }],
    },
    {
      day: 'Saturday',
      enabled: false,
      shifts: [{ id: '10', start: '10:00', end: '13:00' }],
    },
    {
      day: 'Sunday',
      enabled: false,
      shifts: [{ id: '11', start: '10:00', end: '13:00' }],
    },
  ]);

  // Host Burnout & Boundary Protections state
  const [bufferBefore, setBufferBefore] = useState(15);
  const [bufferAfter, setBufferAfter] = useState(15);
  const [dailyCap, setDailyCap] = useState(4);
  const [weeklyCapHours, setWeeklyCapHours] = useState(16);
  const [minLeadHours, setMinLeadHours] = useState(4);
  const [maxHorizonDays, setMaxHorizonDays] = useState(30);
  const [savedBanner, setSavedBanner] = useState(false);

  const toggleDay = (index: number) => {
    const updated = [...weeklySchedule];
    updated[index].enabled = !updated[index].enabled;
    setWeeklySchedule(updated);
  };

  const addSplitShift = (index: number) => {
    const updated = [...weeklySchedule];
    updated[index].shifts.push({
      id: Math.random().toString(),
      start: '14:00',
      end: '18:00',
    });
    setWeeklySchedule(updated);
  };

  const removeShift = (dayIndex: number, shiftIndex: number) => {
    const updated = [...weeklySchedule];
    updated[dayIndex].shifts.splice(shiftIndex, 1);
    setWeeklySchedule(updated);
  };

  const handleSave = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-border-divider/70 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Availability & Boundary Protections</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Safeguard your cognitive energy with automatic cooldown buffers and weekly caps.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="self-start sm:self-auto px-4 py-2 bg-primary-container hover:bg-primary-hover active:scale-95 text-on-primary font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          <span>Save Changes</span>
        </button>
      </div>

      {savedBanner && (
        <div className="p-3 bg-secondary-container text-on-secondary-container rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <span className="material-symbols-filled text-[18px]">verified</span>
          <span>Availability matrix & burnout protections updated successfully.</span>
        </div>
      )}

      {/* Burnout & Protective Limits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1. Intelligent Buffer Rules */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-border-divider/70 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
            <h3 className="text-sm font-bold text-text-primary">Intelligent Buffer Rules</h3>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Automatic cooldown padding before & after calls prevents back-to-back cognitive fatigue.
          </p>
          <div className="space-y-2.5 pt-1">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-text-secondary">Buffer Before Event</span>
                <span className="text-primary font-bold">{bufferBefore} mins</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={bufferBefore}
                onChange={(e) => setBufferBefore(parseInt(e.target.value, 10))}
                className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-text-secondary">Buffer After Event</span>
                <span className="text-primary font-bold">{bufferAfter} mins</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={bufferAfter}
                onChange={(e) => setBufferAfter(parseInt(e.target.value, 10))}
                className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 2. Daily & Weekly Caps */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-border-divider/70 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">shield</span>
            <h3 className="text-sm font-bold text-text-primary">Daily & Weekly Caps</h3>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Hard stop barriers. When reached, CalSync blocks subsequent bookings automatically.
          </p>
          <div className="space-y-2.5 pt-1">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-text-secondary">Max Calls per Day</span>
                <span className="text-secondary font-bold">{dailyCap} calls max</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={dailyCap}
                onChange={(e) => setDailyCap(parseInt(e.target.value, 10))}
                className="w-full accent-secondary h-1.5 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-text-secondary">Max Meeting Hours / Week</span>
                <span className="text-secondary font-bold">{weeklyCapHours} hrs max</span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="1"
                value={weeklyCapHours}
                onChange={(e) => setWeeklyCapHours(parseInt(e.target.value, 10))}
                className="w-full accent-secondary h-1.5 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Notice Windows */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-border-divider/70 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">notifications_paused</span>
            <h3 className="text-sm font-bold text-text-primary">Notice Windows</h3>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Eliminates surprise bookings and locks scheduling boundaries to your preference.
          </p>
          <div className="space-y-2.5 pt-1">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-text-secondary">Min Notice Lead Time</span>
                <span className="text-tertiary font-bold">{minLeadHours} hours notice</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={minLeadHours}
                onChange={(e) => setMinLeadHours(parseInt(e.target.value, 10))}
                className="w-full accent-tertiary h-1.5 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-text-secondary">Future Horizon Limit</span>
                <span className="text-tertiary font-bold">{maxHorizonDays} days out</span>
              </div>
              <input
                type="range"
                min="7"
                max="60"
                step="1"
                value={maxHorizonDays}
                onChange={(e) => setMaxHorizonDays(parseInt(e.target.value, 10))}
                className="w-full accent-tertiary h-1.5 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Builder Matrix (with Split Shifts) */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-border-divider/70 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">Weekly Recurring Schedule</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure day-by-day availability with split shifts (e.g. morning and afternoon blocks).
          </p>
        </div>

        <div className="space-y-2.5">
          {weeklySchedule.map((dayPlan, dayIndex) => (
            <div
              key={dayPlan.day}
              className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                dayPlan.enabled
                  ? 'bg-surface border-border-divider/70'
                  : 'bg-surface-neutral/40 border-border-divider/30 opacity-60'
              }`}
            >
              {/* Day Checkbox & Title */}
              <div className="flex items-center gap-3 sm:w-36">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayPlan.enabled}
                    onChange={() => toggleDay(dayIndex)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
                <span className="text-xs sm:text-sm font-bold text-text-primary">{dayPlan.day}</span>
              </div>

              {/* Shift Blocks */}
              <div className="flex-1 flex flex-wrap items-center gap-2">
                {dayPlan.enabled ? (
                  <>
                    {dayPlan.shifts.map((shift, shiftIndex) => (
                      <div
                        key={shift.id}
                        className="flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1 rounded-xl border border-border-divider/70 text-xs shadow-xs"
                      >
                        <input
                          type="time"
                          value={shift.start}
                          onChange={(e) => {
                            const updated = [...weeklySchedule];
                            updated[dayIndex].shifts[shiftIndex].start = e.target.value;
                            setWeeklySchedule(updated);
                          }}
                          className="bg-transparent text-text-primary font-semibold text-xs outline-none"
                        />
                        <span className="text-text-secondary">–</span>
                        <input
                          type="time"
                          value={shift.end}
                          onChange={(e) => {
                            const updated = [...weeklySchedule];
                            updated[dayIndex].shifts[shiftIndex].end = e.target.value;
                            setWeeklySchedule(updated);
                          }}
                          className="bg-transparent text-text-primary font-semibold text-xs outline-none"
                        />
                        {dayPlan.shifts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeShift(dayIndex, shiftIndex)}
                            className="text-text-secondary hover:text-error ml-1"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSplitShift(dayIndex)}
                      className="px-2 py-1 rounded-xl bg-surface-neutral hover:bg-surface-variant text-primary text-[11px] font-semibold flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      <span>Split Shift</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-status-unavailable font-medium italic">
                    Unavailable (Full Day Blocked)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
