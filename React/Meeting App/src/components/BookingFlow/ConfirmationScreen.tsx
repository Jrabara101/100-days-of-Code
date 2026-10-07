import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Booking, HostProfile } from '../../types';

interface ConfirmationScreenProps {
  booking: Booking;
  host: HostProfile;
  onReschedule: () => void;
  onCancel: () => void;
  onBookAnother: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  booking,
  host,
  onReschedule,
  onCancel,
  onBookAnother,
}) => {
  const [copied, setCopied] = useState(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.3 },
        colors: ['#2563EB', '#10B981', '#60A5FA', '#34D399', '#93C5FD'],
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(booking.meetLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadICS = () => {
    // Generate valid iCalendar .ics format
    // Simple UTC conversion for sample date: 2024-10-24 10:00 EDT = 14:00 UTC
    const dateFormatted = booking.dateStr.replace(/-/g, '');
    const startTimeClean = booking.timeStr.includes('PM') && !booking.timeStr.startsWith('12')
      ? parseInt(booking.timeStr.split(':')[0], 10) + 12
      : parseInt(booking.timeStr.split(':')[0], 10);
    const minuteClean = booking.timeStr.split(':')[1].substring(0, 2);
    const startStr = `${dateFormatted}T${startTimeClean < 10 ? '0' + startTimeClean : startTimeClean}${minuteClean}00Z`;
    
    // Add duration
    const endMinutes = (parseInt(minuteClean, 10) + booking.durationMinutes);
    const endHour = startTimeClean + Math.floor(endMinutes / 60);
    const endMinMod = endMinutes % 60;
    const endStr = `${dateFormatted}T${endHour < 10 ? '0' + endHour : endHour}${endMinMod < 10 ? '0' + endMinMod : endMinMod}00Z`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CalSync//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${booking.id}@calsync.app`,
      `DTSTAMP:${dateFormatted}T000000Z`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${booking.eventTitle} with ${booking.hostName}`,
      `DESCRIPTION:CalSync Meeting with ${booking.guestName}.\\nGoogle Meet Link: ${booking.meetLink}\\nTopic: ${booking.projectScope || 'General Discovery'}`,
      `LOCATION:${booking.meetLink}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-${booking.dateStr}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`${booking.eventTitle} with ${booking.hostName}`);
    const details = encodeURIComponent(`Meeting Link: ${booking.meetLink}\nGuest: ${booking.guestName} (${booking.guestEmail})\nTopic: ${booking.projectScope || 'Discovery Call'}`);
    const location = encodeURIComponent(booking.meetLink);
    // Rough ISO start
    const dateFormatted = booking.dateStr.replace(/-/g, '');
    const startTimeClean = booking.timeStr.includes('PM') && !booking.timeStr.startsWith('12')
      ? parseInt(booking.timeStr.split(':')[0], 10) + 12
      : parseInt(booking.timeStr.split(':')[0], 10);
    const minuteClean = booking.timeStr.split(':')[1].substring(0, 2);
    const startStr = `${dateFormatted}T${startTimeClean < 10 ? '0' + startTimeClean : startTimeClean}${minuteClean}00Z`;
    const endMinutes = (parseInt(minuteClean, 10) + booking.durationMinutes);
    const endHour = startTimeClean + Math.floor(endMinutes / 60);
    const endMinMod = endMinutes % 60;
    const endStr = `${dateFormatted}T${endHour < 10 ? '0' + endHour : endHour}${endMinMod < 10 ? '0' + endMinMod : endMinMod}00Z`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center pb-24 animate-fade-in">
      {/* Celebratory Status Header */}
      <section className="flex flex-col items-center text-center pt-2 mb-4">
        {/* Animated Badge */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-md">
            <span className="material-symbols-filled text-3xl">check</span>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-filled text-[12px]">celebration</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-text-primary tracking-tight">You are scheduled!</h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xs">
          A calendar invitation and video link have been dispatched to{' '}
          <strong className="text-text-primary">{booking.guestEmail}</strong>.
        </p>
      </section>

      {/* Meeting Receipt Card */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs border border-border-divider/70 space-y-4 mb-4">
        {/* Header: Event Title & Host */}
        <div className="flex items-center justify-between pb-2 border-b border-border-divider/50">
          <div className="min-w-0 pr-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-semibold text-[11px] mb-1">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              {booking.durationMinutes} Min Discovery Call
            </span>
            <h2 className="text-base font-bold text-text-primary truncate">{booking.eventTitle}</h2>
          </div>
          <div className="relative shrink-0">
            <img
              alt={host.name}
              className="w-11 h-11 rounded-full object-cover shadow-xs border border-surface-container"
              src={host.avatarUrl}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-status-available flex items-center justify-center text-on-primary text-[9px] font-bold">
              ✓
            </span>
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-3 text-xs sm:text-sm">
          {/* Date & Time Row */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">event</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary">{booking.formattedDate}</p>
              <p className="text-xs text-text-secondary">
                {booking.timeStr} • ({booking.durationMinutes} mins)
              </p>
            </div>
          </div>

          {/* Video / Location Row */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">video_call</span>
            </div>
            <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-text-primary">Google Meet</p>
                <p className="text-xs text-text-secondary truncate max-w-[190px]">
                  {booking.meetLink.replace('https://', '')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-surface-container hover:bg-surface-variant text-primary font-semibold text-xs flex items-center gap-1 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Attendees Row */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary">Attendees</p>
              <div className="mt-1 space-y-1 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-available"></span>
                  <span className="truncate">
                    {booking.hostName} <span className="text-[10px] text-text-secondary/70">(Host)</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  <span className="truncate">
                    {booking.guestName} <span className="text-[10px] text-text-secondary/70">({booking.guestEmail})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Intake Question Context if provided */}
          {booking.projectScope && (
            <div className="p-2.5 bg-surface-neutral rounded-xl border border-border-divider/50 text-xs">
              <span className="font-semibold text-text-primary block">Discussion Objective:</span>
              <p className="text-text-secondary mt-0.5">{booking.projectScope}</p>
            </div>
          )}
        </div>
      </section>

      {/* Dynamic Instant Calendar Action Buttons */}
      <section className="w-full space-y-2.5 mb-5">
        <a
          href={getGoogleCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 px-4 rounded-xl bg-primary-container hover:bg-primary-hover active:scale-[0.99] text-on-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#FFFFFF"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#FFFFFF"
              fillOpacity="0.85"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FFFFFF"
              fillOpacity="0.75"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#FFFFFF"
            />
          </svg>
          <span>Add to Google Calendar</span>
        </a>

        <button
          type="button"
          onClick={handleDownloadICS}
          className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest hover:bg-surface-neutral active:scale-[0.99] text-text-primary border border-border-divider/80 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          <span className="material-symbols-outlined text-[18px] text-text-secondary">calendar_month</span>
          <span>Download .ICS / Outlook</span>
        </button>
      </section>

      {/* 2-Click Reschedule & Cancellation Footer */}
      <footer className="w-full flex flex-col items-center text-center space-y-3">
        <p className="text-xs text-text-secondary">
          Need to make changes?{' '}
          <button
            type="button"
            onClick={onReschedule}
            className="text-primary hover:underline font-semibold mx-1 cursor-pointer"
          >
            Reschedule slot
          </button>
          or{' '}
          <button
            type="button"
            onClick={onCancel}
            className="text-error hover:underline font-semibold ml-1 cursor-pointer"
          >
            Cancel call
          </button>
        </p>

        <button
          type="button"
          onClick={onBookAnother}
          className="text-xs font-semibold text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg bg-surface-neutral transition-colors"
        >
          ← Book another session
        </button>

        <div className="flex items-center gap-1.5 opacity-60 text-[11px] text-text-secondary uppercase tracking-widest pt-1">
          <span className="material-symbols-outlined text-[13px]">sync_saved_locally</span>
          <span>Powered by CalSync Two-Way Realtime Engine</span>
        </div>
      </footer>
    </div>
  );
};
