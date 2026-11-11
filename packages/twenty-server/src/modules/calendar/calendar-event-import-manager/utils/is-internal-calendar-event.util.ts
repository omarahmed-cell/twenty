import { isNonEmptyString } from '@sniptt/guards';

import { type FetchedCalendarEvent } from 'src/modules/calendar/common/types/fetched-calendar-event.type';
import { getDomainFromEmail } from 'src/utils/get-domain-from-email';
import { isWorkEmail } from 'src/utils/is-work-email';

// Rooms and shared calendars are invited as attendees but are not people.
const GOOGLE_CALENDAR_RESOURCE_DOMAIN_SUFFIX = 'calendar.google.com';

export const isInternalCalendarEvent = (
  event: Pick<FetchedCalendarEvent, 'participants' | 'organizerHandle'>,
  calendarChannelHandles: string[],
): boolean => {
  const [primaryHandle] = calendarChannelHandles;

  if (!isNonEmptyString(primaryHandle) || !isWorkEmail(primaryHandle)) {
    return false;
  }

  const ownHandles = calendarChannelHandles.map((handle) =>
    handle.toLowerCase(),
  );
  const primaryDomain = getDomainFromEmail(primaryHandle)?.toLowerCase();

  const attendeeHandles = [
    event.organizerHandle,
    ...(event.participants ?? []).map((participant) => participant.handle),
  ]
    .filter(isNonEmptyString)
    .map((handle) => handle.toLowerCase())
    .filter(
      (handle) =>
        !getDomainFromEmail(handle)?.endsWith(
          GOOGLE_CALENDAR_RESOURCE_DOMAIN_SUFFIX,
        ),
    );

  return attendeeHandles.every(
    (handle) =>
      ownHandles.includes(handle) ||
      getDomainFromEmail(handle) === primaryDomain,
  );
};
