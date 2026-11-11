import { isBeyondCalendarEventsImportHorizon } from 'src/modules/calendar/calendar-event-import-manager/utils/is-beyond-calendar-events-import-horizon.util';

const NOW = new Date('2026-11-11T00:00:00.000Z');

describe('isBeyondCalendarEventsImportHorizon', () => {
  it('should keep past events regardless of age', () => {
    expect(
      isBeyondCalendarEventsImportHorizon({
        startsAt: '2001-01-01T00:00:00.000Z',
        horizonDays: 365,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('should keep events inside the horizon', () => {
    expect(
      isBeyondCalendarEventsImportHorizon({
        startsAt: '2027-11-10T23:00:00.000Z',
        horizonDays: 365,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('should flag events past the horizon, including all-day dates', () => {
    expect(
      isBeyondCalendarEventsImportHorizon({
        startsAt: '2054-10-07T13:00:00.000Z',
        horizonDays: 365,
        now: NOW,
      }),
    ).toBe(true);
    expect(
      isBeyondCalendarEventsImportHorizon({
        startsAt: '2027-12-01',
        horizonDays: 365,
        now: NOW,
      }),
    ).toBe(true);
  });

  it('should not flag events with a missing or invalid start', () => {
    expect(
      isBeyondCalendarEventsImportHorizon({
        startsAt: undefined,
        horizonDays: 365,
        now: NOW,
      }),
    ).toBe(false);
    expect(
      isBeyondCalendarEventsImportHorizon({
        startsAt: 'not a date',
        horizonDays: 365,
        now: NOW,
      }),
    ).toBe(false);
  });
});
