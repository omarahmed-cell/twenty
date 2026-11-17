import { CoreObjectNameSingular } from 'twenty-shared/types';

export const getWorkspaceMemberIdsExcludedFromPicker = ({
  objectNameSingulars,
  deactivatedWorkspaceMemberIds,
}: {
  objectNameSingulars: string[];
  deactivatedWorkspaceMemberIds: string[];
}) =>
  objectNameSingulars.includes(CoreObjectNameSingular.WorkspaceMember)
    ? deactivatedWorkspaceMemberIds
    : [];
