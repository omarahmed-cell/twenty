import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PropertyLogicEnforcementService } from 'src/modules/properties/services/property-logic-enforcement.service';
import { PropertySettingsWriteService } from 'src/modules/properties/services/property-settings-write.service';

@WorkspaceQueryHook(`*.createOne`)
export class PropertyCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly propertySettingsWriteService: PropertySettingsWriteService,
    private readonly propertyLogicEnforcementService: PropertyLogicEnforcementService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: CreateOneResolverArgs,
  ): Promise<CreateOneResolverArgs> {
    if (this.propertySettingsWriteService.isPropertyObject(objectName)) {
      await this.propertySettingsWriteService.assertCanWrite(
        authContext,
        objectName,
      );

      if (objectName === 'propertyGroupMembership') {
        await this.propertySettingsWriteService.releaseFieldsFromOtherGroups({
          workspaceId: authContext.workspace.id,
          memberships: [payload.data],
        });
      }

      return payload;
    }

    await this.propertyLogicEnforcementService.enforceCreate({
      authContext,
      objectName,
      records: [payload.data],
    });

    return payload;
  }
}
