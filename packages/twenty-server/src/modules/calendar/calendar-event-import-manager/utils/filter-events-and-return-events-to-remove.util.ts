import { filterOutBlocklistedEvents } from 'src/modules/calendar/calendar-event-import-manager/utils/filter-out-blocklisted-events.util';
import { isInternalCalendarEvent } from 'src/modules/calendar/calendar-event-import-manager/utils/is-internal-calendar-event.util';
import { type FetchedCalendarEvent } from 'src/modules/calendar/common/types/fetched-calendar-event.type';

export const filterEventsAndReturnEventsToRemove = (
  calendarChannelHandles: string[],
  events: FetchedCalendarEvent[],
  blocklist: string[],
  isInternalCalendarEventsImportEnabled = true,
): {
  filteredEvents: FetchedCalendarEvent[];
  eventsToRemove: FetchedCalendarEvent[];
} => {
  const filteredEvents = filterOutBlocklistedEvents(
    calendarChannelHandles,
    events,
    blocklist,
  );

  return filteredEvents.reduce(
    (
      acc: {
        filteredEvents: FetchedCalendarEvent[];
        eventsToRemove: FetchedCalendarEvent[];
      },
      event,
    ) => {
      const isExcludedInternalEvent =
        !isInternalCalendarEventsImportEnabled &&
        isInternalCalendarEvent(event, calendarChannelHandles);

      if (event.isCanceled || event.isPrivate || isExcludedInternalEvent) {
        acc.eventsToRemove.push(event);
      } else {
        acc.filteredEvents.push(event);
      }

      return acc;
    },
    {
      filteredEvents: [],
      eventsToRemove: [],
    },
  );
};
