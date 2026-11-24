import { resolveRoboostTimeZone } from '@/roboost-app/meeting/utils/resolveRoboostTimeZone';

describe('resolveRoboostTimeZone', () => {
  it('keeps a valid zone', () => {
    expect(resolveRoboostTimeZone('Africa/Cairo', 'UTC')).toBe('Africa/Cairo');
  });

  it('falls back on empty, missing or unknown zones', () => {
    expect(resolveRoboostTimeZone('', 'Asia/Dubai')).toBe('Asia/Dubai');
    expect(resolveRoboostTimeZone(null, 'Asia/Dubai')).toBe('Asia/Dubai');
    expect(resolveRoboostTimeZone('Mars/Base', 'Asia/Dubai')).toBe(
      'Asia/Dubai',
    );
  });
});
