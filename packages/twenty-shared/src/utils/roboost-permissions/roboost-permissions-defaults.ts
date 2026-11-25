import { ROBOOST_PERMISSION_REGISTRY } from '@/constants/RoboostPermissionRegistry';
import {
  type RoboostObjectPermissions,
  type RoboostPermissionObjectItem,
  type RoboostPermissionToggle,
  type RoboostUserPermissions,
} from '@/types/RoboostPermissions';

export const getRoboostPermissionObjectItems =
  (): RoboostPermissionObjectItem[] =>
    ROBOOST_PERMISSION_REGISTRY.flatMap((section) => section.items).filter(
      (item): item is RoboostPermissionObjectItem => item.kind === 'object',
    );

export const getRoboostPermissionToggles = (): RoboostPermissionToggle[] =>
  ROBOOST_PERMISSION_REGISTRY.flatMap((section) => section.items).flatMap(
    (item) => (item.kind === 'toggleGroup' ? item.toggles : []),
  );

export const findRoboostPermissionObjectItem = (
  objectNameSingular: string,
): RoboostPermissionObjectItem | undefined =>
  getRoboostPermissionObjectItems().find(
    (item) => item.objectNameSingular === objectNameSingular,
  );

export const buildDefaultRoboostPermissions = (): RoboostUserPermissions => ({
  objects: Object.fromEntries(
    getRoboostPermissionObjectItems().map((item) => [
      item.key,
      JSON.parse(JSON.stringify(item.defaults)) as RoboostObjectPermissions,
    ]),
  ),
  toggles: Object.fromEntries(
    getRoboostPermissionToggles().map((toggle) => [
      toggle.key,
      toggle.defaultValue,
    ]),
  ),
});

const normalizeObjectPermissions = (
  item: RoboostPermissionObjectItem,
  stored: Partial<RoboostObjectPermissions> | undefined,
): RoboostObjectPermissions => {
  const result: RoboostObjectPermissions = {
    enabled:
      typeof stored?.enabled === 'boolean'
        ? stored.enabled
        : item.defaults.enabled,
  };

  for (const settingKey of item.settings) {
    if (settingKey === 'create') {
      result.create =
        typeof stored?.create === 'boolean'
          ? stored.create
          : (item.defaults.create ?? false);
      continue;
    }

    const allowedScopes = item.scopeOptions[settingKey] ?? [];
    const storedSetting = stored?.[settingKey];
    const defaultSetting = item.defaults[settingKey];
    const scope =
      storedSetting !== undefined && allowedScopes.includes(storedSetting.scope)
        ? storedSetting.scope
        : (defaultSetting?.scope ?? allowedScopes[0] ?? 'NONE');

    result[settingKey] = {
      scope,
      includeUnassigned:
        item.supportsUnassigned && (scope === 'TEAM' || scope === 'OWN')
          ? (storedSetting?.includeUnassigned ??
            defaultSetting?.includeUnassigned ??
            false)
          : false,
    };
  }

  return result;
};

// Fills settings added to the registry after the permissions were saved, and drops removed ones
export const normalizeRoboostPermissions = (
  stored: Partial<RoboostUserPermissions> | null | undefined,
): RoboostUserPermissions => ({
  objects: Object.fromEntries(
    getRoboostPermissionObjectItems().map((item) => [
      item.key,
      normalizeObjectPermissions(item, stored?.objects?.[item.key]),
    ]),
  ),
  toggles: Object.fromEntries(
    getRoboostPermissionToggles().map((toggle) => [
      toggle.key,
      typeof stored?.toggles?.[toggle.key] === 'boolean'
        ? (stored.toggles[toggle.key] as boolean)
        : toggle.defaultValue,
    ]),
  ),
});
