import { ArchetypeId, ConfirmedReservation, HostStandTableStatus, SoftHoldGroupPoll, Spot, TimeSlot, VisitStyle, WaitlistEntry } from '../types';
import { ARCHETYPES } from '../data/archetypes';

// Constants for Pacing Throttle
export const MAX_ARRIVALS_PER_15_MIN = 16; // Maximum guest arrivals kitchen can throttle smoothly

// Generate rich time slots between 10:00 AM and 10:30 PM (15-min increments)
export function generateBaseTimeSlots(archetypeId: ArchetypeId, visitStyle: VisitStyle): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = archetypeId === 'creative-padel' ? 9 : archetypeId === 'wellness-studio' ? 7 : 11;
  const endHour = archetypeId === 'creative-padel' ? 22 : archetypeId === 'wellness-studio' ? 20 : 22;

  // Peak times differ slightly per archetype
  const isPeak = (hour: number, minute: number) => {
    if (archetypeId === 'fine-dining') {
      return (hour === 19 || hour === 20) || (hour === 18 && minute >= 30);
    } else if (archetypeId === 'wellness-studio') {
      return (hour === 8 || hour === 9) || (hour === 17 || hour === 18);
    } else {
      return (hour === 18 || hour === 19 || hour === 20);
    }
  };

  const isSoldOutPrime = (hour: number, minute: number) => {
    // Specifically design 7:00 PM (19:00) as the prime sold-out slot to demonstrate the Smart Shift Nudge!
    if (archetypeId === 'fine-dining') {
      return hour === 19 && minute === 0;
    } else if (archetypeId === 'wellness-studio') {
      return hour === 18 && minute === 0;
    } else {
      return hour === 19 && minute === 0;
    }
  };

  const isGapExpressCandidate = (hour: number, minute: number) => {
    // A 45m or 60m gap between bookings that unlocks when 'express' visit style is chosen
    return (hour === 17 && minute === 45) || (hour === 20 && minute === 45) || (hour === 12 && minute === 45);
  };

  const totalSpotsInArchetype = ARCHETYPES.find(a => a.id === archetypeId)?.zones.reduce((acc, z) => acc + z.spots.length, 0) || 12;

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === endHour && minute > 30) continue;

      const militaryTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const timeStr = `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
      const minutesFromMidnight = hour * 60 + minute;

      // Determine Light Level & Crowd Energy
      let lightLevel: 'sunlit' | 'golden-hour' | 'candlelit' = 'sunlit';
      if (hour >= 17 && hour < 19) {
        lightLevel = 'golden-hour';
      } else if (hour >= 19 || hour < 6) {
        lightLevel = 'candlelit';
      }

      let crowdEnergy: 'calm' | 'brisk' | 'aperitivo' | 'prime-buzz' | 'winding-down' = 'calm';
      let ambientDb = 52;
      if (hour >= 11 && hour < 14) {
        crowdEnergy = 'brisk';
        ambientDb = 62;
      } else if (hour >= 16 && hour < 18) {
        crowdEnergy = 'aperitivo';
        ambientDb = 58;
      } else if (isPeak(hour, minute)) {
        crowdEnergy = 'prime-buzz';
        ambientDb = 72;
      } else if (hour >= 21) {
        crowdEnergy = 'winding-down';
        ambientDb = 55;
      }

      const soldOut = isSoldOutPrime(hour, minute);
      const isGap = isGapExpressCandidate(hour, minute);

      let status: TimeSlot['status'] = 'available';
      let arrivalLoad = Math.floor(Math.random() * 8) + 4; // Mock arrivals
      let openSpotsCount = Math.floor(totalSpotsInArchetype * 0.6);

      if (soldOut) {
        status = 'waitlist-only';
        arrivalLoad = MAX_ARRIVALS_PER_15_MIN;
        openSpotsCount = 0;
      } else if (isPeak(hour, minute)) {
        status = 'prime';
        arrivalLoad = 14;
        openSpotsCount = Math.max(1, Math.floor(totalSpotsInArchetype * 0.25));
      } else if (isGap) {
        if (visitStyle === 'express') {
          status = 'gap-express';
          openSpotsCount = 3;
        } else {
          // If unhurried or classic, this small gap cannot accommodate them!
          status = 'available';
          openSpotsCount = 1;
        }
      }

      // Configure Smart Nudge specifically for prime sold out slots
      let smartNudge;
      if (soldOut) {
        if (archetypeId === 'fine-dining') {
          smartNudge = {
            triggerIfBooked: true,
            reason: "7:00 PM Main Dining is full",
            suggestedAlternativeTime: "06:45 PM",
            alternativeSpotName: "Window Corner Banquette B04 or Patio Pergola P01",
            timeDelta: "Shift 15m earlier"
          };
        } else if (archetypeId === 'wellness-studio') {
          smartNudge = {
            triggerIfBooked: true,
            reason: "6:00 PM Peak Reformer Class is full",
            suggestedAlternativeTime: "05:45 PM",
            alternativeSpotName: "Front-Row Reformer 03 (Sophia) or Infrared Thermal Pod",
            timeDelta: "Shift 15m earlier"
          };
        } else {
          smartNudge = {
            triggerIfBooked: true,
            reason: "7:00 PM Stadium Padel Court is booked",
            suggestedAlternativeTime: "06:45 PM",
            alternativeSpotName: "Panoramic Court 02 or White Cyc Studio A",
            timeDelta: "Shift 15m earlier"
          };
        }
      }

      slots.push({
        id: `slot-${minutesFromMidnight}`,
        timeStr,
        militaryTime,
        minutesFromMidnight,
        status,
        crowdEnergy,
        lightLevel,
        ambientDb,
        openSpotsCount,
        totalSpotsCount: totalSpotsInArchetype,
        arrivalLoad,
        maxPacingArrivals: MAX_ARRIVALS_PER_15_MIN,
        smartNudge,
        waitlistOdds: soldOut ? 82 : undefined,
        waitlistQueuePosition: soldOut ? 2 : undefined
      });
    }
  }

  return slots;
}

// Daylight & Evening Seat Preview Mapper
export function getLightingAmbiance(militaryTimeStr: string, manualSliderVal?: number) {
  let minutes = 19 * 60; // default 7:00 PM
  if (manualSliderVal !== undefined) {
    minutes = manualSliderVal;
  } else {
    const [h, m] = militaryTimeStr.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) minutes = h * 60 + m;
  }

  // Sunset is around 17:45 (5:45 PM)
  const sunsetMinutes = 17 * 60 + 45;
  const isNight = minutes >= 19 * 60 || minutes < 6 * 60;
  const isGoldenHour = minutes >= 16 * 60 + 30 && minutes < 19 * 60;
  const isDaylight = minutes >= 7 * 60 && minutes < 16 * 60 + 30;

  // Calculate sun angle (-45deg to +45deg)
  const progressOfDay = Math.max(0, Math.min(1, (minutes - 7 * 60) / (12 * 60)));
  const sunAngleDeg = (progressOfDay - 0.5) * 90;

  // Ambient lighting styles
  let floorplanBg = '#F1ECE3';
  let lampGlowIntensity = 0.15;
  let naturalLightOpacity = 0.9;
  let label = '☀️ Natural Daylight';

  if (isNight) {
    floorplanBg = '#15181C';
    lampGlowIntensity = 0.95;
    naturalLightOpacity = 0.05;
    label = '🕯️ Candlelit Lounge Glow';
  } else if (isGoldenHour) {
    floorplanBg = '#EFE6D8';
    lampGlowIntensity = 0.55;
    naturalLightOpacity = 0.7;
    label = '🌅 Golden Hour Amber';
  }

  return {
    isNight,
    isGoldenHour,
    isDaylight,
    sunAngleDeg,
    floorplanBg,
    lampGlowIntensity,
    naturalLightOpacity,
    label,
    currentMinutes: minutes
  };
}

// Ephemeral Soft Hold & Group Consensus State Machine
export function createGroupPollSoftHold(
  spot: Spot,
  slot: TimeSlot,
  dateStr: string,
  partySize: number,
  organizerName: string = 'Alex M.'
): SoftHoldGroupPoll {
  const ttlSeconds = 900; // 15:00 minutes exactly
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const holdId = `HOLD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const splitAmount = spot.priceDeposit ? Math.round(spot.priceDeposit / Math.max(1, partySize)) : 0;

  return {
    holdId,
    spotId: spot.id,
    slotId: slot.id,
    timeStr: slot.timeStr,
    dateStr,
    expiresAt,
    secondsRemaining: ttlSeconds,
    totalDurationSeconds: ttlSeconds,
    shareableUrl: `https://aura-reserve.club/poll/${holdId}?ref=invite`,
    partySize,
    participants: [
      {
        id: 'usr-organizer',
        name: organizerName,
        status: 'organizer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        tabPaid: true,
        splitAmount
      },
      {
        id: 'usr-2',
        name: 'Sarah K.',
        status: 'joined',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
        dietaryNotes: 'Gluten-Free / Celiac Protocol',
        tabPaid: true,
        splitAmount
      },
      {
        id: 'usr-3',
        name: 'David L.',
        status: 'joined',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        dietaryNotes: 'Zero alcohol pairing',
        tabPaid: false,
        splitAmount
      },
      {
        id: 'usr-4',
        name: 'Elena R.',
        status: 'pending',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        tabPaid: false,
        splitAmount
      }
    ]
  };
}

