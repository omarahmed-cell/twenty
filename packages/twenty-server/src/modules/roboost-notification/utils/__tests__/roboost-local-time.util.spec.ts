import {
  formatRoboostDueTime,
  getRoboostLocalClock,
} from 'src/modules/roboost-notification/utils/roboost-local-time.util';

describe('getRoboostLocalClock', () => {
  it('reads the wall clock in the member time zone', () => {
    const clock = getRoboostLocalClock(
      new Date('2026-11-24T06:05:00.000Z'),
      'Africa/Cairo',
    );

    expect(clock).toEqual({
      date: '2026-11-24',
      weekDay: 2,
      hour: 8,
      minute: 5,
    });
  });

  it('falls back to UTC for system or unknown zones', () => {
    expect(
      getRoboostLocalClock(new Date('2026-11-24T06:05:00.000Z'), 'system').hour,
    ).toBe(6);
    expect(
      getRoboostLocalClock(new Date('2026-11-24T06:05:00.000Z'), 'Not/AZone')
        .hour,
    ).toBe(6);
  });
});

describe('formatRoboostDueTime', () => {
  it('formats day and time in the zone', () => {
    expect(
      formatRoboostDueTime(
        new Date('2026-11-09T07:00:00.000Z'),
        'Africa/Cairo',
      ),
    ).toBe('9 Nov · 09:00');
  });
});
