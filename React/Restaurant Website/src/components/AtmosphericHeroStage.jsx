import React, { useState } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { RESTAURANT_METADATA, DINING_ZONES } from '../data/mockData';
import { Flame, Sparkles, Clock, Users, Calendar, ArrowRight, ShieldCheck, Wine, ChevronDown } from 'lucide-react';

export default function AtmosphericHeroStage() {
  const {
    theme,
    openReservationModal,
    bookingDraft,
    setBookingDraft,
    tables
  } = useRestaurant();

  // Selected quick bar state
  const [quickGuests, setQuickGuests] = useState(2);
  const [quickTime, setQuickTime] = useState('7:30 PM');
  const [quickDate, setQuickDate] = useState('Tonight, Oct 29');

  // Compute live availability per zone
  const counterTablesAvailable = tables.filter(t => t.zone_id === 'zone-counter' && t.status === 'available').length;
  const mainTablesAvailable = tables.filter(t => t.zone_id === 'zone-main' && t.status === 'available').length;
  const courtyardTablesAvailable = tables.filter(t => t.zone_id === 'zone-courtyard' && t.status === 'available').length;

  const handleQuickReserve = (zoneId = null) => {
    setBookingDraft(prev => ({
      ...prev,
      partySize: quickGuests,
      timeSlot: quickTime,
      date: quickDate,
      zoneId: zoneId || prev.zoneId
    }));
    openReservationModal(zoneId);
  };

  return (
    <section className="relative min-h-[85vh] lg:min-h-[88vh] flex flex-col justify-between overflow-hidden border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] transition-colors duration-500">
      
      {/* Background Editorial Canvas with Ambient Hearth Atmosphere */}
      <div className="absolute inset-0 z-0">
        <img
          src={
            theme === 'candlelight'
              ? "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=2000&q=85"
              : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=85"
          }
          alt="L'Atelier du Feu Culinary Hearth & Ambience"
          className="w-full h-full object-cover object-center scale-105 transition-all duration-1000 ease-out"
        />

        {/* Cinematic Vignettes and Archival Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-canvas)] via-[var(--bg-canvas)]/65 to-[var(--bg-canvas)]/30 backdrop-blur-[0.5px] transition-colors duration-500" />
        <div className="absolute inset-0 bg-linen-pattern opacity-40 mix-blend-overlay pointer-events-none" />
        
        {/* Subtle Ambient Hearth Glow */}
        {theme === 'candlelight' && (
          <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-[var(--brand-primary)]/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-3000" />
        )}
      </div>

      {/* Top Banner Tagline */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--accent-gold)]">
          <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
          <span className="text-[var(--text-primary)] font-medium">Michelin Guide Selected 2024 / 2025</span>
          <span className="opacity-40">•</span>
          <span className="text-[var(--text-muted)]">Live Oak & Binchotan Hearth</span>
        </div>
      </div>

      {/* Main Content Split: Manifesto & Instant Availability Bar */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          
          {/* Bottom-Left: Culinary Manifesto */}
          <div className="lg:col-span-7 space-y-4">
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-light text-[var(--text-primary)] leading-[1.08] tracking-tight">
              Wood-fired coastal cuisine &amp; natural cellars in the heart of the Arts District.
            </h1>
            
            <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl font-body font-light leading-relaxed">
              Every dish is shaped by white oak embers, wild Baja line catches, and heirloom grain pastas hand-pinched daily. Unhurried dining designed around our living room hearth.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono-numbers text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>Executive Chef Mateo Solís</span>
              </div>
              <span className="opacity-30">•</span>
              <div className="flex items-center gap-1.5">
                <Wine className="w-4 h-4 text-rose-400" />
                <span>Master Sommelier Hélène Vance</span>
              </div>
              <span className="opacity-30">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Allergen Ambiguity</span>
              </div>
            </div>
          </div>

          {/* Bottom-Right: Floating Instant Availability Bar */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 rounded-2xl bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-[var(--border-hairline)] shadow-2xl space-y-5">
              
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono-numbers uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                    Instant Table Concierge
                  </span>
                </div>
                <span className="text-[11px] font-mono-numbers text-[var(--text-muted)]">
                  Zero Reservation Fees
                </span>
              </div>

              {/* Quick Selectors Row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Party Size */}
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                  <label className="block text-[10px] uppercase font-mono-numbers text-[var(--text-muted)] mb-1">
                    Guests
                  </label>
                  <select
                    value={quickGuests}
                    onChange={(e) => setQuickGuests(Number(e.target.value))}
                    className="w-full bg-transparent text-xs font-mono-numbers text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 8].map(n => (
                      <option key={n} value={n} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                        {n} {n === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                  <label className="block text-[10px] uppercase font-mono-numbers text-[var(--text-muted)] mb-1">
                    Date
                  </label>
                  <select
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono-numbers text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="Tonight, Oct 29" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                      Tonight
                    </option>
                    <option value="Tomorrow, Oct 30" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                      Tomorrow
                    </option>
                    <option value="Friday, Oct 31" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                      Friday
                    </option>
                    <option value="Saturday, Nov 1" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                      Saturday
                    </option>
                  </select>
                </div>

                {/* Time Wave */}
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                  <label className="block text-[10px] uppercase font-mono-numbers text-[var(--text-muted)] mb-1">
                    Time
                  </label>
                  <select
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono-numbers text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="6:00 PM" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">6:00 PM</option>
                    <option value="6:30 PM" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">6:30 PM</option>
                    <option value="7:00 PM" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">7:00 PM</option>
                    <option value="7:30 PM" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">7:30 PM</option>
                    <option value="8:15 PM" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">8:15 PM</option>
                    <option value="9:00 PM" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">9:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Live Atmosphere Zone Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] tracking-wider">
                  Live Seating Atmosphere
                </span>

                <div className="grid grid-cols-1 gap-2">
                  {/* Chef's Counter */}
                  <button
                    onClick={() => handleQuickReserve('zone-counter')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-hairline)] hover:border-[var(--brand-primary)] bg-[var(--bg-surface)] hover:bg-[var(--brand-primary)]/5 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🔥</span>
                      <div>
                        <span className="text-xs font-medium text-[var(--text-primary)] block">
                          Chef's Open-Fire Counter
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono-numbers">
                          Direct view of live hearth
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono-numbers px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-medium">
                      {counterTablesAvailable > 0 ? `${counterTablesAvailable} Seats Open` : 'Standby'}
                    </span>
                  </button>

                  {/* Heated Olive Courtyard */}
                  <button
                    onClick={() => handleQuickReserve('zone-courtyard')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-hairline)] hover:border-[var(--brand-primary)] bg-[var(--bg-surface)] hover:bg-[var(--brand-primary)]/5 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🌿</span>
                      <div>
                        <span className="text-xs font-medium text-[var(--text-primary)] block">
                          Heated Olive Tree Courtyard
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono-numbers">
                          Radiant stone floors • 68°F
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono-numbers px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-medium">
                      {courtyardTablesAvailable > 0 ? `${courtyardTablesAvailable} Tables Open` : 'Standby'}
                    </span>
                  </button>

                  {/* Candlelit Main Dining Room */}
                  <button
                    onClick={() => handleQuickReserve('zone-main')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-hairline)] hover:border-[var(--brand-primary)] bg-[var(--bg-surface)] hover:bg-[var(--brand-primary)]/5 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🕯️</span>
                      <div>
                        <span className="text-xs font-medium text-[var(--text-primary)] block">
                          Candlelit Main Dining Room
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono-numbers">
                          Window banquettes • ~64 dB
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono-numbers px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-medium">
                      {mainTablesAvailable > 0 ? `${mainTablesAvailable} Tables Open` : 'Waitlist'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Main Floorplan CTA */}
              <button
                onClick={() => handleQuickReserve()}
                className="w-full py-3 px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[#FAF7F2] text-xs font-mono-numbers uppercase tracking-wider font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--brand-primary)]/25 transition-all cursor-pointer"
              >
                <span>Open Spatial Floorplan Concierge</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
