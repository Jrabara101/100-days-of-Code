import React, { useState } from 'react';
import { ConfirmedReservation } from '../types';
import { calculateGraceWindowBuffer } from '../engine/reservationEngine';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  Share2, 
  Download, 
  AlertCircle, 
  RotateCcw, 
  UserPlus, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface DigitalReservationPassProps {
  reservation: ConfirmedReservation;
  onModifyReservation: () => void;
  onOpenSwapModal: () => void;
  onReleaseToWaitlist: () => void;
}

export const DigitalReservationPass: React.FC<DigitalReservationPassProps> = ({
  reservation,
  onModifyReservation,
  onOpenSwapModal,
  onReleaseToWaitlist,
}) => {
  const [runningLateState, setRunningLateState] = useState<{
    triggered: boolean;
    grantedMinutes: number;
    message: string;
    loading: boolean;
  }>({
    triggered: false,
    grantedMinutes: 0,
    message: '',
    loading: false,
  });

  const [guestCount, setGuestCount] = useState<number>(reservation.partySize);
  const [extraGuestAdded, setExtraGuestAdded] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Trigger Day-Of "Running 10m Late"
  const handleRunningLate = () => {
    setRunningLateState(prev => ({ ...prev, loading: true }));
    setTimeout(() => {
      const result = calculateGraceWindowBuffer(reservation, 10);
      setRunningLateState({
        triggered: true,
        grantedMinutes: result.grantedMinutes,
        message: result.message,
        loading: false,
      });
    }, 450);
  };

  // Add +1 Extra Guest
  const handleAddExtraGuest = () => {
    if (guestCount < reservation.spot.capacityMax) {
      setGuestCount(prev => prev + 1);
      setExtraGuestAdded(true);
    }
  };

  // 1-Click Calendar Sync (.ics download simulation)
  const handleCalendarSync = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AURA Concierge//EN
BEGIN:VEVENT
SUMMARY:Reservation at ${reservation.spot.zoneName} (${reservation.spot.code})
DESCRIPTION:Code: ${reservation.code}\\nSpot: ${reservation.spot.name}\\nParty: ${guestCount} Guests\\nNotes: ${reservation.hospitalityNotes.join(', ')}
DTSTART:20261119T184500Z
DTEND:20261119T201500Z
LOCATION:${reservation.spot.name}, AURA Venue
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AURA-${reservation.code}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy share pass link
  const handleSharePass = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full bg-[#18201C] text-[#FAF7F2] rounded-2xl border border-white/10 shadow-tactile-pass p-6 sm:p-7 relative overflow-hidden transition-all duration-500 animate-slide-up">
      
      {/* Decorative Gold & Emerald Foil Elements */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-[#C85A32]/25 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-[#1E6F50]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Header: Verified Seal & Code */}
      <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-[#2CA376] tracking-widest font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>CONFIRMED DIGITAL PASS</span>
          </div>
          <h2 className="font-mono text-2xl font-bold tracking-tight text-white mt-1">
            {reservation.code}
          </h2>
          <p className="text-xs text-white/70 font-sans mt-0.5">
            Present on arrival or tap NFC at host kiosk
          </p>
        </div>

        {/* Tactile Mini QR Code */}
        <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-md shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* SVG stylized scannable QR pattern */}
            <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
            <rect x="10" y="10" width="28" height="28" fill="#18201C" />
            <rect x="16" y="16" width="16" height="16" fill="#FFFFFF" />
            <rect x="20" y="20" width="8" height="8" fill="#18201C" />

            <rect x="62" y="10" width="28" height="28" fill="#18201C" />
            <rect x="68" y="16" width="16" height="16" fill="#FFFFFF" />
            <rect x="72" y="20" width="8" height="8" fill="#18201C" />

            <rect x="10" y="62" width="28" height="28" fill="#18201C" />
            <rect x="16" y="68" width="16" height="16" fill="#FFFFFF" />
            <rect x="20" y="72" width="8" height="8" fill="#18201C" />

            <circle cx="50" cy="50" r="8" fill="#C85A32" />
            <rect x="44" y="20" width="8" height="12" fill="#18201C" />
            <rect x="44" y="68" width="12" height="12" fill="#18201C" />
            <rect x="68" y="44" width="12" height="8" fill="#18201C" />
            <rect x="20" y="44" width="12" height="8" fill="#18201C" />
          </svg>
        </div>
      </div>

      {/* Spatial Details Grid */}
      <div className="space-y-3.5 mb-5 text-sm">
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-white/60 text-xs font-mono uppercase flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#C85A32]" /> Date &amp; Time
          </span>
          <span className="font-mono font-bold text-white">
            {reservation.timeStr}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-white/60 text-xs font-mono uppercase flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C85A32]" /> Table / Station
          </span>
          <span className="font-mono font-semibold text-[#F59E0B] text-right">
            📍 {reservation.spot.code} — {reservation.spot.name}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-white/60 text-xs font-mono uppercase flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#C85A32]" /> Party Size
          </span>
          <span className="font-mono text-white font-medium">
            {guestCount} Guests {extraGuestAdded && '(+1 Added)'}
          </span>
        </div>

        {/* Weather Contingency Protection Callout */}
        {reservation.isWeatherContingencyCovered && (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-white/80">
              Weather-Safe: Indoor backup table shadow-reserved.
            </span>
          </div>
        )}

        {/* Hospitality Micro-Prompts Recorded */}
        {reservation.hospitalityNotes.length > 0 && (
          <div className="pt-1">
            <span className="text-white/60 text-[11px] font-mono uppercase block mb-1">
              Host Briefing Flags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {reservation.hospitalityNotes.map((note, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white/10 text-white/90 text-xs font-medium"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Perforated Divider Line */}
      <div className="relative py-2 my-2">
        <div className="border-t border-dashed border-white/20 w-full" />
        <div className="absolute -left-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF7F2] dark:bg-[#0E1012]" />
        <div className="absolute -right-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF7F2] dark:bg-[#0E1012]" />
      </div>

      {/* Day-Of Flexibility Companion Bar (Feature Matrix & Pacing Engine) */}
      <div className="mb-5">
        <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold tracking-wider block mb-2">
          Day-of Arrival Flexibility Companion
        </span>

        <div className="grid grid-cols-2 gap-2">
          
          {/* Running 10 Mins Late Button */}
          <button
            onClick={handleRunningLate}
            disabled={runningLateState.triggered || runningLateState.loading}
            className={`px-3 py-2.5 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
              runningLateState.triggered
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 active:scale-95'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {runningLateState.triggered
                ? `Grace Window +10m Locked`
                : `🏃 Running 10m Late`}
            </span>
          </button>

          {/* +1 Extra Guest Joined Button */}
          <button
            onClick={handleAddExtraGuest}
            disabled={extraGuestAdded || guestCount >= reservation.spot.capacityMax}
            className={`px-3 py-2.5 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
              extraGuestAdded
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 active:scale-95'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>{extraGuestAdded ? `+1 Confirmed` : `+1 Extra Guest`}</span>
          </button>
        </div>

        {/* Grace Buffer Feedback Banner */}
        {runningLateState.triggered && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 animate-fade-in flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>{runningLateState.message}</div>
          </div>
        )}
      </div>

      {/* No-Penalty Swap & Marketplace Trigger */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-5 flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-white block">
            The "No-Penalty Swap" Marketplace
          </span>
          <span className="text-[11px] text-white/60">
            Need to change? Trade with waitlist without late cancel fee.
          </span>
        </div>
        <button
          onClick={onOpenSwapModal}
          className="px-2.5 py-1.5 rounded-lg bg-[#6D4C7D] hover:bg-[#835C95] text-white text-xs font-mono font-semibold flex items-center gap-1 transition-all shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          Swap Slot
        </button>
      </div>

      {/* Calendar Sync & Share Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleCalendarSync}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium font-mono flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Sync Calendar</span>
        </button>

        <button
          onClick={handleSharePass}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium font-mono flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? 'Link Copied!' : 'Share Pass'}</span>
        </button>
      </div>

      {/* Modify / New Booking Link */}
      <div className="mt-4 pt-3 border-t border-white/10 text-center">
        <button
          onClick={onModifyReservation}
          className="text-xs font-mono text-white/60 hover:text-white underline underline-offset-4 transition-colors"
        >
          ← Edit Preferences or Book Another Session
        </button>
      </div>

    </div>
  );
};
