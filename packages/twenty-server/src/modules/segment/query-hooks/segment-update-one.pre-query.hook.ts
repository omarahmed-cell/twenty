import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type SegmentMemberWorkspaceEntity } from 'src/modules/segment/standard-objects/segment-member.workspace-entity';
import { type SegmentWorkspaceEntity } from 'src/modules/segment/standard-objects/segment.workspace-entity';

// Members are records of the target object, so retargeting a non-empty segment would orphan them
@Injectable()
@WorkspaceQueryHook(`segment.updateOne`)
export class SegmentUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<Partial<SegmentWorkspaceEntity>>,
  ): Promise<UpdateOneResolverArgs<Partial<SegmentWorkspaceEntity>>> {
    if (payload.data.targetObject === undefined) {
      return payload;
    }

    const memberCount =
      await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
        const segment = await this.workspaceOrmManager
          .getRepository<SegmentWorkspaceEntity>('segment', {
            shouldBypassPermissionChecks: true,
          })
          .findOne({
            select: { id: true, targetObject: true },
            where: { id: payload.id },
          });

        if (
          !isDefined(segment) ||
          segment.targetObject === payload.data.targetObject
        ) {
          return 0;
        }

        return this.workspaceOrmManager
          .getRepository<SegmentMemberWorkspaceEntity>('segmentMember', {
            shouldBypassPermissionChecks: true,
          })
          .count({ where: { segmentId: payload.id } });
      }, buildSystemAuthContext(authContext.workspace.id));

    if (memberCount > 0) {
      throw new CommonQueryRunnerException(
        `Segment ${payload.id} has ${memberCount} members`,
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: msg`Remove every member before changing the segment's target object.`,
        },
      );
    }

    return payload;
  }
}
