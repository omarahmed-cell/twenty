import { formatRoboostMoney } from '@/roboost-app/board/utils/formatRoboostMoney';
import { formatRoboostRelativeTime } from '@/roboost-app/board/utils/formatRoboostRelativeTime';

describe('board value formatting', () => {
  const now = new Date('2026-11-22T12:00:00Z');

  it('formats past and future activity times', () => {
    expect(formatRoboostRelativeTime('2026-11-14T12:00:00Z', now)).toBe(
      '8 days ago',
    );
    expect(formatRoboostRelativeTime('2026-11-23T02:00:00Z', now)).toBe(
      'in 14 hours',
    );
  });

  it('formats currency micros', () => {
    expect(formatRoboostMoney(80_000_000_000, 'USD')).toBe('$80,000');
    expect(formatRoboostMoney(1_250_000_000_000, 'USD', true)).toBe('$1.25M');
  });
});
