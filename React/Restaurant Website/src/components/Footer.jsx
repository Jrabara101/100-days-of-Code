import React from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { RESTAURANT_METADATA } from '../data/mockData';
import { Flame, Wine, MapPin, Phone, Clock, ShieldCheck, Database, SlidersHorizontal, Sun, Moon } from 'lucide-react';

export default function Footer() {
  const {
    theme,
    toggleTheme,
    setHostCockpitOpen,
    setSchemaModalOpen,
    openReservationModal
  } = useRestaurant();

  return (
    <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] text-[var(--text-muted)] transition-colors duration-500">
      
      {/* Top Footer Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Column 1: Brand & Manifesto */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] flex items-center justify-center">
                <Flame className="w-5 h-5 fill-[var(--brand-primary)]" />
              </div>
              <span className="font-editorial text-3xl font-light text-[var(--text-primary)] uppercase tracking-wider">
                L'Atelier du Feu
              </span>
            </div>

            <p className="text-sm font-body font-light text-[var(--text-muted)] leading-relaxed max-w-sm">
              {RESTAURANT_METADATA.tagline}. Hand-pinched heirloom grain pastas, wild Baja line catches, and natural coastal cellars cooked over white oak embers.
            </p>

            <div className="pt-2 text-xs font-mono-numbers text-[var(--accent-gold)]">
              <span>{RESTAURANT_METADATA.michelinGuideBadge}</span>
            </div>
          </div>

          {/* Column 2: Hours of Service */}
          <div className="space-y-3">
            <h4 className="font-mono-numbers text-xs uppercase tracking-widest text-[var(--text-primary)] font-semibold">
              Culinary Services
            </h4>
            <div className="space-y-2 text-xs font-mono-numbers text-[var(--text-muted)]">
              <div>
                <span className="text-[var(--text-primary)] block font-medium">Midday Service</span>
                <span>Wed – Sun • 11:30 AM – 2:30 PM</span>
              </div>
              <div>
                <span className="text-[var(--text-primary)] block font-medium">Aperitivo &amp; Raw Bar</span>
                <span>Daily • 3:00 PM – 5:30 PM</span>
              </div>
              <div>
                <span className="text-[var(--text-primary)] block font-medium">Evening Hearth Service</span>
                <span>Daily • 5:30 PM – 11:00 PM</span>
              </div>
              <div>
                <span className="text-[var(--text-primary)] block font-medium">Chef's Tasting Waves</span>
                <span>6:00 PM &amp; 8:30 PM Seating</span>
              </div>
            </div>
          </div>

          {/* Column 3: Location & Hospitality */}
          <div className="space-y-3">
            <h4 className="font-mono-numbers text-xs uppercase tracking-widest text-[var(--text-primary)] font-semibold">
              The Dining Room
            </h4>
            <div className="space-y-2 text-xs font-mono-numbers text-[var(--text-muted)]">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-[var(--brand-primary)] shrink-0" />
                <span>{RESTAURANT_METADATA.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
                <span>{RESTAURANT_METADATA.phone}</span>
              </div>
              <p className="text-[11px] pt-1 leading-relaxed">
                Complimentary guest valet available at the Santa Fe portico beginning at 5:00 PM.
              </p>
            </div>
          </div>

          {/* Column 4: Quick Portals & Staff Controls */}
          <div className="space-y-3">
            <h4 className="font-mono-numbers text-xs uppercase tracking-widest text-[var(--text-primary)] font-semibold">
              Hospitality Portals
            </h4>
            <div className="flex flex-col space-y-2 text-xs font-mono-numbers">
              <button
                onClick={() => openReservationModal()}
                className="text-left text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors cursor-pointer"
              >
                Reserve Table on Floorplan
              </button>
              <button
                onClick={() => setHostCockpitOpen(true)}
                className="text-left text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3 text-[var(--accent-gold)]" />
                <span>Host Stand Live Cockpit</span>
              </button>
              <button
                onClick={() => setSchemaModalOpen(true)}
                className="text-left text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Database className="w-3 h-3 text-[var(--brand-primary)]" />
                <span>PostgreSQL / Supabase Schema</span>
              </button>
              <button
                onClick={toggleTheme}
                className="text-left text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {theme === 'candlelight' ? <Moon className="w-3 h-3 text-[var(--accent-gold)]" /> : <Sun className="w-3 h-3 text-amber-500" />}
                <span>Toggle {theme === 'candlelight' ? 'Daylight Mode' : 'Candlelight Mode'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-12 mt-12 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono-numbers">
          <p>© {new Date().getFullYear()} L'Atelier du Feu Hospitality Group LLC. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Celiac &amp; Dietary Guardrail Verified</span>
            <span>•</span>
            <span>Zero Double-Booking Engine</span>
            <span>•</span>
            <span>Resilient Architecture</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
