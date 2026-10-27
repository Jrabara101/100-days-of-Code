// Utility date helpers for Gantt and Timeline calculations

export function formatDateStr(date) {
  if (typeof date === 'string') return date.slice(0, 10);
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const parts = dateStr.slice(0, 10).split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

export function addDays(date, days) {
  const result = new Date(parseDate(date));
  result.setDate(result.getDate() + days);
  return result;
}

export function diffDays(dateA, dateB) {
  const d1 = parseDate(dateA);
  const d2 = parseDate(dateB);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function isWeekend(date) {
  const day = parseDate(date).getDay();
  return day === 0 || day === 6; // 0 = Sun, 6 = Sat
}

// Skips weekends when cascading forward
export function addWorkingDays(startDate, daysCount) {
  let current = parseDate(startDate);
  let added = 0;
  while (added < daysCount) {
    current = addDays(current, 1);
    if (!isWeekend(current)) {
      added++;
    }
  }
  return current;
}

export function formatShortDate(dateStr) {
  const d = parseDate(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function formatMonthYear(dateStr) {
  const d = parseDate(dateStr);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
