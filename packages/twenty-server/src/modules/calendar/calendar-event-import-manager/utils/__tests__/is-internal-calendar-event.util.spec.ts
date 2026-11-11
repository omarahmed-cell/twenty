import { isInternalCalendarEvent } from 'src/modules/calendar/calendar-event-import-manager/utils/is-internal-calendar-event.util';
import { buildFetchedCalendarEvent } from 'src/modules/calendar/calendar-event-import-manager/utils/__tests__/build-fetched-calendar-event.test-util';

const buildEventWithAttendees = (handles: string[], organizerHandle = '') =>
  buildFetchedCalendarEvent({
    organizerHandle,
    participants: handles.map((handle) => ({
      handle,
      displayName: handle,
      responseStatus: 'accepted',
      isOrganizer: false,
    })),
  });

describe('isInternalCalendarEvent', () => {
  const channelHandles = ['me@acme.com'];

  it('should flag events where every attendee shares the channel domain', () => {
    expect(
      isInternalCalendarEvent(
        buildEventWithAttendees(['me@acme.com', 'Teammate@ACME.com']),
        channelHandles,
      ),
    ).toBe(true);
  });

  it('should keep events with an external attendee or organizer', () => {
    expect(
      isInternalCalendarEvent(
        buildEventWithAttendees(['me@acme.com', 'client@partner.io']),
        channelHandles,
      ),
    ).toBe(false);
    expect(
      isInternalCalendarEvent(
        buildEventWithAttendees(['me@acme.com'], 'client@partner.io'),
        channelHandles,
      ),
    ).toBe(false);
  });

  it('should ignore rooms and shared calendars invited as attendees', () => {
    expect(
      isInternalCalendarEvent(
        buildEventWithAttendees([
          'me@acme.com',
          'c_123@resource.calendar.google.com',
        ]),
        channelHandles,
      ),
    ).toBe(true);
  });

  it('should treat the channel aliases as internal', () => {
    expect(
      isInternalCalendarEvent(buildEventWithAttendees(['me@acme.io']), [
        'me@acme.com',
        'me@acme.io',
      ]),
    ).toBe(true);
  });

  it('should never flag events on a personal email provider account', () => {
    expect(
      isInternalCalendarEvent(buildEventWithAttendees(['friend@gmail.com']), [
        'me@gmail.com',
      ]),
    ).toBe(false);
  });
});
