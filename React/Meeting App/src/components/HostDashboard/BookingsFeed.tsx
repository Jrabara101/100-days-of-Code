import React, { useState } from 'react';
import { Booking } from '../../types';

interface BookingsFeedProps {
  bookings: Booking[];
  onRescheduleBooking: (booking: Booking) => void;
  onCancelBooking: (bookingId: string) => void;
}

export const BookingsFeed: React.FC<BookingsFeedProps> = ({
  bookings,
  onRescheduleBooking,
  onCancelBooking,
}) => {
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'rescheduled' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);

  const filtered = bookings.filter((b) => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const matchesSearch =
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.guestEmail.toLowerCase().includes(search.toLowerCase()) ||
      b.eventTitle.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container font-bold text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-status-available"></span>
            Confirmed
          </span>
        );
      case 'rescheduled':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-bold text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            Rescheduled
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-error-container text-error font-bold text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-border-divider/70 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Bookings Feed</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time synchronization with calendar holds, attendee notes, and live meeting links.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-neutral p-1 rounded-xl border border-border-divider">
          {(['all', 'confirmed', 'rescheduled', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                filter === tab
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by attendee name, email, or meeting title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-lowest border border-border-divider/70 focus:border-primary text-xs sm:text-sm outline-none shadow-xs"
        />
        <span className="material-symbols-outlined text-[18px] text-text-secondary absolute left-3 top-3">
          search
        </span>
      </div>

      {/* Feed List */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest p-8 rounded-2xl border border-border-divider/70 text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-text-secondary/50">event_busy</span>
          <p className="text-sm font-semibold text-text-primary">No bookings found</p>
          <p className="text-xs text-text-secondary">Try switching the filter or searching for another name.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest p-4 rounded-2xl border border-border-divider/70 shadow-xs hover:border-border-divider transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-divider/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{item.eventTitle}</h3>
                    <p className="text-xs text-text-secondary">
                      {item.formattedDate} • <span className="font-semibold text-text-primary">{item.timeStr}</span> ({item.durationMinutes}m)
                    </p>
                  </div>
                </div>
                <div>{getStatusBadge(item.status)}</div>
              </div>

              {/* Guest Details Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                    <span className="material-symbols-outlined text-[15px] text-text-secondary">person</span>
                    <span>{item.guestName}</span>
                    {item.guestCompany && (
                      <span className="text-text-secondary font-normal">• {item.guestCompany}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">mail</span>
                    <span>{item.guestEmail}</span>
                    {item.guestPhone && <span>• {item.guestPhone}</span>}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 pt-1 sm:pt-0">
                  <a
                    href={item.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-surface-variant hover:bg-surface-variant/80 text-primary font-bold text-xs flex items-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">videocam</span>
                    <span>Join</span>
                  </a>

                  <button
                    onClick={() => setSelectedBookingDetails(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-neutral hover:bg-surface-container text-text-secondary hover:text-text-primary font-semibold text-xs transition-colors"
                  >
                    Intake Notes
                  </button>

                  {item.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => onRescheduleBooking(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-surface-neutral hover:bg-surface-container text-primary font-semibold text-xs transition-colors"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => onCancelBooking(item.id)}
                        className="px-2 py-1.5 rounded-lg text-error hover:bg-error-container/40 font-semibold text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Scope Snippet */}
              {item.projectScope && (
                <div className="p-2.5 bg-surface-neutral/80 rounded-xl text-xs text-text-secondary border border-border-divider/40">
                  <strong className="text-text-primary">Intake Topic:</strong> {item.projectScope}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedBookingDetails(null)} className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs" />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-border-divider/70 p-5 z-50 animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b border-border-divider/50 pb-3">
              <h3 className="text-base font-bold text-text-primary">Attendee Details & Intake Gate</h3>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="w-8 h-8 rounded-full bg-surface-neutral text-text-secondary hover:text-text-primary flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-surface-neutral rounded-xl space-y-1">
                <span className="text-text-secondary">Meeting Info:</span>
                <p className="font-bold text-text-primary text-sm">{selectedBookingDetails.eventTitle}</p>
                <p className="text-text-secondary">
                  {selectedBookingDetails.formattedDate} at {selectedBookingDetails.timeStr}
                </p>
                <p className="text-primary font-mono text-[11px]">{selectedBookingDetails.meetLink}</p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-text-primary block">Intake Questions & Responses:</span>
                <div className="p-3 rounded-xl border border-border-divider bg-surface space-y-1">
                  <span className="text-text-secondary font-semibold">Session Objective:</span>
                  <p className="text-text-primary">
                    {selectedBookingDetails.projectScope || 'No specific objective provided.'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border-divider bg-surface space-y-1">
                  <span className="text-text-secondary font-semibold">Additional Links & Notes:</span>
                  <p className="text-text-primary">
                    {selectedBookingDetails.guestNotes || 'None'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-secondary-container/40 rounded-xl space-y-1 text-text-secondary">
                <span className="font-bold text-on-secondary-container block">Reminders Configured:</span>
                <p>✓ 24-hour prior email reminder trigger</p>
                <p>✓ 1-hour prior SMS notification trigger</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="px-4 py-2 bg-primary-container text-on-primary font-bold text-xs rounded-xl"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
