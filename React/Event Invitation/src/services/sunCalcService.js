export function getGuestTimezoneContext(venueTimezone = 'America/Los_Angeles') {
  let userTz = 'UTC';
  try {
    userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  } catch (e) {
    userTz = 'America/Los_Angeles';
  }

  const isDifferent = userTz !== venueTimezone;

  return {
    userTimezone: userTz,
    venueTimezone,
    isDifferent,
    badgeText: isDifferent ? `Venue Timezone: ${venueTimezone} (Your clock: ${userTz})` : `Local Timezone (${venueTimezone})`
  };
}

export function getSunsetAdvisories(archetypeId) {
  switch (archetypeId) {
    case 'birthday':
      return {
        sunsetTime: '6:08 PM EST',
        goldenHour: '5:20 PM – 6:00 PM',
        blueHour: '6:15 PM – 6:45 PM',
        tip: 'Empire State lights illuminate at dusk (~6:35 PM). Perfect window for rooftop terrace polaroids!'
      };
    case 'conference':
      return {
        sunsetTime: '6:25 PM PST',
        goldenHour: '5:40 PM – 6:20 PM',
        blueHour: '6:30 PM – 7:00 PM',
        tip: 'Rooftop Vault reception opens right as natural light filters through the historic coin mint rotunda.'
      };
    case 'wedding':
    default:
      return {
        sunsetTime: '5:12 PM PST',
        goldenHour: '4:25 PM – 5:05 PM',
        blueHour: '5:15 PM – 5:40 PM',
        tip: 'Ceremony vows begin right at golden hour for soft amber light across the lower oak lawn.'
      };
  }
}

