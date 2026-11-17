import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { extractPropertyRecordIdsFromFilter } from 'src/modules/properties/utils/extract-property-record-ids-from-filter.util';
import { PropertyLogicEnforcementService } from 'src/modules/properties/services/property-logic-enforcement.service';
import { PropertySettingsWriteService } from 'src/modules/properties/services/property-settings-write.service';

@WorkspaceQueryHook(`*.updateMany`)
export class PropertyUpdateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly propertySettingsWriteService: PropertySettingsWriteService,
    private readonly propertyLogicEnforcementService: PropertyLogicEnforcementService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: UpdateManyResolverArgs,
  ): Promise<UpdateManyResolverArgs> {
    if (this.propertySettingsWriteService.isPropertyObject(objectName)) {
      await this.propertySettingsWriteService.assertCanWrite(
        authContext,
        objectName,
      );

      return payload;
    }

    await this.propertyLogicEnforcementService.enforceUpdate({
      authContext,
      objectName,
      recordIds: extractPropertyRecordIdsFromFilter(payload.filter),
      data: payload.data,
    });

    return payload;
  }
}
