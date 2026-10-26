import { t } from '@lingui/core/macro';
import { differenceInMinutes } from 'date-fns';

export const getCalendarEventDurationLabel = ({
  startsAt,
  endsAt,
}: {
  startsAt: Date;
  endsAt: Date;
}): string | undefined => {
  const totalMinutes = differenceInMinutes(endsAt, startsAt);

  if (totalMinutes <= 0) {
    return undefined;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return t`${minutes} min`;
  }

  return minutes === 0 ? t`${hours} h` : t`${hours} h ${minutes} min`;
};