// Grace Window Adjuster & Downstream Cushion Engine
export function calculateGraceWindowBuffer(
  reservation: ConfirmedReservation,
  minutesRequested: number = 10
): {
  approved: boolean;
  grantedMinutes: number;
  nextReservationAt: string;
  downstreamCushionMinutes: number;
  message: string;
} {
  // Simulates downstream table turn checks:
  // If reservation is 6:45 PM for 90m, standard turn ends at 8:15 PM.
  // Next booking on that table is at 8:30 PM, giving 15m natural buffer.
  const downstreamCushion = 15; // minutes of buffer before next guest arrives
  
  if (minutesRequested <= downstreamCushion) {
    return {
      approved: true,
      grantedMinutes: minutesRequested,
      nextReservationAt: '08:30 PM',
      downstreamCushionMinutes: downstreamCushion - minutesRequested,
      message: `Table held with grace protection. Your table will be held until ${getAddedTime(reservation.timeStr, minutesRequested)}. Kitchen pacing notified.`
    };
  } else {
    return {
      approved: false,
      grantedMinutes: downstreamCushion,
      nextReservationAt: '08:30 PM',
      downstreamCushionMinutes: 0,
      message: `Maximum cushion is ${downstreamCushion} mins to protect the 8:30 PM seating. We've locked in ${downstreamCushion} minutes!`
    };
  }
}

