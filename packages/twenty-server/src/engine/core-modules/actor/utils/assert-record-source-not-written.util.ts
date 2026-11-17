import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { isRecordSourceObjectName } from 'src/engine/core-modules/actor/utils/is-record-source-object-name.util';
import { isSystemAuthContext } from 'src/engine/core-modules/auth/guards/is-system-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

export const assertRecordSourceNotWritten = ({
  records,
  objectMetadataNameSingular,
  authContext,
  isUpdate,
}: {
  records: Record<string, unknown>[];
  objectMetadataNameSingular: string;
  authContext: WorkspaceAuthContext;
  isUpdate: boolean;
}): void => {
  if (
    isSystemAuthContext(authContext) ||
    !isRecordSourceObjectName(objectMetadataNameSingular)
  ) {
    return;
  }

  // A null on create is overwritten from createdBy, while on update it would clear the value
  const isWritten = (record: Record<string, unknown>) =>
    isUpdate
      ? record.recordSource !== undefined
      : isDefined(record.recordSource);

  if (records.some(isWritten)) {
    throw new CommonQueryRunnerException(
      'recordSource is set by the server and cannot be written',
      CommonQueryRunnerExceptionCode.BAD_REQUEST,
      {
        userFriendlyMessage: msg`Record source is set automatically and cannot be changed.`,
      },
    );
  }
};
