import {
  ForbiddenException,
  UseFilters,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { isDefined } from 'twenty-shared/utils';

import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { RoboostRecordVisibilityService } from 'src/engine/metadata-modules/role/services/roboost-record-visibility.service';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';
import { PullAssociatedRecordsIntoSegmentInput } from 'src/modules/segment/dtos/pull-associated-records-into-segment.input';
import { RefreshSegmentPullInput } from 'src/modules/segment/dtos/refresh-segment-pull.input';
import { SegmentPullResultDTO } from 'src/modules/segment/dtos/segment-pull-result.dto';
import { UpdateSegmentMembershipResultDTO } from 'src/modules/segment/dtos/update-segment-membership-result.dto';
import { UpdateSegmentMembershipInput } from 'src/modules/segment/dtos/update-segment-membership.input';
import { SegmentMembershipService } from 'src/modules/segment/services/segment-membership.service';
import { SegmentPullService } from 'src/modules/segment/services/segment-pull.service';
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
    private readonly segmentPullService: SegmentPullService,
    private readonly roboostRecordVisibilityService: RoboostRecordVisibilityService,
  ) {}

  // Adding or removing records counts as editing the segment (Segments > Edit scope)
  private async assertCanEditSegment(segmentId: string | null | undefined) {
    const authContext = getWorkspaceAuthContext();

    if (!isDefined(segmentId) || !isUserAuthContext(authContext)) {
      return;
    }

    const editableIds =
      await this.roboostRecordVisibilityService.filterVisibleRecordIds({
        workspaceId: authContext.workspace.id,
        workspaceMemberId: authContext.workspaceMemberId,
        objectNameSingular: 'segment',
        recordIds: [segmentId],
        operationType: 'update',
      });

    if (editableIds.length === 0) {
      throw new ForbiddenException('You cannot edit this segment');
    }
  }

  @Mutation(() => UpdateSegmentMembershipResultDTO)
  async addRecordsToSegment(
    @Args('input') input: UpdateSegmentMembershipInput,
  ): Promise<UpdateSegmentMembershipResultDTO> {
    await this.assertCanEditSegment(input.segmentId);

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
    await this.assertCanEditSegment(input.segmentId);

    return this.segmentMembershipService.updateSegmentMembership({
      ...input,
      operation: 'REMOVE',
      authContext: getWorkspaceAuthContext(),
    });
  }

  @Mutation(() => SegmentPullResultDTO)
  async pullAssociatedRecordsIntoSegment(
    @Args('input') input: PullAssociatedRecordsIntoSegmentInput,
  ): Promise<SegmentPullResultDTO> {
    await this.assertCanEditSegment(input.targetSegmentId);

    return this.segmentPullService.pullAssociatedRecordsIntoSegment({
      ...input,
      authContext: getWorkspaceAuthContext(),
    });
  }

  @Mutation(() => SegmentPullResultDTO)
  async refreshSegmentPull(
    @Args('input') input: RefreshSegmentPullInput,
  ): Promise<SegmentPullResultDTO> {
    await this.assertCanEditSegment(input.segmentId);

    return this.segmentPullService.refreshSegmentPull({
      ...input,
      authContext: getWorkspaceAuthContext(),
    });
  }
}
