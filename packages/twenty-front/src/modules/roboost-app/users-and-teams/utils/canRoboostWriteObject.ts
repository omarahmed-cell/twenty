import { type RoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { ROBOOST_TOGGLE_OBJECT_PERMISSIONS } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';

type RoboostWriteKind = 'create' | 'edit' | 'delete';

// Whether the user can do this to at least some records of the object; the server checks each record
export const canRoboostWriteObject = (
  access: RoboostAccess,
  objectNameSingular: string,
  kind: RoboostWriteKind,
): boolean => {
  const toggleObjectPermission =
    ROBOOST_TOGGLE_OBJECT_PERMISSIONS[objectNameSingular];

  if (isDefined(toggleObjectPermission)) {
    const toggleKeys = toggleObjectPermission[kind];

    return (
      !isDefined(toggleKeys) ||
      toggleKeys.some((toggleKey) => access.hasToggle(toggleKey))
    );
  }

  const governingObjectName =
    objectNameSingular === 'lineItem' ? 'opportunity' : objectNameSingular;
  const objectPermissions = access.getObjectPermissions(governingObjectName);

  if (!isDefined(objectPermissions)) {
    return true;
  }

  if (!objectPermissions.enabled) {
    return false;
  }

  if (kind === 'create') {
    return objectPermissions.create !== false;
  }

  const setting =
    kind === 'edit' ? objectPermissions.edit : objectPermissions.delete;

  return !isDefined(setting) || setting.scope !== 'NONE';
};
