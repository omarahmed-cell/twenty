import {
  formatRoboostPercentage,
  isRoboostPercentageField,
} from '@/roboost-app/utils/formatRoboostPercentage';

describe('formatRoboostPercentage', () => {
  it('shows fractions as percentages with one decimal and no trailing .0', () => {
    expect(formatRoboostPercentage(0.429)).toBe('42.9%');
    expect(formatRoboostPercentage(0.5)).toBe('50%');
    expect(formatRoboostPercentage(1)).toBe('100%');
    expect(formatRoboostPercentage(0)).toBe('0%');
    expect(formatRoboostPercentage(0.14285)).toBe('14.3%');
  });

  it('recognises fields set to the Percentage format', () => {
    expect(isRoboostPercentageField({ settings: { type: 'percentage' } })).toBe(
      true,
    );
    expect(isRoboostPercentageField({ settings: { type: 'number' } })).toBe(
      false,
    );
    expect(isRoboostPercentageField({ settings: null })).toBe(false);
  });
});
