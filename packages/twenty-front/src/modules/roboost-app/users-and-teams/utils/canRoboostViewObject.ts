import { type RoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { ROBOOST_TOGGLE_OBJECT_PERMISSIONS } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';

// Line items follow their deal; toggle-governed objects need one of their view toggles
export const canRoboostViewObject = (
  access: RoboostAccess,
  objectNameSingular: string,
): boolean => {
  const toggleObjectPermission =
    ROBOOST_TOGGLE_OBJECT_PERMISSIONS[objectNameSingular];

  if (isDefined(toggleObjectPermission)) {
    return (toggleObjectPermission.view ?? []).some((toggleKey) =>
      access.hasToggle(toggleKey),
    );
  }

  const governingObjectName =
    objectNameSingular === 'lineItem' ? 'opportunity' : objectNameSingular;
  const objectPermissions = access.getObjectPermissions(governingObjectName);

  return !isDefined(objectPermissions) || objectPermissions.enabled;
};
