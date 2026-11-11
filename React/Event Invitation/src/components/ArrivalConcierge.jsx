import React, { useState } from 'react';
import { MapPin, Navigation, Car, Bed, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

export function ArrivalConcierge({ event }) {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (text, label) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedCode(label);
      setTimeout(() => setCopiedCode(null), 2200);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.concierge.address}`
  )}`;

  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(
    `${event.concierge.address}`
  )}`;

  return (
    <section id="travel" className="w-full mt-10">
      
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-6">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-theme-gold font-semibold">
          <Navigation className="w-3.5 h-3.5" />
          <span>Zero-Friction Logistics</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-serif text-theme-primary font-normal">
          Arrival & Travel Concierge
        </h3>
        <p className="text-xs sm:text-sm text-theme-secondary max-w-xl">
          Everything you need for seamless transit, valet parking, rideshare vouchers, and curated hotel blocks.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Bento 1: Exact Entrance & Navigation Pin */}
        <div className="p-5 sm:p-6 rounded-3xl bg-theme-card border border-theme-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-theme-inset border border-theme-border flex items-center justify-center text-theme-accent mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-theme-muted mb-1">
              Exact Entrance Pin
            </div>
            <h4 className="text-base font-serif font-semibold text-theme-primary mb-2">
              {event.hero.venue}
            </h4>
            <p className="text-xs text-theme-secondary mb-4 leading-relaxed">
              {event.concierge.address}
            </p>
            <div className="text-[11px] p-2.5 rounded-xl bg-theme-inset border border-theme-border text-theme-secondary mb-4">
              {event.concierge.valet}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-theme-border">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 rounded-xl bg-theme-accent text-white text-xs font-medium text-center flex items-center justify-center gap-1.5 hover:brightness-110 transition"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl border border-theme-border text-theme-primary text-xs font-medium hover:bg-theme-inset transition"
            >
              Apple Maps
            </a>
          </div>
        </div>

        {/* Bento 2: 1-Tap Uber / Lyft Voucher Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-theme-card border border-theme-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-theme-inset border border-theme-border flex items-center justify-center text-theme-accent mb-4">
              <Car className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-theme-muted mb-1">
              Host Rideshare Credit
            </div>
            <h4 className="text-base font-serif font-semibold text-theme-primary mb-2">
              {event.concierge.rideshareDiscount}
            </h4>
            <p className="text-xs text-theme-secondary mb-4 leading-relaxed">
              We want everyone celebrating safely! Use our courtesy host voucher code for rides between hotel blocks and the estate.
            </p>

            <div className="p-3 rounded-2xl bg-theme-inset border border-theme-border flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-theme-muted uppercase">Voucher Promo Code</div>
                <div className="font-mono text-sm font-bold text-theme-primary tracking-wider">
                  {event.concierge.rideshareCode}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(event.concierge.rideshareCode, 'rideshare')}
                className="px-3 py-1.5 rounded-xl bg-theme-card border border-theme-border text-xs font-medium text-theme-primary hover:border-theme-foil transition flex items-center gap-1 shadow-sm"
              >
                {copiedCode === 'rideshare' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-theme-muted" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-theme-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-theme-accent" />
            <span>Valid for Uber & Lyft on event weekend</span>
          </div>
        </div>

        {/* Bento 3: Curated Hotel Blocks & Group Rates */}
        <div className="p-5 sm:p-6 rounded-3xl bg-theme-card border border-theme-border shadow-sm flex flex-col justify-between md:col-span-1">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-theme-inset border border-theme-border flex items-center justify-center text-theme-accent mb-4">
              <Bed className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-theme-muted mb-1">
              Curated Accommodations
            </div>
            <h4 className="text-base font-serif font-semibold text-theme-primary mb-3">
              Reserved Courtesy Blocks
            </h4>

            <div className="space-y-3">
              {event.concierge.hotels.map((hotel, hIdx) => (
                <div 
                  key={hIdx}
                  className="p-3 rounded-xl bg-theme-inset/70 border border-theme-border/70 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between font-semibold text-theme-primary">
                    <span className="truncate max-w-[170px]">{hotel.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
                      {hotel.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-theme-muted text-[11px]">
                    <span>{hotel.distance}</span>
                    <span className="font-mono font-medium text-theme-primary">{hotel.rate}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-theme-border/50 text-[10px]">
                    <span className="font-mono text-theme-secondary">Code: {hotel.code}</span>
                    <button
                      onClick={() => copyToClipboard(hotel.code, `hotel-${hIdx}`)}
                      className="text-theme-accent hover:underline flex items-center gap-0.5"
                    >
                      {copiedCode === `hotel-${hIdx}` ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-theme-border text-center">
            <span className="text-[11px] text-theme-muted">Shuttle service routes between these hotels</span>
          </div>
        </div>

      </div>

    </section>
  );
}

