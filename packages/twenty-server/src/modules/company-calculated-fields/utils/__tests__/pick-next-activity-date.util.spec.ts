import { pickNextActivityDate } from 'src/modules/company-calculated-fields/utils/pick-next-activity-date.util';

const NOW = new Date('2026-11-15T12:00:00.000Z');
const TOMORROW = '2026-11-16T09:00:00.000Z';
const NEXT_WEEK = '2026-11-22T09:00:00.000Z';
const YESTERDAY = '2026-11-14T09:00:00.000Z';

describe('pickNextActivityDate', () => {
  it('is empty without upcoming activities', () => {
    expect(pickNextActivityDate({ now: NOW, candidates: [] })).toBeNull();
  });

  it('takes an open task due before a future meeting', () => {
    expect(
      pickNextActivityDate({
        now: NOW,
        candidates: [
          { activityType: 'calendarEvent', date: NEXT_WEEK },
          { activityType: 'task', date: TOMORROW, status: 'TODO' },
        ],
      }),
    ).toBe(TOMORROW);
  });

  it('skips a task once it is DONE and falls back to the meeting', () => {
    expect(
      pickNextActivityDate({
        now: NOW,
        candidates: [
          { activityType: 'calendarEvent', date: NEXT_WEEK },
          { activityType: 'task', date: TOMORROW, status: 'DONE' },
        ],
      }),
    ).toBe(NEXT_WEEK);
  });

  it('keeps a task in progress or without a status', () => {
    expect(
      pickNextActivityDate({
        now: NOW,
        candidates: [
          { activityType: 'task', date: NEXT_WEEK, status: 'IN_PROGRESS' },
          { activityType: 'task', date: TOMORROW, status: null },
        ],
      }),
    ).toBe(TOMORROW);
  });

  it('ignores a meeting that already started and a task already overdue', () => {
    expect(
      pickNextActivityDate({
        now: NOW,
        candidates: [
          { activityType: 'calendarEvent', date: YESTERDAY },
          { activityType: 'task', date: YESTERDAY, status: 'TODO' },
          { activityType: 'calendarEvent', date: NOW.toISOString() },
        ],
      }),
    ).toBeNull();
  });

  it('ignores a task without a due date', () => {
    expect(
      pickNextActivityDate({
        now: NOW,
        candidates: [{ activityType: 'task', date: null, status: 'TODO' }],
      }),
    ).toBeNull();
  });
});
