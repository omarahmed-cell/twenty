import { getCalendarEventDurationLabel } from '@/activities/calendar/utils/getCalendarEventDurationLabel';

describe('getCalendarEventDurationLabel', () => {
  it('should show minutes for a meeting under an hour', () => {
    expect(
      getCalendarEventDurationLabel({
        startsAt: new Date('2026-10-28T10:00:00Z'),
        endsAt: new Date('2026-10-28T10:45:00Z'),
      }),
    ).toBe('45 min');
  });

  it('should show hours and minutes', () => {
    expect(
      getCalendarEventDurationLabel({
        startsAt: new Date('2026-10-28T10:00:00Z'),
        endsAt: new Date('2026-10-28T11:30:00Z'),
      }),
    ).toBe('1 h 30 min');
  });

  it('should show whole hours without minutes', () => {
    expect(
      getCalendarEventDurationLabel({
        startsAt: new Date('2026-10-28T10:00:00Z'),
        endsAt: new Date('2026-10-28T12:00:00Z'),
      }),
    ).toBe('2 h');
  });

  it('should return nothing when the meeting has no length', () => {
    expect(
      getCalendarEventDurationLabel({
        startsAt: new Date('2026-10-28T10:00:00Z'),
        endsAt: new Date('2026-10-28T10:00:00Z'),
      }),
    ).toBeUndefined();
  });
});
