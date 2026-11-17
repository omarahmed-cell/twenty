import { Injectable } from '@nestjs/common';

import { type QueryResultFieldValue } from 'src/engine/api/graphql/workspace-query-runner/factories/query-result-getters/interfaces/query-result-field-value';
import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  getDeletedRecordIds,
  PropertySettingsWriteService,
} from 'src/modules/properties/services/property-settings-write.service';

@Injectable()
@WorkspaceQueryHook({
  key: `*.deleteOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class PropertyDeleteOnePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly propertySettingsWriteService: PropertySettingsWriteService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: QueryResultFieldValue,
  ): Promise<void> {
    if (!this.propertySettingsWriteService.isPropertyObject(objectName)) {
      return;
    }

    if (objectName === 'propertyGroup') {
      await this.propertySettingsWriteService.releaseGroupMembers({
        workspaceId: authContext.workspace.id,
        propertyGroupIds: getDeletedRecordIds(payload),
      });
    }

    this.propertySettingsWriteService.invalidateRules(authContext.workspace.id);
  }
}
