import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sun, 
  Sparkles, 
  Share2, 
  Check, 
  Download, 
  Compass, 
  ExternalLink,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { downloadICS, getGoogleCalendarUrl } from '../services/calendarSyncService';
import { getSunsetAdvisories, getGuestTimezoneContext } from '../services/sunCalcService';

export function HeroKeepsakeStage({
  event,
  currentGuest,
  onScrollToRsvp,
  onOpenDirections
}) {
  const [isUnsealed, setIsUnsealed] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const sunsetInfo = getSunsetAdvisories(event.id);
  const tzContext = getGuestTimezoneContext();

  const handleBreakSeal = () => {
    setIsUnsealed(true);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: [event.goldColor || '#C5A059', event.accentColor || '#2E5A44', '#FAF7F2']
      });
    } catch (e) {
      // safe fallback
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  return (
    <section className="relative w-full pt-6 pb-16 px-4 md:px-6 flex flex-col items-center">
      
      {/* Top Ceremony Intro Pill */}
      <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-theme-border bg-theme-inset text-xs tracking-widest font-mono uppercase text-theme-muted shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-theme-accent"></span>
        <span>{event.hero.kicker}</span>
      </div>

      {/* TACTILE UNSEAL ENVELOPE / PASS STAGE */}
      {!isUnsealed ? (
        <div 
          onClick={handleBreakSeal}
          className="cursor-pointer group relative w-full max-w-2xl rounded-3xl p-8 md:p-12 border-2 border-theme-foil bg-theme-card shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:shadow-gold-glow flex flex-col items-center text-center foil-shimmer"
        >
          {/* Decorative Corner Filigree / Inset */}
          <div className="absolute inset-3 border border-theme-border rounded-2xl pointer-events-none"></div>

          {/* Wax Seal / Pass Emblem */}
          <div 
            className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-wax mb-6 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105"
            style={{ backgroundColor: event.hero.sealColor || '#B8860B' }}
          >
            {/* Monogram Seal Engraving */}
            <div className="w-20 h-20 rounded-full border-2 border-amber-200/50 flex flex-col items-center justify-center text-amber-50 font-serif font-bold text-xl tracking-wider">
              <span>{event.hero.sealMonogram}</span>
              <span className="text-[9px] uppercase tracking-widest font-mono opacity-80 mt-0.5">EST. 2026</span>
            </div>
          </div>

          <div className="text-xs uppercase font-mono tracking-widest text-theme-muted mb-2">
            A Formal Digital Keepsake Prepared For
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-theme-primary mb-3">
            {currentGuest.partyName || currentGuest.primaryName}
          </h2>
          <p className="text-sm text-theme-secondary max-w-md mb-6 leading-relaxed">
            Touch or tap the monogram wax seal to unfold the full celebration itinerary, dress code moodboard, and confirmed guest concierge.
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-theme-accent text-white text-xs font-semibold tracking-wide uppercase shadow-md transition group-hover:brightness-110">
            <Sparkles className="w-4 h-4" />
            <span>Break Seal & Reveal Invitation</span>
          </div>
        </div>
      ) : (
        /* THE FULL UNFOLDED INVITATION MONUMENT */
        <div className="relative w-full max-w-4xl rounded-3xl p-6 sm:p-10 md:p-14 border border-theme-foil bg-theme-card shadow-paper-deep transition-all duration-700 animate-fadeIn">
          
          {/* Double Hairline Architectural Inset Frame */}
          <div className="absolute inset-2.5 sm:inset-4 border border-theme-border rounded-2xl pointer-events-none opacity-80"></div>
          <div className="absolute inset-3.5 sm:inset-5 border border-theme-foil/40 rounded-xl pointer-events-none opacity-50"></div>

          {/* Top Wax Seal Stamp / Keepsake Monogram */}
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-2 text-xs font-mono text-theme-muted tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
              <span>{event.hero.heroTagline}</span>
            </div>

            {/* Subtle Reseal toggle */}
            <button 
              onClick={() => setIsUnsealed(false)}
              className="text-[11px] font-mono text-theme-muted hover:text-theme-primary transition flex items-center gap-1 px-2.5 py-1 rounded-full border border-theme-border hover:bg-theme-inset"
              title="Return to envelope state"
            >
              <span>Envelope View</span>
            </button>
          </div>

          {/* Centered Wax Seal Monogram Floating Badge */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-wax text-amber-50 font-serif font-bold text-sm tracking-wider ring-4 ring-amber-100/30"
              style={{ backgroundColor: event.hero.sealColor || '#B8860B' }}
            >
              <span>{event.hero.sealMonogram}</span>
            </div>
          </div>

          {/* Main Title & Editorial Typography */}
          <div className="text-center relative z-10 max-w-2xl mx-auto">
            <div className="text-xs uppercase font-mono tracking-widest text-theme-gold font-semibold mb-3">
              {event.badge}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-theme-primary tracking-tight leading-[1.08] font-light mb-4">
              {event.hero.title}
            </h1>

            <p className="text-base sm:text-lg text-theme-secondary font-serif italic max-w-xl mx-auto mb-8 leading-relaxed">
              "{event.hero.subtitle}"
            </p>

            {/* Date, Time & Location Monument Separators */}
            <div className="py-5 border-y border-theme-border my-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-mono uppercase tracking-wider text-theme-muted mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-theme-accent" /> Date
                </span>
                <span className="font-serif text-lg font-semibold text-theme-primary">
                  {event.hero.dateShort}
                </span>
                <span className="text-xs text-theme-secondary">Saturday Evening</span>
              </div>

              <div className="flex flex-col items-center sm:border-x sm:border-theme-border">
                <span className="text-[11px] font-mono uppercase tracking-wider text-theme-muted mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-theme-accent" /> Ceremony Time
                </span>
                <span className="font-mono text-base font-semibold text-theme-primary">
                  {event.hero.time}
                </span>
                <span className="text-xs text-theme-secondary">Doors Open 30m Prior</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[11px] font-mono uppercase tracking-wider text-theme-muted mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-theme-accent" /> Destination
                </span>
                <span className="font-serif text-base font-semibold text-theme-primary truncate max-w-[200px]" title={event.hero.venue}>
                  {event.hero.venue}
                </span>
                <span className="text-xs text-theme-secondary">{event.hero.city}</span>
              </div>

            </div>

            {/* ATMOSPHERIC CONTEXT PILL STRIP */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2 rounded-full bg-theme-inset border border-theme-border text-xs text-theme-secondary mb-8 shadow-inner">
              <span className="flex items-center gap-1 font-medium text-theme-primary">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                {event.hero.sunset}
              </span>
              <span className="text-theme-muted">•</span>
              <span>{event.hero.weather}</span>
              <span className="text-theme-muted hidden sm:inline">•</span>
              <span className="font-medium text-theme-accent hidden sm:inline">
                {event.hero.attireSummary}
              </span>
            </div>

            {/* Quick Action Ribbon: Calendar Sync, Direction Pin & RSVP */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              
              <button
                onClick={onScrollToRsvp}
                className="px-6 py-3 rounded-full bg-theme-accent text-white font-medium text-sm shadow-md hover:brightness-110 active:scale-95 transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Confirm Your Attendance</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                {/* 1-Click .ICS Download */}
                <button
                  onClick={() => downloadICS(event)}
                  className="px-4 py-3 rounded-full border border-theme-border bg-theme-card hover:bg-theme-inset text-theme-primary text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                  title="Download .ICS file for Apple / Outlook"
                >
                  <Download className="w-3.5 h-3.5 text-theme-accent" />
                  <span>.ICS Calendar</span>
                </button>

                {/* Google Calendar Link */}
                <a
                  href={getGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-full border border-theme-border bg-theme-card hover:bg-theme-inset text-theme-primary text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                  title="Open in Google Calendar"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-theme-accent" />
                  <span>Google Cal</span>
                </a>

                {/* Share Link */}
                <button
                  onClick={handleCopyLink}
                  className="p-3 rounded-full border border-theme-border bg-theme-card hover:bg-theme-inset text-theme-secondary hover:text-theme-primary transition shadow-sm"
                  title="Copy Invitation Link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>

            </div>

            {/* Timezone & Coordinate Footer */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-theme-muted">
              <span>{tzContext.badgeText}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-theme-accent" />
                {event.hero.coordinates}
              </span>
            </div>

          </div>

        </div>
      )}

    </section>
  );
}

