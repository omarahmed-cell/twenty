import { isNonEmptyString } from '@sniptt/guards';

const DAY_MONTH_YEAR = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const formatRoboostDate = (value: string | null | undefined) => {
  if (!isNonEmptyString(value)) {
    return '—';
  }
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : DAY_MONTH_YEAR.format(date);
};
