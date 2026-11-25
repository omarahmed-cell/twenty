import {
  buildDefaultRoboostPermissions,
  normalizeRoboostPermissions,
} from '@/utils/roboost-permissions/roboost-permissions-defaults';
import {
  diffRoboostPermissions,
  summarizeRoboostAccess,
  summarizeRoboostPermissionItem,
} from '@/utils/roboost-permissions/roboost-permissions-summary';
import { ROBOOST_PERMISSION_REGISTRY } from '@/constants/RoboostPermissionRegistry';

describe('roboost permissions', () => {
  it('gives a new member the agreed defaults', () => {
    const defaults = buildDefaultRoboostPermissions();

    expect(defaults.objects.opportunity).toEqual({
      enabled: true,
      view: { scope: 'ALL', includeUnassigned: false },
      create: true,
      edit: { scope: 'OWN', includeUnassigned: true },
      delete: { scope: 'NONE', includeUnassigned: false },
      merge: { scope: 'OWN', includeUnassigned: true },
    });
    expect(defaults.objects.task.delete?.scope).toBe('OWN');
    expect(defaults.objects.segment.edit?.scope).toBe('OWN');
    expect(defaults.toggles.connectGoogle).toBe(true);
    expect(defaults.toggles.export).toBe(false);
    expect(defaults.toggles.editAssociations).toBe(true);
    expect(defaults.toggles.workflowsCreate).toBe(false);
    expect(defaults.toggles.dashboardsCreate).toBe(true);
  });

  it('fills missing settings and drops unknown scopes', () => {
    const normalized = normalizeRoboostPermissions({
      objects: {
        company: {
          enabled: true,
          view: { scope: 'NONE', includeUnassigned: true },
        },
      },
      toggles: { export: true },
    });

    expect(normalized.objects.company.view).toEqual({
      scope: 'ALL',
      includeUnassigned: false,
    });
    expect(normalized.toggles.export).toBe(true);
    expect(normalized.toggles.import).toBe(false);
  });

  it('summarizes a card and the access column', () => {
    const permissions = buildDefaultRoboostPermissions();
    const dealItem = ROBOOST_PERMISSION_REGISTRY[0].items[2];

    expect(summarizeRoboostPermissionItem(dealItem, permissions)).toBe(
      'View (All), Create, Edit (Their own and Unassigned), Delete (None), Merge (Their own and Unassigned)',
    );
    expect(summarizeRoboostAccess({ isAdmin: true, permissions })).toBe(
      'Admin',
    );
    expect(summarizeRoboostAccess({ isAdmin: false, permissions })).toBe(
      'Companies · Contacts · Deals · Services · Segments',
    );
  });

  it('lists the differences between two users', () => {
    const from = buildDefaultRoboostPermissions();
    const to = buildDefaultRoboostPermissions();

    to.toggles.export = true;
    to.objects.person.view = { scope: 'TEAM', includeUnassigned: true };

    expect(diffRoboostPermissions(from, to)).toEqual([
      expect.objectContaining({
        itemLabel: 'Contacts',
        settingLabel: 'View',
        from: 'All',
        to: "Their team's and Unassigned",
      }),
      expect.objectContaining({
        settingLabel: 'Export',
        from: 'Off',
        to: 'On',
      }),
    ]);
  });
});
