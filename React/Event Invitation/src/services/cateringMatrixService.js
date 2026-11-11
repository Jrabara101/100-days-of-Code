export function aggregateCateringMatrix(guestsList, subEventsList, currentGuestRsvp) {
  // Merge currentGuestRsvp if not already in list
  const allGuests = [...guestsList];
  
  if (currentGuestRsvp && currentGuestRsvp.primaryName) {
    const existingIndex = allGuests.findIndex(g => g.name === currentGuestRsvp.primaryName);
    const guestItem = {
      id: currentGuestRsvp.token || 'current',
      name: currentGuestRsvp.primaryName,
      archetype: currentGuestRsvp.archetypeTarget || 'wedding',
      tableId: currentGuestRsvp.assignedTableId || 'Unassigned',
      tableName: currentGuestRsvp.assignedTableName || 'Unassigned',
      seatNumber: currentGuestRsvp.seatNumber || null,
      dietary: (currentGuestRsvp.dietary || []).join(', ') || 'No Restrictions',
      status: currentGuestRsvp.status || 'confirmed',
      confirmedCount: currentGuestRsvp.confirmedGuests || 1,
      subEvents: currentGuestRsvp.subEventsConfirmed || ['main'],
      plusOne: currentGuestRsvp.hasPlusOneAllowed && currentGuestRsvp.plusOneName ? currentGuestRsvp.plusOneName : null
    };

    if (existingIndex >= 0) {
      allGuests[existingIndex] = { ...allGuests[existingIndex], ...guestItem };
    } else {
      allGuests.push(guestItem);
    }
  }

  // Dietary counts
  const dietaryCounts = {
    'Plant-Based / Vegan': 0,
    'Vegetarian': 0,
    'Gluten-Free': 0,
    'Nut Allergy': 0,
    'Zero-Proof Drinkers': 0,
    'No Restrictions': 0
  };

  const allergyAlerts = [];
  let totalHeadcount = 0;
  let unseatedCount = 0;

  // Sub-event counts
  const subEventCounts = {};
  if (subEventsList) {
    subEventsList.forEach(se => {
      subEventCounts[se.id] = 0;
    });
  }

  allGuests.forEach(guest => {
    const count = guest.confirmedCount || 1;
    totalHeadcount += count;

    const dietStr = (guest.dietary || '').toLowerCase();
    if (dietStr.includes('plant') || dietStr.includes('vegan')) {
      dietaryCounts['Plant-Based / Vegan'] += count;
    } else if (dietStr.includes('veg')) {
      dietaryCounts['Vegetarian'] += count;
    } else if (dietStr.includes('gluten')) {
      dietaryCounts['Gluten-Free'] += count;
    } else if (dietStr.includes('nut')) {
      dietaryCounts['Nut Allergy'] += count;
      allergyAlerts.push({
        guestName: guest.name,
        table: guest.tableName || 'Unassigned',
        alert: 'Severe Nut Allergy — Cross-contamination risk'
      });
    } else if (dietStr.includes('zero') || dietStr.includes('proof')) {
      dietaryCounts['Zero-Proof Drinkers'] += count;
    } else {
      dietaryCounts['No Restrictions'] += count;
    }

    if (!guest.tableId || guest.tableId === 'Unassigned') {
      unseatedCount += count;
    }

    // Sub events
    if (guest.subEvents && Array.isArray(guest.subEvents)) {
      guest.subEvents.forEach(seid => {
        if (subEventCounts[seid] !== undefined) {
          subEventCounts[seid] += count;
        } else {
          subEventCounts[seid] = count;
        }
      });
    }
  });

  return {
    totalHeadcount,
    unseatedCount,
    dietaryCounts,
    allergyAlerts,
    subEventCounts,
    totalGuestsProcessed: allGuests.length
  };
}

export function generateCateringCSV(guestsList, cateringSummary) {
  const headers = ['Guest Name', 'Table Assignment', 'Dietary Restrictions', 'Headcount', 'Sub-Events'];
  const rows = guestsList.map(g => [
    `"${g.name || 'Guest'}"`,
    `"${g.tableName || 'Unassigned'}"`,
    `"${g.dietary || 'None'}"`,
    g.confirmedCount || 1,
    `"${(g.subEvents || []).join('; ')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Catering_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

