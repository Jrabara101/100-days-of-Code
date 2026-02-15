const shortNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});

const fullNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

const minuteSecondFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

const dayHourFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  hour: '2-digit'
});

const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit'
});

export function formatMetric(value) {
  if (!Number.isFinite(value)) {
    return '-';
  }

  const absolute = Math.abs(value);
  if (absolute >= 10_000) {
    return shortNumberFormatter.format(value);
  }

  return fullNumberFormatter.format(value);
}

export function formatDateTime(timestamp) {
  return dateTimeFormatter.format(new Date(timestamp));
}

export function formatAxisTime(timestamp, spanMs) {
  if (spanMs > 3 * 24 * 60 * 60 * 1000) {
    return monthDayFormatter.format(new Date(timestamp));
  }

  if (spanMs > 6 * 60 * 60 * 1000) {
    return dayHourFormatter.format(new Date(timestamp));
  }

  return minuteSecondFormatter.format(new Date(timestamp));
}
