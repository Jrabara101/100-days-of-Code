import { format, addMinutes, set, startOfDay, endOfDay, eachDayOfInterval, isSameDay, isToday, isTomorrow, isYesterday } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';


/**
 * Generate time slots for a specific day
 * Converts from host's timezone to visitor's timezone
 * 
 * @param {Date} date - The specific date selected
 * @param {string} hostTimeZone - Host's timezone (e.g., "America/New_York")
 * @param {string} visitorTimeZone - Visitor's timezone (e.g., "Asia/Manila")
 * @param {number} startHour - Start hour in host's timezone (default: 9)
 * @param {number} endHour - End hour in host's timezone (default: 17)
 * @param {number} slotDuration - Duration of each slot in minutes (default: 30)
 * @returns {Array} Array of slot objects with utc and display properties
 */
export const generateSlots = (
  date,
  hostTimeZone,
  visitorTimeZone,
  startHour = 9,
  endHour = 17,
  slotDuration = 30
) => {
  // 1. Create the start time in the HOST's zone
  const zonedDate = toZonedTime(date, hostTimeZone);
  const hostStart = set(zonedDate, {
    hours: startHour,
    minutes: 0,
    seconds: 0,
    milliseconds: 0
  });

  const slots = [];
  let current = new Date(hostStart.getTime());

  // 2. Loop through the day in specified increments
  while (current.getHours() < endHour || (current.getHours() === endHour && current.getMinutes() === 0)) {
    // 3. Convert that specific instant to the VISITOR'S zone
    const displayTime = formatInTimeZone(current, visitorTimeZone, 'h:mm a');
    const displayDate = formatInTimeZone(current, visitorTimeZone, 'EEE, MMM d');
    const displayDay = formatInTimeZone(current, visitorTimeZone, 'EEEE');
    
    // Get the hour in visitor's timezone for comparison
    const visitorHour = parseInt(formatInTimeZone(current, visitorTimeZone, 'H'));
    
    // Check if this is the next day in visitor's timezone (Edge of Day problem)
    const hostDay = formatInTimeZone(current, hostTimeZone, 'yyyy-MM-dd');
    const visitorDay = formatInTimeZone(current, visitorTimeZone, 'yyyy-MM-dd');
    const isNextDay = visitorDay > hostDay;
    const isPrevDay = visitorDay < hostDay;

    slots.push({
      utc: current.toISOString(), // Source of truth - always in UTC
      display: displayTime,      // What the user sees
      displayDate,
      displayDay,
      isNextDay,
      isPrevDay,
      hostTime: formatInTimeZone(current, hostTimeZone, 'h:mm a'),
      hostDate: formatInTimeZone(current, hostTimeZone, 'EEE, MMM d'),
    });

    current = addMinutes(current, slotDuration);
  }

  return slots;
};

/**
 * Get all available time zones using Intl API
 * @returns {Array} Array of timezone strings
 */
export const getTimeZones = () => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch (error) {
    // Fallback for older browsers
    return [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Singapore',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Australia/Sydney',
      'Pacific/Auckland',
      'UTC',
    ];
  }
};

/**
 * Convert a date from one timezone to another
 * @param {Date|string} date - The date to convert
 * @param {string} fromTimeZone - Source timezone
 * @param {string} toTimeZone - Target timezone
 * @returns {Date} The converted date
 */
export const convertTimeZone = (date, fromTimeZone, toTimeZone) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // First convert to the target timezone (creates a zoned date)
  const zonedDate = toZonedTime(dateObj, toTimeZone);
  
  // Then convert that zoned date to UTC
  return fromZonedTime(zonedDate, toTimeZone);
};

/**
 * Format a date in a specific timezone
 * @param {Date|string} date - The date to format
 * @param {string} timeZone - Target timezone
 * @param {string} formatString - Format string (date-fns format)
 * @returns {string} Formatted date string
 */
export const formatInZone = (date, timeZone, formatString = 'PPpp') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, timeZone, formatString);
};

/**
 * Get the current time in a specific timezone
 * @param {string} timeZone - Target timezone
 * @returns {Date} Current time in the specified timezone
 */
export const getCurrentTimeInZone = (timeZone) => {
  return toZonedTime(new Date(), timeZone);
};

/**
 * Check if a date is today, tomorrow, or yesterday in a specific timezone
 * @param {Date} date - The date to check
 * @param {string} timeZone - The timezone to check against
 * @returns {string} 'today', 'tomorrow', 'yesterday', or the date string
 */
export const getRelativeDay = (date, timeZone) => {
  const now = new Date();
  const zonedDate = toZonedTime(date, timeZone);
  const zonedNow = toZonedTime(now, timeZone);
  
  if (isSameDay(zonedDate, zonedNow)) return 'today';
  if (isTomorrow(zonedDate)) return 'tomorrow';
  if (isYesterday(zonedDate)) return 'yesterday';
  
  return formatInTimeZone(date, timeZone, 'EEEE, MMMM d, yyyy');
};

/**
 * Get the day difference between two timezones for a specific date
 * @param {Date} date - The date to check
 * @param {string} hostTimeZone - Host's timezone
 * @param {string} visitorTimeZone - Visitor's timezone
 * @returns {number} Day difference (positive if visitor is ahead)
 */
export const getDayDifference = (date, hostTimeZone, visitorTimeZone) => {
  const hostDay = parseInt(formatInTimeZone(date, hostTimeZone, 'd'));
  const visitorDay = parseInt(formatInTimeZone(date, visitorTimeZone, 'd'));
  
  // Get month and year to handle month boundaries
  const hostMonth = parseInt(formatInTimeZone(date, hostTimeZone, 'M'));
  const visitorMonth = parseInt(formatInTimeZone(date, visitorTimeZone, 'M'));
  const hostYear = parseInt(formatInTimeZone(date, hostTimeZone, 'yyyy'));
  const visitorYear = parseInt(formatInTimeZone(date, visitorTimeZone, 'yyyy'));
  
  // Calculate the actual day difference accounting for month/year
  const hostDateNum = hostYear * 10000 + hostMonth * 100 + hostDay;
  const visitorDateNum = visitorYear * 10000 + visitorMonth * 100 + visitorDay;
  
  return visitorDateNum - hostDateNum;
};

/**
 * Generate available days for the next N days
 * @param {number} days - Number of days to generate (default: 30)
 * @param {string} hostTimeZone - Host's timezone
 * @returns {Array} Array of available dates
 */
export const generateAvailableDays = (days = 30, hostTimeZone = 'UTC') => {
  const today = new Date();
  const start = startOfDay(today);
  const end = addMinutes(start, days * 24 * 60);
  
  const allDays = eachDayOfInterval({ start, end });
  
  // Filter out weekends (Saturday = 6, Sunday = 0)
  return allDays.filter(day => {
    const dayOfWeek = day.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  });
};

/**
 * Check if a time slot falls on a weekend in any timezone
 * @param {Date|string} date - The date to check
 * @param {string} timeZone - The timezone to check against
 * @returns {boolean} True if it's a weekend
 */
export const isWeekendInZone = (date, timeZone) => {
  const dayOfWeek = parseInt(formatInTimeZone(date, timeZone, 'i')); // 1 = Monday, 7 = Sunday
  return dayOfWeek >= 6;
};

export default {
  generateSlots,
  getTimeZones,
  convertTimeZone,
  formatInZone,
  getCurrentTimeInZone,
  getRelativeDay,
  getDayDifference,
  generateAvailableDays,
  isWeekendInZone,
};
