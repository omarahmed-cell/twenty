import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type SegmentWorkspaceEntity } from 'src/modules/segment/standard-objects/segment.workspace-entity';

// Retargeting is checked per segment in the updateOne hook, so bulk edits cannot do it
@Injectable()
@WorkspaceQueryHook(`segment.updateMany`)
export class SegmentUpdateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs<Partial<SegmentWorkspaceEntity>>,
  ): Promise<UpdateManyResolverArgs<Partial<SegmentWorkspaceEntity>>> {
    if (payload.data.targetObject !== undefined) {
      throw new CommonQueryRunnerException(
        'Bulk updates cannot change a segment target object',
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: msg`Change the target object one segment at a time.`,
        },
      );
    }

    return payload;
  }
}
