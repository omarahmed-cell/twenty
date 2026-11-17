import { msg } from '@lingui/core/macro';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { isSystemAuthContext } from 'src/engine/core-modules/auth/guards/is-system-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

// userId and userEmail tie a member to a login, so only system flows may change them
const WORKSPACE_MEMBER_ACCESS_FIELD_NAMES = [
  'memberStatus',
  'isPreCreated',
  'userId',
  'userEmail',
];

export const assertWorkspaceMemberAccessFieldsNotWritten = ({
  records,
  objectMetadataNameSingular,
  authContext,
}: {
  records: Record<string, unknown>[];
  objectMetadataNameSingular: string;
  authContext: WorkspaceAuthContext;
}): void => {
  if (
    isSystemAuthContext(authContext) ||
    objectMetadataNameSingular !== 'workspaceMember'
  ) {
    return;
  }

  const isWritten = (record: Record<string, unknown>) =>
    WORKSPACE_MEMBER_ACCESS_FIELD_NAMES.some(
      (fieldName) => record[fieldName] !== undefined,
    );

  if (records.some(isWritten)) {
    throw new CommonQueryRunnerException(
      'memberStatus, isPreCreated, userId and userEmail can only be changed by the server',
      CommonQueryRunnerExceptionCode.BAD_REQUEST,
      {
        userFriendlyMessage: msg`Member status and login link can only be changed from Settings.`,
      },
    );
  }
};
