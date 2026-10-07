import React, { useState } from 'react';
import { Booking } from '../../types';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onConfirmReschedule: (newDateStr: string, newFormattedDate: string, newTimeStr: string) => void;
}

const ALTERNATIVE_DATES = [
  { dateStr: '2024-10-25', formattedDate: 'Friday, October 25, 2024' },
  { dateStr: '2024-10-28', formattedDate: 'Monday, October 28, 2024' },
  { dateStr: '2024-10-29', formattedDate: 'Tuesday, October 29, 2024' },
];

const ALTERNATIVE_TIMES = ['09:30 AM', '11:00 AM', '01:30 PM', '03:00 PM', '04:30 PM'];

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirmReschedule,
}) => {
  const [selectedDate, setSelectedDate] = useState(ALTERNATIVE_DATES[0]);
  const [selectedTime, setSelectedTime] = useState(ALTERNATIVE_TIMES[1]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleReschedule = () => {
    setIsLoading(true);
    setTimeout(() => {
      onConfirmReschedule(selectedDate.dateStr, selectedDate.formattedDate, selectedTime);
      setIsLoading(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs" />
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-border-divider/70 p-5 z-50 animate-slide-up space-y-4">
        <div className="flex items-center justify-between border-b border-border-divider/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">edit_calendar</span>
            <h3 className="text-base font-bold text-text-primary">Reschedule Call</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-neutral text-text-secondary hover:text-text-primary flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-3 bg-surface-neutral rounded-xl text-xs space-y-1">
          <span className="text-text-secondary">Current Booking Hold:</span>
          <p className="font-semibold text-text-primary">
            {booking.formattedDate} at {booking.timeStr}
          </p>
          <span className="text-[11px] text-text-secondary">
            Previous slot will be instantly released for other invitees.
          </span>
        </div>

        {/* Date Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-primary block">Select New Date:</label>
          <div className="space-y-1.5">
            {ALTERNATIVE_DATES.map((d) => (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDate(d)}
                className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition-all ${
                  selectedDate.dateStr === d.dateStr
                    ? 'bg-primary-container text-on-primary border-primary shadow-xs'
                    : 'bg-surface hover:bg-surface-neutral border-border-divider text-text-primary'
                }`}
              >
                <span>{d.formattedDate}</span>
                {selectedDate.dateStr === d.dateStr && (
                  <span className="material-symbols-filled text-[14px]">check</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Time Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-primary block">Select New Time Slot (EDT):</label>
          <div className="grid grid-cols-3 gap-2">
            {ALTERNATIVE_TIMES.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                  selectedTime === time
                    ? 'bg-primary-container text-on-primary border-primary shadow-xs'
                    : 'bg-surface hover:bg-surface-neutral border-border-divider text-text-primary'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-border-divider/50 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-surface-neutral hover:bg-surface-variant text-text-primary font-semibold text-xs"
          >
            Keep Original
          </button>
          <button
            onClick={handleReschedule}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-primary-container hover:bg-primary-hover active:scale-95 text-on-primary font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
          >
            {isLoading ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            ) : (
              <>
                <span>Confirm Change</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
