import React, { useState } from 'react';
import { Archetype, ConfirmedReservation, Spot, TimeSlot, VisitStyle } from '../types';
import { DigitalReservationPass } from './DigitalReservationPass';
import confetti from 'canvas-confetti';
import { 
  Lock, 
  Sparkles, 
  Users, 
  MapPin, 
  Calendar, 
  Check, 
  Plus, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight,
  Info
} from 'lucide-react';

interface ReservationComposerProps {
  archetype: Archetype;
  selectedDate: string;
  selectedTimeSlot: TimeSlot | null;
  selectedSpot: Spot | null;
  partySize: number;
  visitStyle: VisitStyle;
  onInitiateGroupPoll: () => void;
  isGroupPollActive: boolean;
  groupPollSecondsRemaining: number;
  confirmedReservation: ConfirmedReservation | null;
  onConfirmBooking: (booking: ConfirmedReservation) => void;
  onModifyReservation: () => void;
  onOpenSwapModal: () => void;
  onReleaseToWaitlist: () => void;
}

export const ReservationComposer: React.FC<ReservationComposerProps> = ({
  archetype,
  selectedDate,
  selectedTimeSlot,
  selectedSpot,
  partySize,
  visitStyle,
  onInitiateGroupPoll,
  isGroupPollActive,
  groupPollSecondsRemaining,
  confirmedReservation,
  onConfirmBooking,
  onModifyReservation,
  onOpenSwapModal,
  onReleaseToWaitlist,
}) => {
  // Hospitality prompt selections
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  // Selected Add-Ons
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  // Split deposit toggle
  const [enableSplitDeposit, setEnableSplitDeposit] = useState<boolean>(false);
  // Guest details state
  const [guestName, setGuestName] = useState<string>('Alex Morgan');
  const [guestPhone, setGuestPhone] = useState<string>('+1 (555) 382-9410');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Toggle hospitality pill
  const toggleNote = (label: string) => {
    setSelectedNotes(prev =>
      prev.includes(label) ? prev.filter(n => n !== label) : [...prev, label]
    );
  };

  // Toggle Add-on
  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // Calculations
  const baseDepositPerPerson = selectedSpot?.priceDeposit || 25;
  const depositTotal = (baseDepositPerPerson * partySize) +
    selectedAddOnIds.reduce((sum, id) => {
      const addon = archetype.curatedAddOns.find(a => a.id === id);
      return sum + (addon ? addon.price : 0);
    }, 0);

  const perPersonSplit = Math.round(depositTotal / Math.max(1, partySize));

  // Handle Complete Booking
  const handleConfirm = () => {
    if (!selectedTimeSlot || !selectedSpot) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Fire celebration confetti!
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#C85A32', '#1E6F50', '#D9822B', '#FAF7F2']
        });
      } catch (e) {
        // fallback if canvas not available
      }

      const randomCode = `RES #${Math.floor(1000 + Math.random() * 9000)}-${archetype.id === 'fine-dining' ? 'LUM' : archetype.id === 'wellness-studio' ? 'SNC' : 'ATL'}`;

      const newReservation: ConfirmedReservation = {
        id: `res-${Date.now()}`,
        code: randomCode,
        archetypeId: archetype.id,
        dateStr: selectedDate,
        timeStr: selectedTimeSlot.timeStr,
        partySize,
        visitStyle,
        spot: selectedSpot,
        guestName,
        guestEmail: 'alex.m@concierge-reserve.io',
        guestPhone,
        hospitalityNotes: selectedNotes,
        addOns: selectedAddOnIds,
        depositTotal,
        depositPaid: true,
        isWeatherContingencyCovered: !!selectedSpot.isWeatherContingency,
        indoorBackupTable: selectedSpot.indoorBackupSpotId,
        status: 'confirmed',
        graceWindowMinutes: 10,
        estimatedTurnTimeMinutes: visitStyle === 'express' ? 45 : visitStyle === 'classic' ? 90 : 150,
        createdAt: new Date().toISOString(),
        qrCodeData: `AURA:${randomCode}:${selectedSpot.code}`,
        pacingBucketId: selectedTimeSlot.id,
      };

      onConfirmBooking(newReservation);
      setIsSubmitting(false);
    }, 400);
  };

  // Formatter for poll timer
  const formatPollTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // If a reservation is confirmed, render the 3D Tactile Confirmed Pass!
  if (confirmedReservation) {
    return (
      <DigitalReservationPass
        reservation={confirmedReservation}
        onModifyReservation={onModifyReservation}
        onOpenSwapModal={onOpenSwapModal}
        onReleaseToWaitlist={onReleaseToWaitlist}
      />
    );
  }

  return (
    <div className="w-full bg-white dark:bg-[#1B1F24] rounded-2xl border border-stone-800/8 dark:border-white/8 shadow-concierge dark:shadow-concierge-dark p-6 sm:p-7 relative transition-all duration-300">
      
      {/* 1. Live Selection Summary Header */}
      <div className="border-b border-stone-800/8 dark:border-white/8 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-widest font-mono text-[#C85A32] font-bold">
            CONCIERGE DOCKET
          </span>
          <span className="text-[11px] font-mono text-[#828B86]">
            IMMERSIVE CHECKOUT
          </span>
        </div>

        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#18201C] dark:text-[#F6F4F0]">
            <Calendar className="w-4 h-4 text-[#C85A32]" />
            <span className="font-mono">
              {selectedTimeSlot ? selectedTimeSlot.timeStr : 'Select a Time Above'}
            </span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="font-sans font-medium text-xs text-[#525B56] dark:text-[#A0A8A3]">
              {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#1E6F50] dark:text-[#2CA376] font-mono font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>
              {selectedSpot ? `${selectedSpot.code} — ${selectedSpot.name}` : 'Click any table/station on the floorplan'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 15-Minute "Text the Group" Soft Hold & Live Poll Trigger */}
      <div className="mb-5 p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#15181C] border border-stone-800/6 dark:border-white/6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase text-[#828B86] flex items-center gap-1 font-semibold">
            <Lock className="w-3.5 h-3.5 text-[#D9822B]" />
            Group Consensus Hold
          </span>
          {isGroupPollActive && (
            <span className="text-xs font-mono font-bold text-[#D9822B] bg-[#D9822B]/10 px-2 py-0.5 rounded-full animate-pulse">
              ⏱ {formatPollTimer(groupPollSecondsRemaining)} LEFT
            </span>
          )}
        </div>

        <p className="text-[11px] text-[#525B56] dark:text-[#A0A8A3] mb-2.5">
          Lock this exact spot for 15 minutes. Send a poll link to your friends so they can confirm and log dietary preferences.
        </p>

        <button
          onClick={onInitiateGroupPoll}
          disabled={!selectedTimeSlot || !selectedSpot}
          className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all ${
            isGroupPollActive
              ? 'bg-[#D9822B] text-white shadow-sm'
              : 'bg-white dark:bg-[#1B1F24] border border-stone-800/10 dark:border-white/10 text-[#525B56] dark:text-[#A0A8A3] hover:text-[#D9822B] hover:border-[#D9822B]/40 active:scale-98'
          } disabled:opacity-40 disabled:pointer-events-none`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>
            {isGroupPollActive
              ? `Poll Active (${formatPollTimer(groupPollSecondsRemaining)}) — View Responses`
              : `🔒 Hold Slot for 15m & Poll Friends`}
          </span>
        </button>
      </div>

      {/* 3. "Make It Effortless" Hospitality Micro-Prompts */}
      <div className="mb-5">
        <span className="text-xs font-mono uppercase tracking-wider text-[#828B86] font-semibold block mb-2">
          Hospitality Micro-Prompts (Brief the Host)
        </span>

        {/* Occasions */}
        <div className="mb-2">
          <span className="text-[10px] text-[#828B86] block mb-1">Occasion &amp; Tone:</span>
          <div className="flex flex-wrap gap-1.5">
            {archetype.hospitalityPrompts.occasions.map((occ) => {
              const active = selectedNotes.includes(occ.label);
              return (
                <button
                  key={occ.id}
                  onClick={() => toggleNote(occ.label)}
                  title={occ.prompt}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-[#18201C] text-white dark:bg-white dark:text-[#18201C] shadow-sm'
                      : 'bg-[#FAF7F2] dark:bg-[#15181C] text-[#525B56] dark:text-[#A0A8A3] hover:text-[#18201C] dark:hover:text-[#F6F4F0]'
                  }`}
                >
                  {occ.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comfort & Access */}
        <div>
          <span className="text-[10px] text-[#828B86] block mb-1">Comfort &amp; Access:</span>
          <div className="flex flex-wrap gap-1.5">
            {archetype.hospitalityPrompts.comforts.map((comf) => {
              const active = selectedNotes.includes(comf.label);
              return (
                <button
                  key={comf.id}
                  onClick={() => toggleNote(comf.label)}
                  title={comf.prompt}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-[#18201C] text-white dark:bg-white dark:text-[#18201C] shadow-sm'
                      : 'bg-[#FAF7F2] dark:bg-[#15181C] text-[#525B56] dark:text-[#A0A8A3] hover:text-[#18201C] dark:hover:text-[#F6F4F0]'
                  }`}
                >
                  {comf.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Curated Experience Add-Ons */}
      <div className="mb-5">
        <span className="text-xs font-mono uppercase tracking-wider text-[#828B86] font-semibold block mb-2">
          Curated Add-Ons &amp; Enhancements
        </span>
        <div className="space-y-2">
          {archetype.curatedAddOns.map((addon) => {
            const isAdded = selectedAddOnIds.includes(addon.id);
            return (
              <div
                key={addon.id}
                onClick={() => toggleAddOn(addon.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isAdded
                    ? 'bg-[#C85A32]/5 border-[#C85A32]/40 dark:bg-[#C85A32]/10'
                    : 'bg-[#FAF7F2] dark:bg-[#15181C] border-stone-800/6 dark:border-white/6 hover:border-stone-800/20'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#18201C] dark:text-[#F6F4F0]">
                      {addon.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#C85A32] font-semibold">
                      +${addon.price}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#525B56] dark:text-[#A0A8A3] line-clamp-1">
                    {addon.description}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                  isAdded ? 'bg-[#C85A32] border-[#C85A32] text-white' : 'border-stone-400 dark:border-stone-600'
                }`}>
                  {isAdded && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Split-Deposit & Group Tab Pre-Auth Toggle */}
      <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#15181C] border border-stone-800/6 dark:border-white/6 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#18201C] dark:text-[#F6F4F0] block">
              Split-Deposit / Group Tab
            </span>
            <span className="text-[11px] text-[#828B86]">
              ${perPersonSplit} / person ({partySize} shares)
            </span>
          </div>

          <button
            onClick={() => setEnableSplitDeposit(!enableSplitDeposit)}
            className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
              enableSplitDeposit ? 'bg-[#1E6F50]' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              enableSplitDeposit ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Perforated Action Footer & Transparent Policies */}
      <div className="pt-4 border-t border-dashed border-stone-800/15 dark:border-white/15">
        
        {/* Deposit Summary & Policy */}
        <div className="flex items-center justify-between text-xs text-[#525B56] dark:text-[#A0A8A3] mb-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#1E6F50]" />
            Free change / swap up to 2h prior
          </span>
          <span className="font-mono font-bold text-sm text-[#18201C] dark:text-[#F6F4F0]">
            ${depositTotal} Total
          </span>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedTimeSlot || !selectedSpot || isSubmitting}
          className="w-full h-13 py-3 px-4 rounded-xl bg-[#C85A32] hover:bg-[#B24E2A] text-white font-serif text-base font-semibold shadow-lg shadow-[#C85A32]/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-40 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <span className="font-sans text-xs">Securing Table &amp; Generating Pass...</span>
          ) : (
            <>
              <span>Confirm Reservation • Instant Pass</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-[#828B86] mt-2 font-mono">
          $0 Booking Fee • 100% credited to your venue tab
        </p>
      </div>

    </div>
  );
};
