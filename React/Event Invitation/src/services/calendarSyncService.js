export function downloadICS(event) {
  // Format dates for .ics: YYYYMMDDTHHMMSSZ
  const startDateStr = '20261114T233000Z'; // Nov 14, 2026 4:30 PM PST is 23:30 UTC
  const endDateStr = '20261115T070000Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Event Keepsake Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:invitation-${Date.now()}@eventkeepsake.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${startDateStr}`,
    `DTEND:${endDateStr}`,
    `SUMMARY:${event.hero.title} — ${event.name}`,
    `DESCRIPTION:${event.hero.subtitle}\\nAttire: ${event.hero.attireSummary}\\nRSVP Confirmed.`,
    `LOCATION:${event.hero.venue}, ${event.hero.city}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.id}-invitation.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getGoogleCalendarUrl(event) {
  const title = encodeURIComponent(`${event.hero.title} (${event.shortName})`);
  const details = encodeURIComponent(
    `${event.hero.subtitle}\n\nSchedule: ${event.hero.time}\nAttire: ${event.hero.attireSummary}\nVenue: ${event.hero.venue}`
  );
  const location = encodeURIComponent(`${event.hero.venue}, ${event.hero.city}`);
  
  // Nov 14, 2026 16:30 PST to 23:00 PST (approx in UTC: 20261115T003000Z / 20261115T070000Z)
  const dates = '20261115T003000Z/20261115T070000Z';

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

