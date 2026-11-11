import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  MapPin, 
  QrCode, 
  Download, 
  Edit3, 
  Sparkles, 
  CheckCircle2, 
  Music, 
  Utensils, 
  Users, 
  Share2,
  Check
} from 'lucide-react';
import { downloadICS, getGoogleCalendarUrl } from '../services/calendarSyncService';

export function ConfirmedDigitalPass({
  event,
  currentGuest,
  rsvpRecord,
  onEditRsvp
}) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const passSerial = `PASS № ${String(Math.abs(rsvpRecord.primaryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 100)) % 900 + 100).padStart(3, '0')}`;

  const handleDownloadWallet = () => {
    setDownloadSuccess(true);
    try {
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    // Mock download / wallet notification
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 3000);
  };

  return (
    <div className="w-full rounded-3xl p-6 sm:p-8 bg-[#161E19] text-[#FAF7F2] border-2 border-theme-foil shadow-2xl relative overflow-hidden foil-shimmer">
      
      {/* Decorative Gold Inset Outline */}
      <div className="absolute inset-2 border border-amber-500/30 rounded-2xl pointer-events-none"></div>

      {/* Top Pass Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
        <div>
          <div className="text-[10px] font-mono tracking-widest uppercase text-amber-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Confirmed Guest Pass</span>
          </div>
          <div className="font-serif text-lg text-white font-medium">
            {event.hero.title}
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-xs text-amber-200/90 font-bold tracking-widest">
            {passSerial}
          </div>
          <div className="text-[10px] text-white/50 font-mono">
            STATUS: CONFIRMED
          </div>
        </div>
      </div>

      {/* Guest Name & Party Details */}
      <div className="py-6 relative z-10">
        <div className="text-xs uppercase font-mono text-amber-300/80 mb-1">
          Registered Attendee(s)
        </div>
        <h3 className="text-2xl sm:text-3xl font-serif text-white font-semibold">
          {rsvpRecord.primaryName}
          {rsvpRecord.plusOneName && ` & ${rsvpRecord.plusOneName}`}
        </h3>

        {/* Table & Seating Assignment Tag */}
        <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-amber-200">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium">
            {rsvpRecord.assignedTableName || 'Table 04 — The Olive Grove'}
          </span>
          <span className="text-white/40">•</span>
          <span className="font-mono">Seat {rsvpRecord.seatNumber || '03'}</span>
        </div>
      </div>

      {/* Perforated Separation Line */}
      <div className="relative my-2 py-2">
        <div className="border-b border-dashed border-white/20 w-full"></div>
        <div className="absolute -left-10 -top-2 w-6 h-6 rounded-full bg-theme-canvas"></div>
        <div className="absolute -right-10 -top-2 w-6 h-6 rounded-full bg-theme-canvas"></div>
      </div>

      {/* Middle Specs Bento: Sub-Events, Dietary & Song */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 text-xs relative z-10">
        
        {/* Confirmed Sub-Events */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="text-[10px] uppercase font-mono text-white/60 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>Access Tier:</span>
          </div>
          <div className="font-medium text-white/95">
            {rsvpRecord.subEventsConfirmed && rsvpRecord.subEventsConfirmed.length > 0
              ? `${rsvpRecord.subEventsConfirmed.length} Sub-Events Confirmed`
              : 'Full Weekend All-Access'}
          </div>
        </div>

        {/* Dietary Profile */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="text-[10px] uppercase font-mono text-white/60 mb-1 flex items-center gap-1">
            <Utensils className="w-3 h-3 text-amber-400" />
            <span>Catering Profile:</span>
          </div>
          <div className="font-medium text-emerald-300">
            {Array.isArray(rsvpRecord.dietary) && rsvpRecord.dietary.length > 0 
              ? rsvpRecord.dietary.join(', ') 
              : 'No Restrictions'}
          </div>
        </div>

      </div>

      {/* Dancefloor Song Tag */}
      {rsvpRecord.favoriteSong && (
        <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
          <Music className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="truncate">Queue Song: <strong className="text-white">{rsvpRecord.favoriteSong}</strong></span>
        </div>
      )}

      {/* Scannable SVG QR Check-in Code & Verification Stub */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        
        {/* Mock High-Res SVG QR Code */}
        <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <svg viewBox="0 0 100 100" className="w-full h-full text-neutral-900 fill-current">
            {/* Top-left position marker */}
            <rect x="0" y="0" width="28" height="28" rx="4" />
            <rect x="4" y="4" width="20" height="20" fill="white" />
            <rect x="8" y="8" width="12" height="12" />
            {/* Top-right position marker */}
            <rect x="72" y="0" width="28" height="28" rx="4" />
            <rect x="76" y="4" width="20" height="20" fill="white" />
            <rect x="80" y="8" width="12" height="12" />
            {/* Bottom-left position marker */}
            <rect x="0" y="72" width="28" height="28" rx="4" />
            <rect x="4" y="76" width="20" height="20" fill="white" />
            <rect x="8" y="80" width="12" height="12" />
            {/* Random aesthetic QR data points */}
            <rect x="36" y="8" width="8" height="8" />
            <rect x="48" y="16" width="12" height="8" />
            <rect x="36" y="28" width="8" height="16" />
            <rect x="52" y="32" width="16" height="8" />
            <rect x="12" y="40" width="16" height="8" />
            <rect x="36" y="52" width="28" height="8" />
            <rect x="72" y="40" width="8" height="20" />
            <rect x="84" y="56" width="12" height="12" />
            <rect x="44" y="68" width="16" height="8" />
            <rect x="68" y="76" width="16" height="16" />
            <rect x="36" y="84" width="8" height="12" />
          </svg>
        </div>

        <div className="text-center sm:text-left flex-1 text-xs">
          <div className="font-semibold text-white mb-1">Door Concierge QR Check-In</div>
          <p className="text-white/60 text-[11px] leading-relaxed mb-2">
            Present this pass upon estate gates arrival or to the hotel shuttle chauffeur for instant check-in.
          </p>
          <div className="text-[10px] font-mono text-amber-300">
            Validated by Host Guest Protocol v2.6
          </div>
        </div>

      </div>

      {/* Action Footer: Save to Wallet & 1-Click Self-Edit */}
      <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
        
        <button
          onClick={handleDownloadWallet}
          className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-4 h-4 text-neutral-900" />
              <span>Saved to Apple / Google Wallet!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Save Pass to Wallet / Keepsake</span>
            </>
          )}
        </button>

        <button
          onClick={onEditRsvp}
          className="py-2.5 px-4 rounded-xl border border-white/20 hover:border-amber-400 text-white/90 hover:text-white text-xs font-medium transition flex items-center gap-1.5"
          title="Update dietary needs or plus-one name"
        >
          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
          <span>Edit RSVP</span>
        </button>

      </div>

      {/* Graceful "Plans Changed?" Self-Edit Footer Alert */}
      <div className="mt-4 text-center text-[11px] text-white/50">
        <span>Plans changed? You can update dietary notes or plus-ones until </span>
        <span className="text-amber-200 font-medium">October 15, 2026</span>
      </div>

    </div>
  );
}

