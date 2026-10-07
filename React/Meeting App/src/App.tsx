import React, { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav, HostTab, GuestTab } from './components/BottomNav';
import { SlotPicker } from './components/BookingFlow/SlotPicker';
import { GuestBookingDrawer } from './components/BookingFlow/GuestBookingDrawer';
import { ConfirmationScreen } from './components/BookingFlow/ConfirmationScreen';
import { TimezoneComparisonModal } from './components/BookingFlow/TimezoneComparisonModal';
import { RescheduleModal } from './components/BookingFlow/RescheduleModal';
import { EventTypeManager } from './components/HostDashboard/EventTypeManager';
import { AvailabilityMatrix } from './components/HostDashboard/AvailabilityMatrix';
import { BookingsFeed } from './components/HostDashboard/BookingsFeed';
import { GroupConsensusPollComponent } from './components/HostDashboard/GroupConsensusPoll';
import { CalendarSyncModal } from './components/HostDashboard/CalendarSyncModal';
import { ApkDownloadModal } from './components/ApkDownloadModal';

import {
  initialHostProfile,
  initialEventTypes,
  initialBookings,
  initialGroupPoll,
  initialCalendars,
  initialWebhookLogs,
} from './data/mockData';
import { EventType, TimeSlot, Booking, WebhookLog } from './types';

