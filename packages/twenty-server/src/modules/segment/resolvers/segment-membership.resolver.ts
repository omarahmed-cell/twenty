import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';
import { UpdateSegmentMembershipResultDTO } from 'src/modules/segment/dtos/update-segment-membership-result.dto';
import { UpdateSegmentMembershipInput } from 'src/modules/segment/dtos/update-segment-membership.input';
import { SegmentMembershipService } from 'src/modules/segment/services/segment-membership.service';
import { SegmentGraphqlApiExceptionFilter } from 'src/modules/segment/utils/segment-graphql-api-exception.filter';

// The service checks object permissions, so no settings permission is required
@MetadataResolver()
@UseFilters(
  SegmentGraphqlApiExceptionFilter,
  PermissionsGraphqlApiExceptionFilter,
  AuthGraphqlApiExceptionFilter,
)
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: true,
    oauthClient: true,
    application: true,
  }),
  NoPermissionGuard,
)
@UsePipes(ResolverValidationPipe)
export class SegmentMembershipResolver {
  constructor(
    private readonly segmentMembershipService: SegmentMembershipService,
  ) {}

  @Mutation(() => UpdateSegmentMembershipResultDTO)
  async addRecordsToSegment(
    @Args('input') input: UpdateSegmentMembershipInput,
  ): Promise<UpdateSegmentMembershipResultDTO> {
    return this.segmentMembershipService.updateSegmentMembership({
      ...input,
      operation: 'ADD',
      authContext: getWorkspaceAuthContext(),
    });
  }

  @Mutation(() => UpdateSegmentMembershipResultDTO)
  async removeRecordsFromSegment(
    @Args('input') input: UpdateSegmentMembershipInput,
  ): Promise<UpdateSegmentMembershipResultDTO> {
    return this.segmentMembershipService.updateSegmentMembership({
      ...input,
      operation: 'REMOVE',
      authContext: getWorkspaceAuthContext(),
    });
  }
}
