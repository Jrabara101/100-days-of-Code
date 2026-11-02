import React, { useState } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { DINING_ZONES } from '../data/mockData';
import FloorplanCanvas from './FloorplanCanvas';
import DigitalTableTicket from './DigitalTableTicket';
import {
  Calendar,
  Clock,
  Users,
  Eye,
  Volume2,
  Sparkles,
  Flame,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Bell,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';

export default function SpatialReservationConcierge({ isModal = false, onClose = null }) {
  const {
    tables,
    diningZones,
    selectedZone,
    setSelectedZone,
    selectedTable,
    setSelectedTable,
    bookingDraft,
    setBookingDraft,
    holdTimerSeconds,
    activeHeldTableId,
    holdTableForBooking,
    confirmReservation,
    reservationStep,
    setReservationStep,
    confirmedReservation,
    setWaitlistModalOpen,
    dietaryFilters
  } = useRestaurant();

  // Time wave slot options
  const timeWaves = [
    { label: 'Early Evening (5:00 – 6:15 PM)', slots: ['5:00 PM', '5:30 PM', '6:00 PM', '6:15 PM'] },
    { label: 'Prime Seating (6:30 – 8:30 PM)', slots: ['6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:15 PM'] },
    { label: 'Late Night (8:45 – 10:15 PM)', slots: ['8:45 PM', '9:15 PM', '9:45 PM', '10:15 PM'] },
  ];

  const handleTableNodeSelect = (table) => {
    if (table.status === 'occupied') {
      // Suggest standby
      return;
    }
    holdTableForBooking(table);
    setReservationStep(2);
  };

  const currentZoneObj = diningZones.find(z => z.id === (selectedTable?.zone_id || bookingDraft.zoneId)) || diningZones[0];

  // Format 5-minute countdown into MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `0${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <section id="floorplan" className={`py-16 lg:py-24 bg-[var(--bg-canvas)] border-b border-[var(--border-hairline)] transition-colors duration-500 ${isModal ? 'py-6 lg:py-8' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading (if not in modal) */}
        {!isModal && (
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--accent-gold)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>Spatial Table Reservations &amp; Acoustic Pacing</span>
            </div>
            
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-light text-[var(--text-primary)] tracking-tight">
              Select Your Dining Atmosphere
            </h2>
            
            <p className="text-base text-[var(--text-muted)] font-body font-light leading-relaxed">
              No blind time-slot dropdowns. Touch your exact seat on the architectural floorplan, verify table sightlines, and customize dining pace before you arrive.
            </p>
          </div>
        )}

        {/* If reservation is already confirmed, show digital ticket */}
        {reservationStep === 4 && confirmedReservation ? (
          <div className="py-8">
            <DigitalTableTicket
              reservation={confirmedReservation}
              onClose={() => {
                setReservationStep(1);
                if (onClose) onClose();
              }}
            />
          </div>
        ) : (
          /* Main Split Concierge: Left Floorplan & Right Concierge Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 7 Columns: Spatial Architectural Floorplan & Sightlines */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Zone Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedZone('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono-numbers transition-all cursor-pointer ${
                    selectedZone === 'all'
                      ? 'bg-[var(--brand-primary)] text-[#FAF7F2] font-semibold'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
                  }`}
                >
                  All Spaces ({tables.length} Tables)
                </button>

                {diningZones.map(zone => {
                  const isZoneActive = selectedZone === zone.id;
                  const zoneTablesCount = tables.filter(t => t.zone_id === zone.id && t.status === 'available').length;
                  return (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZone(zone.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono-numbers whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isZoneActive
                          ? 'bg-[var(--brand-primary)] text-[#FAF7F2] font-semibold'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
                      }`}
                    >
                      <span>{zone.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded ${isZoneActive ? 'bg-white/20' : 'bg-[var(--border-hairline)]'}`}>
                        {zoneTablesCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Vector SVG Canvas */}
              <FloorplanCanvas
                onTableSelect={handleTableNodeSelect}
                selectedTableId={selectedTable?.id || bookingDraft.tableId}
              />

              {/* Zone Atmosphere Acoustic & Comfort Card */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-numbers">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--accent-gold)] shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[var(--text-primary)] font-semibold block">
                      {currentZoneObj.name}
                    </span>
                    <span className="text-[var(--text-muted)] text-[11px]">
                      {currentZoneObj.vibe_decibel_label} • {currentZoneObj.seatingCount}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--text-muted)] sm:text-right">
                  <span className="text-emerald-500 font-medium">✓ Climate Controlled</span>
                  <span className="block opacity-75">{currentZoneObj.sightline_highlight}</span>
                </div>
              </div>

            </div>

            {/* Right 5 Columns: Time Horizon, Pacing & Hospitality Pre-Brief */}
            <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-xl space-y-6">
              
              {/* 5-Minute Ephemeral Slot Hold Header (When table is active) */}
              {activeHeldTableId ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono-numbers text-amber-500 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin text-amber-500" />
                    <span>
                      Holding <strong>{selectedTable?.label}</strong> for you
                    </span>
                  </div>
                  <span className="font-bold font-mono-numbers text-sm px-2 py-0.5 rounded bg-amber-500/20">
                    {formatTimer(holdTimerSeconds)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
                  <span className="text-xs font-mono-numbers uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                    Reservation Concierge
                  </span>
                  <span className="text-[11px] font-mono-numbers text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Real-Time Seat Locks</span>
                  </span>
                </div>
              )}

              {/* Step 1: Party Size & Time Slot Picker */}
              <div className="space-y-4">
                
                {/* Party & Date Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-1.5">
                      Party Size
                    </label>
                    <select
                      value={bookingDraft.partySize}
                      onChange={(e) => setBookingDraft(prev => ({ ...prev, partySize: Number(e.target.value) }))}
                      className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 8].map(n => (
                        <option key={n} value={n} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                          {n} {n === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-1.5">
                      Date
                    </label>
                    <select
                      value={bookingDraft.date}
                      onChange={(e) => setBookingDraft(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                    >
                      <option value="Tonight, Oct 29" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">Tonight, Oct 29</option>
                      <option value="Tomorrow, Oct 30" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">Tomorrow, Oct 30</option>
                      <option value="Friday, Oct 31" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">Friday, Oct 31</option>
                      <option value="Saturday, Nov 1" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">Saturday, Nov 1</option>
                    </select>
                  </div>
                </div>

                {/* Seating Wave Slots */}
                <div>
                  <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-2">
                    Available Seating Windows
                  </label>

                  <div className="space-y-2.5">
                    {timeWaves.map(wave => (
                      <div key={wave.label} className="space-y-1.5">
                        <span className="text-[10px] font-mono-numbers text-[var(--text-muted)] block">
                          {wave.label}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {wave.slots.map(slot => {
                            const isSelected = bookingDraft.timeSlot === slot;
                            return (
                              <button
                                key={slot}
                                onClick={() => setBookingDraft(prev => ({ ...prev, timeSlot: slot }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono-numbers transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[var(--brand-primary)] text-[#FAF7F2] font-bold shadow-md shadow-[var(--brand-primary)]/20'
                                    : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] border border-[var(--border-hairline)]'
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alternate Window / Standby Helper Banner */}
                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-center justify-between text-xs font-mono-numbers">
                  <div className="text-[var(--text-muted)]">
                    <span>Prime slots filling fast for tonight.</span>
                  </div>
                  <button
                    onClick={() => setWaitlistModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[var(--brand-primary)] hover:underline cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Join Standby List</span>
                  </button>
                </div>

              </div>

              {/* Step 2: Hospitality Pre-Briefing */}
              <div className="space-y-4 pt-4 border-t border-[var(--border-hairline)]">
                <span className="text-xs font-mono-numbers uppercase tracking-wider text-[var(--text-primary)] font-semibold block">
                  Hospitality Pre-Briefing
                </span>

                {/* Dining Pace Preference */}
                <div>
                  <label className="block text-[11px] font-mono-numbers text-[var(--text-muted)] mb-1.5">
                    Dining Pace
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'express', label: '⚡ Pre-Theater', sub: '60 Min' },
                      { id: 'standard', label: '🍷 Standard', sub: '1h 45m' },
                      { id: 'leisurely', label: '🕯️ Unhurried', sub: '2.5 Hours' }
                    ].map(pace => (
                      <button
                        key={pace.id}
                        type="button"
                        onClick={() => setBookingDraft(prev => ({ ...prev, pacingPreference: pace.id }))}
                        className={`p-2 rounded-lg text-left border text-xs font-mono-numbers transition-all cursor-pointer ${
                          bookingDraft.pacingPreference === pace.id
                            ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)] text-[var(--brand-primary)] font-semibold'
                            : 'bg-[var(--bg-surface)] border-[var(--border-hairline)] text-[var(--text-muted)]'
                        }`}
                      >
                        <span className="block text-xs text-[var(--text-primary)]">{pace.label}</span>
                        <span className="text-[10px] opacity-75">{pace.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Occasion Chips */}
                <div>
                  <label className="block text-[11px] font-mono-numbers text-[var(--text-muted)] mb-1.5">
                    Occasion (Optional)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Anniversary', 'Birthday', 'Client Dinner', 'Date Night', 'Casual Gastronomy'].map(occ => {
                      const isOccSelected = bookingDraft.occasion === occ;
                      return (
                        <button
                          key={occ}
                          type="button"
                          onClick={() => setBookingDraft(prev => ({ ...prev, occasion: isOccSelected ? '' : occ }))}
                          className={`px-2.5 py-1 rounded-full text-xs font-mono-numbers transition-all cursor-pointer ${
                            isOccSelected
                              ? 'bg-[var(--accent-gold)] text-[#0D0C0B] font-medium'
                              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
                          }`}
                        >
                          {occ}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pre-Linked Dietary Guardrails */}
                {bookingDraft.dietaryRestrictions.length > 0 && (
                  <div className="p-3 rounded-xl bg-[var(--safe-fill)] border border-[var(--safe-border)] text-xs font-mono-numbers text-[var(--safe-text)]">
                    <span className="font-semibold block mb-1">
                      ✓ Pre-Linked Dietary Profiles for the Chef:
                    </span>
                    <span className="opacity-90">
                      {bookingDraft.dietaryRestrictions.join(', ')}
                    </span>
                  </div>
                )}

                {/* Guest Contact Information */}
                <div className="space-y-2.5 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Guest Full Name *"
                      value={bookingDraft.guestName}
                      onChange={(e) => setBookingDraft(prev => ({ ...prev, guestName: e.target.value }))}
                      className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={bookingDraft.guestEmail}
                      onChange={(e) => setBookingDraft(prev => ({ ...prev, guestEmail: e.target.value }))}
                      className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none"
                    />
                  </div>

                  <input
                    type="tel"
                    placeholder="Mobile Phone (for SMS table readiness)"
                    value={bookingDraft.guestPhone}
                    onChange={(e) => setBookingDraft(prev => ({ ...prev, guestPhone: e.target.value }))}
                    className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none"
                  />
                </div>

                {/* Anti-No-Show Policy Callout */}
                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[11px] font-mono-numbers text-[var(--text-muted)] leading-relaxed">
                  <span className="font-medium text-[var(--text-primary)] block mb-0.5">
                    Hospitality Policy:
                  </span>
                  No charge today. A $25/person fee applies only for cancellations less than 12 hours prior to seating.
                </div>

                {/* Primary Confirmation Action */}
                <button
                  onClick={confirmReservation}
                  className="w-full py-3.5 px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[#FAF7F2] text-xs font-mono-numbers uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-xl shadow-[var(--brand-primary)]/25 transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <span>
                    Confirm Reservation at {selectedTable ? selectedTable.label : 'Selected Table'} →
                  </span>
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </section>
  );
}
