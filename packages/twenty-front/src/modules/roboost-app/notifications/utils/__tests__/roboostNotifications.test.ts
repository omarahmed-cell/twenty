import { formatRoboostTimeAgo } from '@/roboost-app/notifications/utils/formatRoboostTimeAgo';
import { getRoboostNotificationHref } from '@/roboost-app/notifications/utils/getRoboostNotificationHref';

describe('formatRoboostTimeAgo', () => {
  const now = new Date('2026-11-24T12:00:00.000Z');

  it('uses compact ages like HubSpot', () => {
    expect(formatRoboostTimeAgo('2026-11-24T11:59:40.000Z', now)).toBe('now');
    expect(formatRoboostTimeAgo('2026-11-24T11:55:00.000Z', now)).toBe('5m');
    expect(formatRoboostTimeAgo('2026-11-24T09:00:00.000Z', now)).toBe('3h');
    expect(formatRoboostTimeAgo('2026-11-22T12:00:00.000Z', now)).toBe('2d');
    expect(formatRoboostTimeAgo('2026-11-15T12:00:00.000Z', now)).toBe('9d');
  });
});

describe('getRoboostNotificationHref', () => {
  it('prefers the in-app path, then the record page', () => {
    expect(
      getRoboostNotificationHref({
        targetPath: '/objects/people?filterIds=a,b',
        targetObjectNameSingular: 'person',
        targetRecordId: 'a',
      }),
    ).toBe('/objects/people?filterIds=a,b');
    expect(
      getRoboostNotificationHref({
        targetPath: null,
        targetObjectNameSingular: 'company',
        targetRecordId: 'c1',
      }),
    ).toBe('/object/company/c1');
    expect(
      getRoboostNotificationHref({
        targetPath: null,
        targetObjectNameSingular: null,
        targetRecordId: null,
      }),
    ).toBeNull();
  });
});
