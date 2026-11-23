import {
  addDaysToDateString,
  addMinutesToTimeString,
  getWeekdayOfDateString,
  toZonedDateString,
  toZonedTimeString,
  zonedDateTimeToIso,
} from '@/roboost-app/meeting/utils/zonedTime';

describe('zonedTime', () => {
  it('turns a Cairo wall-clock time into UTC', () => {
    expect(zonedDateTimeToIso('2026-11-24', '10:00', 'Africa/Cairo')).toBe(
      '2026-11-24T08:00:00.000Z',
    );
  });

  it('turns a Riyadh wall-clock time into UTC', () => {
    expect(zonedDateTimeToIso('2026-11-24', '09:30', 'Asia/Riyadh')).toBe(
      '2026-11-24T06:30:00.000Z',
    );
  });

  it('reads a UTC instant back in the chosen timezone', () => {
    const date = new Date('2026-11-24T22:30:00.000Z');

    expect(toZonedDateString(date, 'Asia/Dubai')).toBe('2026-11-25');
    expect(toZonedTimeString(date, 'Asia/Dubai')).toBe('02:30');
  });

  it('moves dates and times', () => {
    expect(addDaysToDateString('2026-11-30', 2)).toBe('2026-12-02');
    expect(getWeekdayOfDateString('2026-11-24')).toBe(2);
    expect(addMinutesToTimeString('23:45', 30)).toBe('23:59');
    expect(addMinutesToTimeString('09:00', 30)).toBe('09:30');
  });
});
