import { isDefined } from 'twenty-shared/utils';

import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

export const withDefaultSegmentOwner = <
  TRecord extends Record<string, unknown>,
>(
  authContext: WorkspaceAuthContext,
  record: TRecord,
): TRecord => {
  if (
    record.segmentOwnerId !== undefined ||
    record.segmentOwner !== undefined ||
    !isUserAuthContext(authContext) ||
    !isDefined(authContext.workspaceMember?.id)
  ) {
    return record;
  }

  return { ...record, segmentOwnerId: authContext.workspaceMember.id };
};
