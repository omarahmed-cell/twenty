import {
  addBusinessDays,
  DEFAULT_WORKING_DAYS_CONFIG,
  moveToWorkingDay,
  nextBusinessDay,
  setWorkDayStartTime,
} from '@/utils/working-days/working-days';

// Thursday 26 Nov 2026; Sunday to Thursday is the default work week
const THURSDAY = new Date(2026, 10, 26, 15, 30);

describe('working days', () => {
  it('skips Friday and Saturday by default', () => {
    const result = nextBusinessDay(THURSDAY, DEFAULT_WORKING_DAYS_CONFIG);

    expect(result.getDay()).toBe(0);
    expect(result.getDate()).toBe(29);
  });

  it('adds business days across the weekend', () => {
    const result = addBusinessDays(THURSDAY, 3, DEFAULT_WORKING_DAYS_CONFIG);

    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(11);
  });

  it('moves a plain date that lands on a weekend to the next working day', () => {
    const saturday = new Date(2026, 10, 28);

    expect(
      moveToWorkingDay(saturday, DEFAULT_WORKING_DAYS_CONFIG).getDate(),
    ).toBe(29);
    expect(
      moveToWorkingDay(THURSDAY, DEFAULT_WORKING_DAYS_CONFIG).getDate(),
    ).toBe(26);
  });

  it('follows a custom work week', () => {
    const mondayToFriday = { days: [1, 2, 3, 4, 5], startTime: '09:30' };

    expect(nextBusinessDay(THURSDAY, mondayToFriday).getDay()).toBe(5);
    expect(addBusinessDays(THURSDAY, 2, mondayToFriday).getDay()).toBe(1);
  });

  it('sets the work-day start time', () => {
    const result = setWorkDayStartTime(THURSDAY, {
      days: [1],
      startTime: '09:30',
    });

    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
  });
});
