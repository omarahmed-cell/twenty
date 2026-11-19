import { msg } from '@lingui/core/macro';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { findServerWrittenMeetingFieldNames } from 'src/modules/meeting-fields/utils/find-server-written-meeting-field-names.util';

@WorkspaceQueryHook(`calendarEvent.updateMany`)
export class CalendarEventUpdateManyMeetingFieldsPreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs,
  ): Promise<UpdateManyResolverArgs> {
    const fieldNames = findServerWrittenMeetingFieldNames(payload.data);

    if (fieldNames.length > 0) {
      const fieldList = fieldNames.join(', ');

      throw new CommonQueryRunnerException(
        `${fieldList} can only be set by Twenty`,
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: msg`${fieldList} can only be set by Roboost CRM.`,
        },
      );
    }

    return payload;
  }
}
