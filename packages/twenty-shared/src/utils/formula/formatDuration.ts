export const DURATION_UNITS = [
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
] as const;

export type DurationUnit = (typeof DURATION_UNITS)[number];

const MILLISECONDS_PER: Record<DurationUnit, number> = {
  days: 86_400_000,
  hours: 3_600_000,
  minutes: 60_000,
  seconds: 1000,
  milliseconds: 1,
};

const DISPLAY_PARTS: { suffix: string; milliseconds: number }[] = [
  { suffix: 'd', milliseconds: MILLISECONDS_PER.days },
  { suffix: 'h', milliseconds: MILLISECONDS_PER.hours },
  { suffix: 'm', milliseconds: MILLISECONDS_PER.minutes },
  { suffix: 's', milliseconds: MILLISECONDS_PER.seconds },
];

const MAX_DISPLAYED_PARTS = 2;

export const formatDuration = (
  value: number,
  unit: DurationUnit = 'days',
): string => {
  const totalMilliseconds = Math.round(
    Math.abs(value) * MILLISECONDS_PER[unit],
  );
  const sign = value < 0 ? '-' : '';

  if (totalMilliseconds === 0) {
    return '0';
  }

  if (totalMilliseconds < MILLISECONDS_PER.seconds) {
    return `${sign}${totalMilliseconds}ms`;
  }

  const parts: string[] = [];
  let remaining = totalMilliseconds;

  for (const { suffix, milliseconds } of DISPLAY_PARTS) {
    const count = Math.floor(remaining / milliseconds);

    if (count > 0 && parts.length < MAX_DISPLAYED_PARTS) {
      parts.push(`${count}${suffix}`);
    }

    remaining -= count * milliseconds;
  }

  return `${sign}${parts.join(' ')}`;
};
