import { Injectable } from '@nestjs/common';

import { type ObjectRecord } from 'twenty-shared/types';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { DealPipelineIntegrityService } from 'src/modules/pipeline/services/deal-pipeline-integrity.service';

@Injectable()
@WorkspaceQueryHook({
  key: `service.createOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class ServiceCreateOnePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly dealPipelineIntegrityService: DealPipelineIntegrityService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: ObjectRecord[],
  ): Promise<void> {
    await this.dealPipelineIntegrityService.recordCreationOverrides({
      authContext,
      objectNameSingular: 'service',
      records: payload,
    });
  }
}
