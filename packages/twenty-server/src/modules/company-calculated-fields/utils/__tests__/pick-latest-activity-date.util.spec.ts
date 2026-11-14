import { pickLatestActivityDate } from 'src/modules/company-calculated-fields/utils/pick-latest-activity-date.util';

const NOW = new Date('2026-11-14T12:00:00.000Z');

describe('pickLatestActivityDate', () => {
  it('picks the latest date across activity types', () => {
    expect(
      pickLatestActivityDate({
        now: NOW,
        candidates: [
          { activityType: 'call', date: '2026-10-01T09:00:00.000Z' },
          { activityType: 'note', date: '2026-11-02T09:00:00.000Z' },
          { activityType: 'email', date: new Date('2026-09-15T09:00:00.000Z') },
        ],
      }),
    ).toBe('2026-11-02T09:00:00.000Z');
  });

  it('ignores a meeting that has not started yet', () => {
    expect(
      pickLatestActivityDate({
        now: NOW,
        candidates: [
          { activityType: 'note', date: '2026-11-01T09:00:00.000Z' },
          {
            activityType: 'calendarEvent',
            date: '2026-11-20T09:00:00.000Z',
            countsOnlyOncePast: true,
          },
        ],
      }),
    ).toBe('2026-11-01T09:00:00.000Z');
  });

  it('counts a meeting once it has started', () => {
    expect(
      pickLatestActivityDate({
        now: NOW,
        candidates: [
          { activityType: 'note', date: '2026-11-01T09:00:00.000Z' },
          {
            activityType: 'calendarEvent',
            date: '2026-11-14T11:00:00.000Z',
            countsOnlyOncePast: true,
          },
        ],
      }),
    ).toBe('2026-11-14T11:00:00.000Z');
  });

  it('returns null when there is no activity', () => {
    expect(
      pickLatestActivityDate({
        now: NOW,
        candidates: [{ activityType: 'task', date: null }],
      }),
    ).toBeNull();
  });
});
