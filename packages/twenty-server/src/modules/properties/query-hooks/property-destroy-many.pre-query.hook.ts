import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type DestroyManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PropertySettingsWriteService } from 'src/modules/properties/services/property-settings-write.service';

@WorkspaceQueryHook(`*.destroyMany`)
export class PropertyDestroyManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly propertySettingsWriteService: PropertySettingsWriteService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: DestroyManyResolverArgs,
  ): Promise<DestroyManyResolverArgs> {
    if (this.propertySettingsWriteService.isPropertyObject(objectName)) {
      await this.propertySettingsWriteService.assertCanWrite(
        authContext,
        objectName,
      );
    }

    return payload;
  }
}