function getAddedTime(timeStr: string, addMinutes: number): string {
  // Simple helper to add minutes to "06:45 PM"
  const [timePart, period] = timeStr.split(' ');
  const [h, m] = timePart.split(':').map(Number);
  let totalMin = (h % 12) * 60 + m + (period === 'PM' ? 12 * 60 : 0) + addMinutes;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  const newPeriod = newH >= 12 ? 'PM' : 'AM';
  const displayH = newH % 12 === 0 ? 12 : newH % 12;
  return `${displayH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')} ${newPeriod}`;
}

// Mock Table Statuses for the Host Stand Waterfall Lens
export function generateHostStandStatuses(archetypeId: ArchetypeId): HostStandTableStatus[] {
  if (archetypeId === 'fine-dining') {
    return [
      {
        tableId: 'b-01',
        tableCode: 'BOOTH 01',
        currentPartyName: 'Vance Party',
        partySize: 2,
        seatedAt: '06:15 PM',
        expectedTurnTimeMinutes: 90,
        elapsedMinutes: 45,
        progressPercent: 50,
        status: 'mains-in-progress',
        isVip: true,
        alerts: ['VIP 7th visit', 'Prefers Meyer lemon in sparkling']
      },
      {
        tableId: 'b-02',
        tableCode: 'BOOTH 02',
        currentPartyName: 'Kowalski',
        partySize: 4,
        seatedAt: '05:45 PM',
        expectedTurnTimeMinutes: 90,
        elapsedMinutes: 75,
        progressPercent: 83,
        status: 'dessert-check',
        alerts: ['Table turn expected in 15 mins']
      },
      {
        tableId: 'b-04',
        tableCode: 'BOOTH 04',
        currentPartyName: 'Held for Incoming Guest',
        partySize: 2,
        expectedTurnTimeMinutes: 90,
        elapsedMinutes: 0,
        progressPercent: 0,
        status: 'reserved-imminent',
        alerts: ['Selected on Floorplan • Arrival 06:45 PM']
      },
      {
        tableId: 'c-01',
        tableCode: 'COUNTER 01-02',
        currentPartyName: 'Soren & Guest',
        partySize: 2,
        seatedAt: '06:30 PM',
        expectedTurnTimeMinutes: 75,
        elapsedMinutes: 30,
        progressPercent: 40,
        status: 'mains-in-progress',
        alerts: ['Chef Tasting Course 3 of 7']
      },
      {
        tableId: 'p-01',
        tableCode: 'PATIO 01',
        currentPartyName: 'Open / Weather-Safe',
        partySize: 2,
        expectedTurnTimeMinutes: 90,
        elapsedMinutes: 0,
        progressPercent: 0,
        status: 'vacant',
        alerts: ['Patio backup linked to Booth 02']
      }
    ];
  } else if (archetypeId === 'wellness-studio') {
    return [
      {
        tableId: 'r-01',
        tableCode: 'REFORMER 01',
        currentPartyName: 'Taylor W.',
        partySize: 1,
        expectedTurnTimeMinutes: 50,
        elapsedMinutes: 35,
        progressPercent: 70,
        status: 'mains-in-progress',
        alerts: ['Spring tension: Heavy']
      },
      {
        tableId: 'r-03',
        tableCode: 'REFORMER 03',
        currentPartyName: 'Maya Chen (Streak 19)',
        partySize: 1,
        expectedTurnTimeMinutes: 50,
        elapsedMinutes: 35,
        progressPercent: 70,
        status: 'mains-in-progress',
        isVip: true,
        alerts: ['VIP 19-class streak', 'Sauna booked post-class']
      },
      {
        tableId: 'pod-a',
        tableCode: 'POD ALPHA',
        currentPartyName: 'Clean & Eucalyptus Mist',
        partySize: 1,
        expectedTurnTimeMinutes: 45,
        elapsedMinutes: 10,
        progressPercent: 22,
        status: 'seated-appetizers',
        alerts: ['158°F Active Cycle']
      }
    ];
  } else {
    return [
      {
        tableId: 'court-01',
        tableCode: 'COURT 01',
        currentPartyName: 'Baseline Squad (Marcus)',
        partySize: 4,
        seatedAt: '06:00 PM',
        expectedTurnTimeMinutes: 90,
        elapsedMinutes: 45,
        progressPercent: 50,
        status: 'mains-in-progress',
        isVip: true,
        alerts: ['4K Camera Recording active', 'Split tab paid 4/4']
      },
      {
        tableId: 'cyc-a',
        tableCode: 'CYC STUDIO A',
        currentPartyName: 'Vogue Editorial Team',
        partySize: 8,
        seatedAt: '03:00 PM',
        expectedTurnTimeMinutes: 240,
        elapsedMinutes: 180,
        progressPercent: 75,
        status: 'mains-in-progress',
        alerts: ['60A 3-phase load running', 'Wrap expected 07:00 PM']
      }
    ];
  }
}
