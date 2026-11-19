import React, { useState, useEffect, useMemo } from 'react';
import { ArchetypeId, ConfirmedReservation, SoftHoldGroupPoll, Spot, TimeSlot, VisitStyle } from './types';
import { ARCHETYPES } from './data/archetypes';
import { 
  generateBaseTimeSlots, 
  generateHostStandStatuses, 
  createGroupPollSoftHold 
} from './engine/reservationEngine';
import { Navbar } from './components/Navbar';
import { DiscoveryRibbon } from './components/DiscoveryRibbon';
import { AvailabilityWave } from './components/AvailabilityWave';
import { FloorplanStage } from './components/FloorplanStage';
import { ReservationComposer } from './components/ReservationComposer';
import { SeatSightlineModal } from './components/SeatSightlineModal';
import { GroupPollModal } from './components/GroupPollModal';
import { WaitlistModal } from './components/WaitlistModal';
import { HostStandWaterfallModal } from './components/HostStandWaterfallModal';
import { NoPenaltySwapModal } from './components/NoPenaltySwapModal';
import { Sparkles, Check, Info } from 'lucide-react';

export function App() {
  // Theme state: Daylight vs. Evening Lounge
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Synchronize dark mode class on document body/root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Active Archetype Preset
  const [currentArchetypeId, setCurrentArchetypeId] = useState<ArchetypeId>('fine-dining');
  const archetype = useMemo(() => {
    return ARCHETYPES.find(a => a.id === currentArchetypeId) || ARCHETYPES[0];
  }, [currentArchetypeId]);

  // Discovery Controls
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-19');
  const [partySize, setPartySize] = useState<number>(archetype.defaultPartySize);
  const [visitStyle, setVisitStyle] = useState<VisitStyle>('classic');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');

  // Time Slots generated reactively
  const timeSlots = useMemo(() => {
    return generateBaseTimeSlots(currentArchetypeId, visitStyle);
  }, [currentArchetypeId, visitStyle]);

  // Selected Time Slot & Spot
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(() => {
    return timeSlots.find(s => s.timeStr === '06:45 PM') || timeSlots[4] || null;
  });

  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(() => {
    return archetype.zones[0]?.spots[0] || null;
  });

  // Whenever archetype changes, reset default spot & party size
  useEffect(() => {
    setPartySize(archetype.defaultPartySize);
    setSelectedZoneId('all');
    const defaultSpot = archetype.zones[0]?.spots[0] || null;
    setSelectedSpot(defaultSpot);
    // Find matching 6:45 PM or suitable slot
    const defaultSlot = timeSlots.find(s => s.timeStr === '06:45 PM') || timeSlots[4] || null;
    setSelectedSlot(defaultSlot);
  }, [currentArchetypeId]);

  // Confirmed Reservation state
  const [confirmedReservation, setConfirmedReservation] = useState<ConfirmedReservation | null>(null);

  // Group Poll State Machine
  const [groupPoll, setGroupPoll] = useState<SoftHoldGroupPoll | null>(null);
  const [pollSecondsRemaining, setPollSecondsRemaining] = useState<number>(900); // 15 mins

  // Ticking Countdown for active group poll
  useEffect(() => {
    if (!groupPoll) return;
    const interval = setInterval(() => {
      setPollSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setGroupPoll(null);
          showToast('15-Minute hold expired. Table released back to pool.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [groupPoll]);

  // Modal Open States
  const [isSightlineModalOpen, setIsSightlineModalOpen] = useState<boolean>(false);
  const [inspectingSpot, setInspectingSpot] = useState<Spot | null>(null);
  const [isGroupPollModalOpen, setIsGroupPollModalOpen] = useState<boolean>(false);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState<boolean>(false);
  const [waitlistTargetSlot, setWaitlistTargetSlot] = useState<TimeSlot | null>(null);
  const [isHostStandModalOpen, setIsHostStandModalOpen] = useState<boolean>(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);

  // Toast notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initiate 15-minute group poll
  const handleInitiateGroupPoll = () => {
    if (!selectedSpot || !selectedSlot) return;
    const newPoll = createGroupPollSoftHold(
      selectedSpot,
      selectedSlot,
      selectedDate,
      partySize
    );
    setGroupPoll(newPoll);
    setPollSecondsRemaining(900);
    setIsGroupPollModalOpen(true);
    showToast(`Table locked for 15 minutes! Shareable poll link ready.`);
  };

  // Open Sightline Inspector
  const handleInspectSightline = (spot: Spot) => {
    setInspectingSpot(spot);
    setIsSightlineModalOpen(true);
  };

  // Open Waitlist Modal
  const handleOpenWaitlist = (slot: TimeSlot) => {
    setWaitlistTargetSlot(slot);
    setIsWaitlistModalOpen(true);
  };

  // Join Waitlist Handler
  const handleJoinWaitlist = (slotTime: string, autoClaim: boolean, windowStr: string) => {
    showToast(`Radar Active: #2 in line for ${slotTime} (${windowStr}). Auto-claim ${autoClaim ? 'Enabled' : 'Disabled'}.`);
  };

  // Slot Swap confirmation
  const handleConfirmSwap = (newTime: string) => {
    if (confirmedReservation) {
      setConfirmedReservation(prev => prev ? { ...prev, timeStr: newTime } : null);
      showToast(`Reservation successfully swapped to ${newTime} without penalty!`);
    }
  };

  // Release to waitlist
  const handleReleaseToWaitlistSuccess = () => {
    setConfirmedReservation(null);
    showToast('Table transferred to waitlist #2! Cancellation fees 100% waived.');
  };

  // Table statuses for Host Stand Waterfall Lens
  const tableStatuses = useMemo(() => {
    return generateHostStandStatuses(currentArchetypeId);
  }, [currentArchetypeId]);

  // Open spots count
  const totalOpenSpots = useMemo(() => {
    return archetype.zones.reduce((sum, z) => sum + z.spots.length, 0);
  }, [archetype]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0E1012] text-[#18201C] dark:text-[#F6F4F0] font-sans antialiased transition-colors duration-300">
      
      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#18201C] text-white dark:bg-white dark:text-[#18201C] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-mono animate-slide-up border border-stone-800/10">
          <Sparkles className="w-4 h-4 text-[#C85A32]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Top Navigation & Archetype Switcher */}
      <Navbar
        currentArchetypeId={currentArchetypeId}
        onSelectArchetype={(id) => {
          setCurrentArchetypeId(id);
          setConfirmedReservation(null);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenHostStand={() => setIsHostStandModalOpen(true)}
        hasActiveReservation={!!confirmedReservation}
        onViewActivePass={() => {
          // Scroll or focus on reservation pass
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
      />

      {/* Main Container Layout */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Discovery Ribbon: Date, Guests, Duration Pacer, Zone Filters */}
        <DiscoveryRibbon
          archetype={archetype}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          partySize={partySize}
          onUpdatePartySize={setPartySize}
          visitStyle={visitStyle}
          onSelectVisitStyle={(style) => {
            setVisitStyle(style);
            showToast(`Visit Style updated to ${style.toUpperCase()}. Tetris gap windows unlocked!`);
          }}
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
          totalOpenSpots={totalOpenSpots}
        />

        {/* 12-Column Asymmetric Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left 7 Columns: Spatial Discovery & Floorplan Stage */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 24-Hour Availability Wave Ribbon & Smart Shift Nudge */}
            <AvailabilityWave
              slots={timeSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              onOpenWaitlist={handleOpenWaitlist}
            />

            {/* Interactive Architectural Floorplan & Vibe Zone Explorer */}
            <FloorplanStage
              archetype={archetype}
              selectedZoneId={selectedZoneId}
              onSelectZone={setSelectedZoneId}
              selectedSpot={selectedSpot}
              onSelectSpot={setSelectedSpot}
              selectedSlot={selectedSlot}
              onInspectSightline={handleInspectSightline}
              heldSpotIds={groupPoll ? [groupPoll.spotId] : []}
            />

          </div>

          {/* Right 5 Columns (Sticky): The Live Concierge Ticket & 3D Pass */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <ReservationComposer
              archetype={archetype}
              selectedDate={selectedDate}
              selectedTimeSlot={selectedSlot}
              selectedSpot={selectedSpot}
              partySize={partySize}
              visitStyle={visitStyle}
              onInitiateGroupPoll={handleInitiateGroupPoll}
              isGroupPollActive={!!groupPoll}
              groupPollSecondsRemaining={pollSecondsRemaining}
              confirmedReservation={confirmedReservation}
              onConfirmBooking={(booking) => {
                setConfirmedReservation(booking);
                showToast(`Confirmed! Scannable Pass ${booking.code} generated.`);
              }}
              onModifyReservation={() => setConfirmedReservation(null)}
              onOpenSwapModal={() => setIsSwapModalOpen(true)}
              onReleaseToWaitlist={handleReleaseToWaitlistSuccess}
            />
          </div>

        </div>

      </main>

      {/* Seat Sightline Preview Modal */}
      <SeatSightlineModal
        spot={inspectingSpot}
        isOpen={isSightlineModalOpen}
        onClose={() => setIsSightlineModalOpen(false)}
        onConfirmSpot={(spot) => {
          setSelectedSpot(spot);
          showToast(`Spot ${spot.code} selected.`);
        }}
        isCurrentlySelected={selectedSpot?.id === inspectingSpot?.id}
      />

      {/* 15-Minute Group Poll & Soft Hold Modal */}
      <GroupPollModal
        isOpen={isGroupPollModalOpen}
        onClose={() => setIsGroupPollModalOpen(false)}
        groupPoll={groupPoll}
        secondsRemaining={pollSecondsRemaining}
        spot={selectedSpot}
        slot={selectedSlot}
        onFinalizeFromPoll={() => {
          if (selectedSpot && selectedSlot) {
            const randomCode = `RES #${Math.floor(1000 + Math.random() * 9000)}-${archetype.id === 'fine-dining' ? 'LUM' : archetype.id === 'wellness-studio' ? 'SNC' : 'ATL'}`;
            const confirmed: ConfirmedReservation = {
              id: `res-${Date.now()}`,
              code: randomCode,
              archetypeId: archetype.id,
              dateStr: selectedDate,
              timeStr: selectedSlot.timeStr,
              partySize,
              visitStyle,
              spot: selectedSpot,
              guestName: 'Alex Morgan',
              guestEmail: 'alex.m@concierge-reserve.io',
              guestPhone: '+1 (555) 382-9410',
              hospitalityNotes: ['Group Consensus Confirmed (4/4)', 'Celiac Protocol'],
              addOns: [],
              depositTotal: (selectedSpot.priceDeposit || 25) * partySize,
              depositPaid: true,
              isWeatherContingencyCovered: !!selectedSpot.isWeatherContingency,
              indoorBackupTable: selectedSpot.indoorBackupSpotId,
              status: 'confirmed',
              graceWindowMinutes: 10,
              estimatedTurnTimeMinutes: 90,
              createdAt: new Date().toISOString(),
              qrCodeData: `AURA:${randomCode}`,
              pacingBucketId: selectedSlot.id,
            };
            setConfirmedReservation(confirmed);
            setGroupPoll(null);
            showToast(`Group Poll Confirmed! Pass generated for all guests.`);
          }
        }}
      />

      {/* Predictive Waitlist Modal */}
      <WaitlistModal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        slot={waitlistTargetSlot}
        onJoinWaitlist={handleJoinWaitlist}
      />

      {/* Host Stand & Kitchen Waterfall Lens Modal */}
      <HostStandWaterfallModal
        isOpen={isHostStandModalOpen}
        onClose={() => setIsHostStandModalOpen(false)}
        archetype={archetype}
        timeSlots={timeSlots}
        tableStatuses={tableStatuses}
      />

      {/* "No-Penalty Swap" Marketplace Modal */}
      <NoPenaltySwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        reservation={confirmedReservation}
        onConfirmSwap={handleConfirmSwap}
        onReleaseToWaitlistSuccess={handleReleaseToWaitlistSuccess}
      />

    </div>
  );
}

export default App;
