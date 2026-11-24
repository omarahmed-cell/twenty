const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// HubSpot-style compact age: now, 5m, 3h, 2d, 9d, then the date
export const formatRoboostTimeAgo = (iso: string, now: Date = new Date()) => {
  const elapsed = Math.max(0, now.getTime() - new Date(iso).getTime());

  if (elapsed < MINUTE) {
    return 'now';
  }
  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)}m`;
  }
  if (elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)}h`;
  }
  if (elapsed < 30 * DAY) {
    return `${Math.floor(elapsed / DAY)}d`;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
};
