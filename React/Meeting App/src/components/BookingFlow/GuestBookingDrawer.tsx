import React, { useState } from 'react';
import { HostProfile, EventType, TimeSlot, Booking } from '../../types';

interface GuestBookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  host: HostProfile;
  eventType: EventType;
  selectedDate: string;
  formattedDate: string;
  selectedSlot: TimeSlot;
  onConfirmBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
  guestTimezone: string;
}

export const GuestBookingDrawer: React.FC<GuestBookingDrawerProps> = ({
  isOpen,
  onClose,
  host,
  eventType,
  selectedDate,
  formattedDate,
  selectedSlot,
  onConfirmBooking,
  guestTimezone,
}) => {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCompany, setGuestCompany] = useState('');
  const [projectScope, setProjectScope] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
  const [email24h, setEmail24h] = useState(true);
  const [sms1h, setSms1h] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim()) {
      alert('Please fill in your name and email.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      onConfirmBooking({
        eventTypeId: eventType.id,
        eventTitle: eventType.title,
        hostName: host.name,
        guestName,
        guestEmail,
        guestPhone,
        guestCompany,
        projectScope,
        guestNotes,
        dateStr: selectedDate,
        formattedDate,
        timeStr: selectedSlot.time,
        durationMinutes: eventType.durationMinutes,
        meetLink: 'https://meet.google.com/xyz-qwer-abc',
        timezone: guestTimezone,
        remindersEnabled: {
          email24h,
          sms1h,
        },
      });
      setIsSubmitting(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-text-primary/40 backdrop-blur-[3px] transition-opacity animate-fade-in"
      />

      {/* Bottom Sheet Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-surface-container-lowest rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col z-50 animate-slide-up border-t border-border-divider/60"
      >
        {/* Grab Handle */}
        <div className="pt-3 pb-2 px-4 shrink-0 flex flex-col items-center">
          <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full cursor-grab active:cursor-grabbing mb-2" />
        </div>

        {/* Sheet Header Summary */}
        <div className="px-5 pb-3 border-b border-border-divider/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 shrink-0">
              <img
                src={host.avatarUrl}
                alt={host.name}
                className="w-10 h-10 rounded-full object-cover shadow-xs border border-surface-container"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary-container text-on-primary rounded-full flex items-center justify-center text-[8px] font-bold">
                ✓
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-text-primary truncate">{host.name}</span>
                <span className="bg-surface-variant text-primary text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                  Host
                </span>
              </div>
              <p className="text-xs text-text-secondary truncate">
                {eventType.title} • <span className="font-semibold text-text-primary">{formattedDate}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-neutral text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Selected Slot Badge */}
        <div className="px-5 py-2.5 bg-surface-neutral/60 border-b border-border-divider/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-text-primary font-semibold">
            <span className="material-symbols-filled text-[16px] text-primary">schedule</span>
            <span>{selectedSlot.time} ({host.timezone.split('/')[1]} time)</span>
          </div>
          <span className="px-2 py-0.5 bg-secondary-container/50 text-on-secondary-container font-semibold rounded-full text-[11px]">
            Slot Temporarily Held
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {formStep === 1 ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">Guest Information</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  No sign-up required. Your calendar invite will be delivered automatically.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Your Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border-divider focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Work Email Address <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jane@company.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border-divider focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Phone / WhatsApp (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border-divider focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Studio"
                    value={guestCompany}
                    onChange={(e) => setGuestCompany(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border-divider focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-text-secondary">Step 1 of 2: Basic info</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!guestName.trim() || !guestEmail.trim()) {
                      alert('Please enter your name and email to proceed.');
                      return;
                    }
                    setFormStep(2);
                  }}
                  className="px-4 py-2 bg-surface-neutral hover:bg-surface-variant text-primary font-bold text-xs rounded-xl border border-border-divider flex items-center gap-1 transition-all"
                >
                  <span>Next: Intake Questions</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-primary">Meeting Intake & Context</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Helps Alex prepare technical materials before the call.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  ← Back
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  What is the primary topic or goal for this session?
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Scaling calendar sync to 10k enterprise seats with conflict resolution"
                  value={projectScope}
                  onChange={(e) => setProjectScope(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface border border-border-divider focus:border-primary focus:ring-2 focus:ring-primary/10 text-xs sm:text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Additional notes or links (Figma, GitHub, Docs)
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/... or brief summary"
                  value={guestNotes}
                  onChange={(e) => setGuestNotes(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border-divider focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none transition-all"
                />
              </div>

              {/* Intelligent Reminders Options */}
              <div className="p-3 bg-surface-neutral rounded-xl border border-border-divider/50 space-y-2">
                <span className="text-xs font-bold text-text-primary block">
                  Automated Multi-Channel Reminders
                </span>
                <label className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={email24h}
                    onChange={(e) => setEmail24h(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span>Send email reminder 24 hours prior with 1-click reschedule link</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sms1h}
                    onChange={(e) => setSms1h(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span>Send SMS/WhatsApp notification 1 hour before meeting</span>
                </label>
              </div>
            </div>
          )}

          {/* Sticky Bottom Submit Button */}
          <div className="pt-2 pb-safe">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] bg-primary-container hover:bg-primary-hover active:scale-[0.99] disabled:opacity-70 text-on-primary font-bold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                  <span>Locking Slot & Syncing Calendar...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Book Call</span>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-text-secondary mt-2">
              🔒 Hold duration guaranteed for 10 minutes. Zero-friction cancellation anytime.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
