import { addRoboostBusinessDays } from '@/roboost-app/activity/utils/addRoboostBusinessDays';

describe('addRoboostBusinessDays', () => {
  it('skips the weekend', () => {
    // Friday 20 Nov 2026 plus 3 business days is Wednesday 25 Nov
    const result = addRoboostBusinessDays(new Date(2026, 10, 20, 15, 0), 3);

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(10);
    expect(result.getDate()).toBe(25);
    expect(result.getHours()).toBe(9);
  });

  it('counts weekdays only from a Monday', () => {
    expect(addRoboostBusinessDays(new Date(2026, 10, 23), 1).getDate()).toBe(
      24,
    );
  });
});
