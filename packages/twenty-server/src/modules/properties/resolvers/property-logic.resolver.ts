import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PropertyLogicVisibilityDTO } from 'src/modules/properties/dtos/property-logic-visibility.dto';
import { PropertyLogicEnforcementService } from 'src/modules/properties/services/property-logic-enforcement.service';

@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: true,
    oauthClient: false,
    application: false,
  }),
)
@MetadataResolver()
export class PropertyLogicResolver {
  constructor(
    private readonly propertyLogicEnforcementService: PropertyLogicEnforcementService,
  ) {}

  // Which dependent properties the record page hides for this record, as the server evaluates the rules
  @Query(() => PropertyLogicVisibilityDTO)
  @UseGuards(NoPermissionGuard)
  async propertyLogicVisibility(
    @Args('objectNameSingular') objectNameSingular: string,
    @Args('recordId', { type: () => UUIDScalarType }) recordId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<PropertyLogicVisibilityDTO> {
    return this.propertyLogicEnforcementService.getVisibility({
      workspaceId: workspace.id,
      objectName: objectNameSingular,
      recordId,
    });
  }
}
