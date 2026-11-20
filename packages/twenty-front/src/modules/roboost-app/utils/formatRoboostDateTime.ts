import { isNonEmptyString } from '@sniptt/guards';

const DAY_MONTH = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
});

const TIME = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const formatRoboostDateTime = (value: string | null | undefined) => {
  if (!isNonEmptyString(value)) {
    return '';
  }
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ''
    : `${DAY_MONTH.format(date)} · ${TIME.format(date)}`;
};
