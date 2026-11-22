const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

// "8 days ago" or "in 14 hours", like the deal cards in the design
export const formatRoboostRelativeTime = (date: string, now: Date) => {
  const seconds = (new Date(date).getTime() - now.getTime()) / 1000;

  if (Number.isNaN(seconds)) {
    return '';
  }
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return formatter.format(Math.round(seconds / 60), 'minute');
};
