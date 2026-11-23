import { getRoboostDueDate } from '@/roboost-app/activity/utils/getRoboostDueDate';
import { DEFAULT_WORKING_DAYS_CONFIG } from 'twenty-shared/utils';

// Wednesday 25 Nov 2026, 15:20; the default work week is Sunday to Thursday
const NOW = new Date(2026, 10, 25, 15, 20);
const config = DEFAULT_WORKING_DAYS_CONFIG;

const due = (option: Parameters<typeof getRoboostDueDate>[0]['option']) =>
  getRoboostDueDate({ option, now: NOW, time: '08:00', config });

describe('getRoboostDueDate', () => {
  it('counts business days over the weekend', () => {
    const result = due('businessDays3');

    expect(result.getDate()).toBe(30);
    expect(result.getHours()).toBe(8);
    expect(result.getMinutes()).toBe(0);
  });

  it('keeps tomorrow when it is a working day', () => {
    expect(due('tomorrow').getDate()).toBe(26);
  });

  it('moves a week ahead that lands on a weekend to the next working day', () => {
    const fridayNow = new Date(2026, 10, 20, 10, 0);
    const result = getRoboostDueDate({
      option: 'week1',
      now: fridayNow,
      time: '08:00',
      config,
    });

    expect(result.getDate()).toBe(29);
  });

  it('uses the custom date and time as entered', () => {
    const result = getRoboostDueDate({
      option: 'custom',
      now: NOW,
      time: '13:45',
      customDate: '2026-12-04',
      config,
    });

    expect(result.getDate()).toBe(4);
    expect(result.getHours()).toBe(13);
    expect(result.getMinutes()).toBe(45);
  });
});