export const App: React.FC = () => {
  // Navigation & Mode
  const [activeMode, setActiveMode] = useState<'guest' | 'host'>('guest');
  const [activeHostTab, setActiveHostTab] = useState<HostTab>('events');
  const [activeGuestTab, setActiveGuestTab] = useState<GuestTab>('booking');

  // Master Data State
  const [host] = useState(initialHostProfile);
  const [eventTypes, setEventTypes] = useState<EventType[]>(initialEventTypes);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [calendars] = useState(initialCalendars);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(initialWebhookLogs);

  // Guest Booking Flow State
  const [selectedEventType, setSelectedEventType] = useState<EventType>(initialEventTypes[0]);
  const [selectedDate, setSelectedDate] = useState('2024-10-24');
  const [formattedDate, setFormattedDate] = useState('Thursday, October 24, 2024');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<'picker' | 'confirmed'>('picker');
  const [currentBooking, setCurrentBooking] = useState<Booking>(initialBookings[0]);
  const [guestTimezone, setGuestTimezone] = useState('America/New_York (EDT, GMT-4)');

  // Modals
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);

  // Handler: Select slot and open intake drawer
  const handleProceedToForm = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsDrawerOpen(true);
  };

  // Handler: Confirm Booking Submission
  const handleConfirmBooking = (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: `bkg-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };

    setBookings([newBooking, ...bookings]);
    setCurrentBooking(newBooking);
    setIsDrawerOpen(false);
    setBookingStep('confirmed');

    // Emit live webhook event
    const newWebhook: WebhookLog = {
      id: `wh-${Date.now().toString().slice(-3)}`,
      event: 'booking.created',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      status: 'delivered',
      responseCode: 200,
      payload: {
        event: 'booking.created',
        bookingId: newBooking.id,
        guest: newBooking.guestName,
        guestEmail: newBooking.guestEmail,
        time: `${newBooking.dateStr}T${newBooking.timeStr}`,
        meetLink: newBooking.meetLink,
      },
    };
    setWebhookLogs([newWebhook, ...webhookLogs]);
  };

  // Handler: Reschedule Booking
  const handleConfirmReschedule = (newDateStr: string, newFormattedDate: string, newTimeStr: string) => {
    if (!rescheduleTarget) return;

    const updated = bookings.map((b) => {
      if (b.id === rescheduleTarget.id) {
        return {
          ...b,
          dateStr: newDateStr,
          formattedDate: newFormattedDate,
          timeStr: newTimeStr,
          status: 'rescheduled' as const,
        };
      }
      return b;
    });

    setBookings(updated);
    if (currentBooking.id === rescheduleTarget.id) {
      setCurrentBooking({
        ...currentBooking,
        dateStr: newDateStr,
        formattedDate: newFormattedDate,
        timeStr: newTimeStr,
        status: 'rescheduled',
      });
    }

    // Webhook log
    const wh: WebhookLog = {
      id: `wh-${Date.now().toString().slice(-3)}`,
      event: 'booking.rescheduled',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      status: 'delivered',
      responseCode: 200,
      payload: {
        event: 'booking.rescheduled',
        bookingId: rescheduleTarget.id,
        newSlot: `${newDateStr}T${newTimeStr}`,
        previousSlot: `${rescheduleTarget.dateStr}T${rescheduleTarget.timeStr}`,
      },
    };
    setWebhookLogs([wh, ...webhookLogs]);
    setRescheduleTarget(null);
  };

  // Handler: Cancel Booking
  const handleCancelBooking = (bookingId: string) => {
    const updated = bookings.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b));
    setBookings(updated);

    const wh: WebhookLog = {
      id: `wh-${Date.now().toString().slice(-3)}`,
      event: 'booking.cancelled',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      status: 'delivered',
      responseCode: 200,
      payload: {
        event: 'booking.cancelled',
        bookingId,
        reason: 'Hold released by attendee',
      },
    };
    setWebhookLogs([wh, ...webhookLogs]);
  };

  // Handler: Create new Event Type
  const handleCreateEventType = (newEvt: Omit<EventType, 'id' | 'slug'>) => {
    const created: EventType = {
      ...newEvt,
      id: `evt-${Date.now()}`,
      slug: newEvt.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
    };
    setEventTypes([...eventTypes, created]);
  };

  // Handler: Toggle active status
  const handleToggleEventTypeActive = (id: string) => {
    setEventTypes(
      eventTypes.map((evt) => (evt.id === id ? { ...evt, isActive: !evt.isActive } : evt))
    );
  };

  // Handler: Trigger test webhook
  const handleTriggerTestWebhook = (type: 'booking.created' | 'booking.rescheduled' | 'booking.cancelled') => {
    const testLog: WebhookLog = {
      id: `wh-${Date.now().toString().slice(-3)}`,
      event: type,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      status: 'delivered',
      responseCode: 200,
      payload: {
        event: type,
        testMode: true,
        dispatchedAt: new Date().toISOString(),
        host: host.name,
      },
    };
    setWebhookLogs([testLog, ...webhookLogs]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-text-primary antialiased font-sans">
      {/* App Header */}
      <Header
        host={host}
        activeMode={activeMode}
        onToggleMode={(mode) => {
          setActiveMode(mode);
          if (mode === 'guest') setBookingStep('picker');
        }}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        canGoBack={bookingStep === 'confirmed'}
        onGoBack={() => setBookingStep('picker')}
        pageTitle={bookingStep === 'confirmed' ? 'Booking Confirmed' : selectedEventType.title}
        subtitle={host.name}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 pt-4 pb-safe flex flex-col">
        {activeMode === 'guest' ? (
          /* GUEST BOOKING FLOW */
          <>
            {activeGuestTab === 'apk' ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-md">
                  <span className="material-symbols-filled text-4xl text-secondary">android</span>
                </div>
                <h2 className="text-xl font-bold text-text-primary">CalSync Mobile Android App</h2>
                <p className="text-xs text-text-secondary max-w-sm">
                  Experience frictionless booking with native Android push reminders, offline calendar synchronization, and haptic feedback.
                </p>
                <button
                  onClick={() => setIsApkModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-primary-container hover:bg-primary-hover active:scale-95 text-on-primary font-bold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span>Download Android APK Package</span>
                </button>
              </div>
            ) : activeGuestTab === 'my-bookings' ? (
              <div className="space-y-4 py-2">
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-border-divider/70 shadow-xs flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-text-primary">My Scheduled Sessions</h2>
                    <p className="text-xs text-text-secondary">View or modify your upcoming confirmed appointments.</p>
                  </div>
                  <button
                    onClick={() => setActiveGuestTab('booking')}
                    className="px-3 py-1.5 rounded-xl bg-primary-container text-on-primary font-semibold text-xs"
                  >
                    + Book New
                  </button>
                </div>

                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-surface-container-lowest border border-border-divider/70 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-text-primary">{b.eventTitle}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container font-semibold capitalize">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {b.formattedDate} at {b.timeStr} with <strong>{b.hostName}</strong>
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <a
                          href={b.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-bold text-xs hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">videocam</span>
                          Join Google Meet
                        </a>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRescheduleTarget(b)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="text-xs font-semibold text-error hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : bookingStep === 'picker' ? (
              <SlotPicker
                host={host}
                eventType={selectedEventType}
                selectedDate={selectedDate}
                onSelectDate={(dateStr, formatted) => {
                  setSelectedDate(dateStr);
                  setFormattedDate(formatted);
                }}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => setSelectedSlot(slot)}
                onProceedToForm={handleProceedToForm}
                onOpenTimezoneModal={() => setIsTimezoneModalOpen(true)}
                guestTimezone={guestTimezone}
              />
            ) : (
              <ConfirmationScreen
                booking={currentBooking}
                host={host}
                onReschedule={() => setRescheduleTarget(currentBooking)}
                onCancel={() => {
                  handleCancelBooking(currentBooking.id);
                  setBookingStep('picker');
                }}
                onBookAnother={() => setBookingStep('picker')}
              />
            )}
          </>
        ) : (
          /* HOST STUDIO / DASHBOARD */
          <>
            {/* Desktop Host Tab Bar */}
            <div className="hidden sm:flex items-center gap-2 mb-4 bg-surface-container-lowest p-1.5 rounded-2xl border border-border-divider shadow-xs">
              <button
                onClick={() => setActiveHostTab('events')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeHostTab === 'events' ? 'bg-primary-container text-on-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                <span>Event Types</span>
              </button>

              <button
                onClick={() => setActiveHostTab('availability')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeHostTab === 'availability' ? 'bg-primary-container text-on-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">pace</span>
                <span>Availability & Limits</span>
              </button>

              <button
                onClick={() => setActiveHostTab('bookings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeHostTab === 'bookings' ? 'bg-primary-container text-on-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">history</span>
                <span>Bookings ({bookings.length})</span>
              </button>

              <button
                onClick={() => setActiveHostTab('polls')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeHostTab === 'polls' ? 'bg-primary-container text-on-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">groups</span>
                <span>Consensus Quorum</span>
              </button>

              <button
                onClick={() => setActiveHostTab('sync')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeHostTab === 'sync' ? 'bg-primary-container text-on-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                <span>Calendar & Webhooks</span>
              </button>
            </div>

            {/* Tab Panes */}
            {activeHostTab === 'events' && (
              <EventTypeManager
                eventTypes={eventTypes}
                onToggleActive={handleToggleEventTypeActive}
                onCreateEventType={handleCreateEventType}
                onSelectEventTypeToBook={(evt) => {
                  setSelectedEventType(evt);
                  setActiveMode('guest');
                  setBookingStep('picker');
                }}
              />
            )}

            {activeHostTab === 'availability' && <AvailabilityMatrix />}

            {activeHostTab === 'bookings' && (
              <BookingsFeed
                bookings={bookings}
                onRescheduleBooking={(b) => setRescheduleTarget(b)}
                onCancelBooking={handleCancelBooking}
              />
            )}

            {activeHostTab === 'polls' && (
              <GroupConsensusPollComponent initialPoll={initialGroupPoll} />
            )}

            {activeHostTab === 'sync' && (
              <div className="space-y-4">
                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="w-full py-4 rounded-2xl bg-surface-container-lowest border border-border-divider/70 shadow-xs flex items-center justify-center gap-2 text-primary font-bold text-sm hover:bg-surface-neutral transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">sync</span>
                  <span>Open Full Two-Way Sync & Webhook Console</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Guest Booking Drawer (Bottom Sheet) */}
      {selectedSlot && (
        <GuestBookingDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          host={host}
          eventType={selectedEventType}
          selectedDate={selectedDate}
          formattedDate={formattedDate}
          selectedSlot={selectedSlot}
          onConfirmBooking={handleConfirmBooking}
          guestTimezone={guestTimezone}
        />
      )}

      {/* Timezone Comparison Slider Modal */}
      <TimezoneComparisonModal
        isOpen={isTimezoneModalOpen}
        onClose={() => setIsTimezoneModalOpen(false)}
        host={host}
        selectedTimezone={guestTimezone}
        onSelectTimezone={(tz) => setGuestTimezone(tz)}
      />

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          isOpen={true}
          onClose={() => setRescheduleTarget(null)}
          booking={rescheduleTarget}
          onConfirmReschedule={handleConfirmReschedule}
        />
      )}

      {/* Two-Way Calendar Sync & Webhooks Modal */}
      <CalendarSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        calendars={calendars}
        webhookLogs={webhookLogs}
        onTriggerTestWebhook={handleTriggerTestWebhook}
        onTestConflictDetection={() => {}}
      />

      {/* Android Capacitor APK Download Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeMode={activeMode}
        activeHostTab={activeHostTab}
        onSelectHostTab={(tab) => setActiveHostTab(tab)}
        activeGuestTab={activeGuestTab}
        onSelectGuestTab={(tab) => {
          setActiveGuestTab(tab);
          if (tab === 'timezone') setIsTimezoneModalOpen(true);
          if (tab === 'apk') setIsApkModalOpen(true);
        }}
      />
    </div>
  );
};
