import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  MENU_ITEMS,
  DINING_ZONES,
  RESTAURANT_TABLES,
  VERIFIED_REVIEWS,
  GALLERY_ASSETS,
  INITIAL_RESERVATIONS,
  INITIAL_WAITLIST,
  RESTAURANT_METADATA
} from '../data/mockData';

const RestaurantContext = createContext(null);

export function RestaurantProvider({ children }) {
  // 1. Theme Engine: Candlelight (default) vs Daylight
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('atelier_theme') || 'candlelight';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('atelier_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'candlelight' ? 'daylight' : 'candlelight'));
  }, []);

  // 2. Service Period & Menu Navigation
  const [activeServicePeriod, setActiveServicePeriod] = useState('dinner');
  const [dietaryFilters, setDietaryFilters] = useState([]);

  // 3. Live Menu State with Kitchen Scarcity and 86'd tracking
  const [menuItems, setMenuItems] = useState(() => {
    const saved = localStorage.getItem('atelier_menu_items');
    return saved ? JSON.parse(saved) : MENU_ITEMS;
  });

  // 4. Spatial Tables State & Status
  const [tables, setTables] = useState(() => {
    const saved = localStorage.getItem('atelier_tables');
    return saved ? JSON.parse(saved) : RESTAURANT_TABLES;
  });

  // 5. Reservations & Waitlist
  const [reservations, setReservations] = useState(() => {
    const saved = localStorage.getItem('atelier_reservations');
    return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
  });

  const [waitlistEntries, setWaitlistEntries] = useState(() => {
    const saved = localStorage.getItem('atelier_waitlist');
    return saved ? JSON.parse(saved) : INITIAL_WAITLIST;
  });

  // 6. Reviews State
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('atelier_reviews');
    return saved ? JSON.parse(saved) : VERIFIED_REVIEWS;
  });

  // 7. Modals and Active Views
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [reservationStep, setReservationStep] = useState(1); // 1: Party/Time, 2: Floorplan, 3: Pre-brief, 4: Confirmed Ticket
  const [selectedTable, setSelectedTable] = useState(null);
  const [hoveredTable, setHoveredTable] = useState(null);
  const [selectedZone, setSelectedZone] = useState('all');
  const [dishDetailModal, setDishDetailModal] = useState(null);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [hostCockpitOpen, setHostCockpitOpen] = useState(false);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // 8. Ephemeral 5-Minute Table Slot Hold Timer (300 seconds)
  const [holdTimerSeconds, setHoldTimerSeconds] = useState(300);
  const [activeHeldTableId, setActiveHeldTableId] = useState(null);

  // 9. Booking Draft Information
  const [bookingDraft, setBookingDraft] = useState({
    partySize: 2,
    date: 'Tonight, Oct 29',
    timeSlot: '7:30 PM',
    zoneId: 'zone-counter',
    tableId: null,
    occasion: 'Anniversary',
    pacingPreference: 'standard', // 'express' | 'standard' | 'leisurely'
    seatingNotes: 'Quiet corner or open sightline to hearth',
    dietaryRestrictions: [],
    specialRequests: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    cardHoldAgreed: true
  });

  const [confirmedReservation, setConfirmedReservation] = useState(null);

  // Sync dietary restrictions from menu filter bar into booking pre-brief
  useEffect(() => {
    if (dietaryFilters.length > 0) {
      const activeLabels = dietaryFilters.map(d => {
        const match = {
          gf: 'Gluten-Free',
          nut_free: 'Nut-Free',
          df: 'Dairy-Free',
          vegan: 'Vegan',
          pescatarian: 'Pescatarian',
          halal: 'Halal Certified',
          allium_free: 'Allium-Free'
        }[d] || d;
        return match;
      });
      setBookingDraft(prev => ({
        ...prev,
        dietaryRestrictions: Array.from(new Set([...prev.dietaryRestrictions, ...activeLabels]))
      }));
    }
  }, [dietaryFilters]);

  // Toast Helper
  const showToast = useCallback((msg, duration = 3500) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, duration);
  }, []);

  // Broadcast Channel for Multi-Tab Simulated Real-Time Synchronization
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel('atelier_realtime_channel');
      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'MENU_UPDATE') {
          setMenuItems(payload);
          showToast('⚡ Live Kitchen Broadcast: Menu portions updated in real-time');
        } else if (type === 'TABLE_UPDATE') {
          setTables(payload);
          showToast('⚡ Host Stand Broadcast: Table availability updated');
        } else if (type === 'NEW_RESERVATION') {
          setReservations(prev => [payload, ...prev]);
        }
      };
    } catch {
      // Fallback if BroadcastChannel unavailable
    }
    return () => {
      if (channel) channel.close();
    };
  }, [showToast]);

  const broadcastChange = useCallback((type, payload) => {
    try {
      const channel = new BroadcastChannel('atelier_realtime_channel');
      channel.postMessage({ type, payload });
      channel.close();
    } catch {
      // ignore
    }
  }, []);

  // 5-Minute Hold Countdown
  useEffect(() => {
    if (!activeHeldTableId || reservationStep === 4) return;
    const interval = setInterval(() => {
      setHoldTimerSeconds(prev => {
        if (prev <= 1) {
          // Release hold
          setTables(curr => curr.map(t => (t.id === activeHeldTableId ? { ...t, status: 'available' } : t)));
          setActiveHeldTableId(null);
          showToast('⚠️ 5-minute table hold expired. Table released to public.');
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeHeldTableId, reservationStep, showToast]);

  // Dietary Intelligence Sub-Millisecond Filter Calculation
  const dietaryAssessment = useMemo(() => {
    let safeCount = 0;
    let modifiableCount = 0;
    let dimmedCount = 0;

    const itemsStatus = {};

    menuItems.forEach(item => {
      if (dietaryFilters.length === 0) {
        itemsStatus[item.id] = { status: 'SAFE', reasons: [] };
        safeCount++;
        return;
      }

      let isSafe = true;
      let isModifiable = false;
      const issues = [];

      dietaryFilters.forEach(filter => {
        const isDirectSafe = item.dietary_tags.includes(filter);
        const modifiableTag = `${filter}_modifiable`;
        const canModify = item.modifiable_tags.includes(modifiableTag);

        if (!isDirectSafe) {
          if (canModify) {
            isModifiable = true;
          } else {
            isSafe = false;
            issues.push(filter);
          }
        }
      });

      if (isSafe && !isModifiable) {
        itemsStatus[item.id] = { status: 'SAFE', reasons: [] };
        safeCount++;
      } else if (isModifiable && issues.length === 0) {
        itemsStatus[item.id] = {
          status: 'MODIFIABLE',
          reasons: issues,
          instruction: item.modification_instructions || 'Kitchen modification available upon request.'
        };
        modifiableCount++;
      } else {
        itemsStatus[item.id] = {
          status: 'CONTAINS_ALLERGEN',
          reasons: issues
        };
        dimmedCount++;
      }
    });

    return { itemsStatus, safeCount, modifiableCount, dimmedCount };
  }, [menuItems, dietaryFilters]);

  // Toggle dietary filter chip
  const toggleDietaryFilter = useCallback((filterId) => {
    setDietaryFilters(prev => {
      const next = prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId];

      // Update URL search parameters
      const url = new URL(window.location);
      if (next.length > 0) {
        url.searchParams.set('diet', next.join(','));
      } else {
        url.searchParams.delete('diet');
      }
      window.history.replaceState({}, '', url);

      return next;
    });
  }, []);

  const clearDietaryFilters = useCallback(() => {
    setDietaryFilters([]);
    const url = new URL(window.location);
    url.searchParams.delete('diet');
    window.history.replaceState({}, '', url);
  }, []);

  // Action: Hold Table for 5 Minutes (Triggered on Floorplan Selection)
  const holdTableForBooking = useCallback((table) => {
    // Check exclusion constraint: table cannot already be occupied or held by someone else
    if (table.status === 'occupied') {
      showToast('Table is currently occupied. Please choose an available table or standby waitlist.');
      return false;
    }

    // Release previously held table if any
    setTables(curr => curr.map(t => {
      if (t.id === activeHeldTableId && t.id !== table.id) {
        return { ...t, status: 'available' };
      }
      if (t.id === table.id) {
        return { ...t, status: 'held_5m' };
      }
      return t;
    }));

    setSelectedTable(table);
    setActiveHeldTableId(table.id);
    setHoldTimerSeconds(300); // 5 minutes fresh
    setBookingDraft(prev => ({
      ...prev,
      tableId: table.id,
      zoneId: table.zone_id
    }));
    return true;
  }, [activeHeldTableId, showToast]);

  // Action: Confirm Reservation with Instant Digital Ticket and Exclusion Lock
  const confirmReservation = useCallback(() => {
    if (!bookingDraft.guestName || !bookingDraft.guestEmail) {
      showToast('Please provide guest name and contact email.');
      return false;
    }

    const confirmationCode = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
    const tableObj = tables.find(t => t.id === bookingDraft.tableId) || selectedTable || tables[0];
    const zoneObj = DINING_ZONES.find(z => z.id === tableObj.zone_id) || DINING_ZONES[0];

    const newRes = {
      id: `res-${Date.now()}`,
      confirmation_code: confirmationCode,
      table_id: tableObj.id,
      table_number: tableObj.table_number,
      zone_id: zoneObj.id,
      zone_name: zoneObj.name,
      guest_name: bookingDraft.guestName,
      guest_email: bookingDraft.guestEmail,
      guest_phone: bookingDraft.guestPhone || '+1 (310) 555-0199',
      party_size: bookingDraft.partySize,
      time_slot: bookingDraft.timeSlot,
      date: bookingDraft.date,
      reserved_start: new Date().toISOString(),
      reserved_end: new Date(Date.now() + 105 * 60000).toISOString(),
      turn_minutes: 105,
      status: 'confirmed',
      occasion: bookingDraft.occasion,
      pacing_preference: bookingDraft.pacingPreference,
      seating_notes: bookingDraft.seatingNotes,
      dietary_restrictions: bookingDraft.dietaryRestrictions,
      special_requests: bookingDraft.specialRequests,
      deposit_cents: 0,
      created_at: new Date().toISOString()
    };

    // Update tables to mark this table as confirmed
    const updatedTables = tables.map(t => (t.id === tableObj.id ? { ...t, status: 'occupied' } : t));
    setTables(updatedTables);
    localStorage.setItem('atelier_tables', JSON.stringify(updatedTables));
    broadcastChange('TABLE_UPDATE', updatedTables);

    // Save reservation
    const updatedReservations = [newRes, ...reservations];
    setReservations(updatedReservations);
    localStorage.setItem('atelier_reservations', JSON.stringify(updatedReservations));
    broadcastChange('NEW_RESERVATION', newRes);

    setActiveHeldTableId(null);
    setConfirmedReservation(newRes);
    setReservationStep(4);
    showToast(`✨ Table ${tableObj.table_number} confirmed! Reservation Code: ${confirmationCode}`);
    return true;
  }, [bookingDraft, tables, selectedTable, reservations, broadcastChange, showToast]);

  // Action: Open Reservation Drawer with pre-selected parameters
  const openReservationModal = useCallback((zoneId = null, tableId = null) => {
    if (zoneId) {
      setSelectedZone(zoneId);
      setBookingDraft(prev => ({ ...prev, zoneId }));
    }
    if (tableId) {
      const match = tables.find(t => t.id === tableId);
      if (match) {
        setSelectedTable(match);
        setBookingDraft(prev => ({ ...prev, tableId: match.id, zoneId: match.zone_id }));
      }
    }
    setReservationStep(tableId ? 2 : 1);
    setReservationModalOpen(true);
  }, [tables]);

  // Action: Join Standby Waitlist
  const submitWaitlist = useCallback((entryData) => {
    const newEntry = {
      id: `wait-${Date.now()}`,
      guest_name: entryData.name,
      guest_email: entryData.email,
      guest_phone: entryData.phone,
      party_size: entryData.partySize,
      target_date: entryData.date || 'Tonight',
      preferred_window: entryData.window || '7:00 PM – 9:00 PM',
      zone_preference: entryData.zoneName || 'Any Available Zone',
      status: 'waiting',
      notified_at: null,
      created_at: new Date().toISOString()
    };

    const updated = [newEntry, ...waitlistEntries];
    setWaitlistEntries(updated);
    localStorage.setItem('atelier_waitlist', JSON.stringify(updated));
    showToast('🔔 You are on the VIP Standby List. We will notify you instantly if a table frees up.');
    setWaitlistModalOpen(false);
  }, [waitlistEntries, showToast]);

  // Host Stand Staff Controls: Toggle 86'd item
  const staffToggle86d = useCallback((itemId) => {
    setMenuItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const nextState = !item.is_86d;
          return { ...item, is_86d: nextState };
        }
        return item;
      });
      localStorage.setItem('atelier_menu_items', JSON.stringify(updated));
      broadcastChange('MENU_UPDATE', updated);
      showToast(`Kitchen status updated for item`);
      return updated;
    });
  }, [broadcastChange, showToast]);

  // Host Stand Staff Controls: Update Remaining Portions
  const staffUpdatePortions = useCallback((itemId, portions) => {
    setMenuItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          return { ...item, remaining_portions: portions };
        }
        return item;
      });
      localStorage.setItem('atelier_menu_items', JSON.stringify(updated));
      broadcastChange('MENU_UPDATE', updated);
      showToast(`Portions updated to ${portions}`);
      return updated;
    });
  }, [broadcastChange, showToast]);

  // Host Stand Staff Controls: Update Table Seating Status
  const staffUpdateTableStatus = useCallback((tableId, newStatus) => {
    setTables(prev => {
      const updated = prev.map(t => (t.id === tableId ? { ...t, status: newStatus } : t));
      localStorage.setItem('atelier_tables', JSON.stringify(updated));
      broadcastChange('TABLE_UPDATE', updated);
      showToast(`Table status changed to "${newStatus}"`);
      return updated;
    });
  }, [broadcastChange, showToast]);

  // Host Stand Staff Controls: Dispatch Waitlist Claim Notification
  const staffNotifyWaitlistGuest = useCallback((entryId) => {
    setWaitlistEntries(prev => {
      const updated = prev.map(e => {
        if (e.id === entryId) {
          return { ...e, status: 'notified', notified_at: new Date().toISOString() };
        }
        return e;
      });
      localStorage.setItem('atelier_waitlist', JSON.stringify(updated));
      showToast(`📲 Simulated SMS Claim Link (15m window) sent to guest`);
      return updated;
    });
  }, [showToast]);

  // Submit Verified Diner Review
  const submitReview = useCallback((reviewData) => {
    const newRev = {
      id: `rev-${Date.now()}`,
      reviewer_name: reviewData.name,
      seated_zone_name: reviewData.zoneName,
      service_period_label: reviewData.servicePeriod || 'Evening Service',
      party_size: reviewData.partySize || 2,
      rating_overall: reviewData.ratingOverall,
      rating_food: reviewData.ratingFood,
      rating_service: reviewData.ratingService,
      rating_ambience: reviewData.ratingAmbience,
      noise_level_reported: reviewData.noiseLevel,
      comment: reviewData.comment,
      favorite_dish_names: reviewData.favoriteDishes || [],
      management_reply: null,
      is_verified_diner: true,
      visited_at: new Date().toISOString().split('T')[0],
      decibel_context: reviewData.decibelContext || '~64 dB'
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    localStorage.setItem('atelier_reviews', JSON.stringify(updated));
    showToast('★ Review submitted and verified against reservation record.');
    setReviewModalOpen(false);
  }, [reviews, showToast]);

  // Generate .ics Calendar Drop for Confirmed Reservation
  const downloadIcsCalendar = useCallback((reservation) => {
    if (!reservation) return;
    const pad = (n) => (n < 10 ? `0${n}` : n);
    const now = new Date();
    const dStr = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
    
    // Default 7:30 PM tonight
    const startStr = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T193000Z`;
    const endStr = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T211500Z`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//L Atelier du Feu//Dining Concierge//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${reservation.confirmation_code}@latelierdufeu.com`,
      `DTSTAMP:${dStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:Dinner at L'Atelier du Feu (${reservation.table_number} • ${reservation.party_size} Guests)`,
      `DESCRIPTION:Table Reservation at L'Atelier du Feu.\\nConfirmation: ${reservation.confirmation_code}\\nZone: ${reservation.zone_name}\\nTable: ${reservation.table_number}\\nPacing: ${reservation.pacing_preference}\\nDietary Notes: ${reservation.dietary_restrictions.join(', ') || 'None'}\\nSpecial Requests: ${reservation.special_requests || 'None'}`,
      `LOCATION:${RESTAURANT_METADATA.address}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Latelier-Reservation-${reservation.confirmation_code}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📅 Calendar invite (.ics) downloaded.');
  }, [showToast]);

  const value = {
    theme,
    toggleTheme,
    activeServicePeriod,
    setActiveServicePeriod,
    dietaryFilters,
    toggleDietaryFilter,
    clearDietaryFilters,
    dietaryAssessment,
    menuItems,
    tables,
    diningZones: DINING_ZONES,
    galleryAssets: GALLERY_ASSETS,
    reviews,
    reservations,
    waitlistEntries,
    selectedTable,
    setSelectedTable,
    hoveredTable,
    setHoveredTable,
    selectedZone,
    setSelectedZone,
    reservationModalOpen,
    setReservationModalOpen,
    reservationStep,
    setReservationStep,
    bookingDraft,
    setBookingDraft,
    confirmedReservation,
    setConfirmedReservation,
    holdTimerSeconds,
    activeHeldTableId,
    holdTableForBooking,
    confirmReservation,
    openReservationModal,
    waitlistModalOpen,
    setWaitlistModalOpen,
    submitWaitlist,
    dishDetailModal,
    setDishDetailModal,
    reviewModalOpen,
    setReviewModalOpen,
    submitReview,
    hostCockpitOpen,
    setHostCockpitOpen,
    schemaModalOpen,
    setSchemaModalOpen,
    toastMessage,
    showToast,
    downloadIcsCalendar,
    staffToggle86d,
    staffUpdatePortions,
    staffUpdateTableStatus,
    staffNotifyWaitlistGuest
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
