import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Args, Field, Mutation, ObjectType, Query } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { RoboostRecordVisibilityService } from 'src/engine/metadata-modules/role/services/roboost-record-visibility.service';
import { RoboostMergeActorService } from 'src/modules/roboost-merge/services/roboost-merge-actor.service';
import { RoboostMergeLogService } from 'src/modules/roboost-merge/services/roboost-merge-log.service';
import { RoboostMergeService } from 'src/modules/roboost-merge/services/roboost-merge.service';

@ObjectType('RoboostMergeHistory')
class RoboostMergeHistoryDTO {
  @Field(() => Boolean) canUnmerge: boolean;
  @Field(() => GraphQLJSON) merges: unknown;
}

@MetadataResolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: false,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
  NoPermissionGuard,
)
export class RoboostMergeLogResolver {
  constructor(
    private readonly roboostMergeLogService: RoboostMergeLogService,
    private readonly roboostMergeService: RoboostMergeService,
    private readonly roboostMergeActorService: RoboostMergeActorService,
    private readonly roboostRecordVisibilityService: RoboostRecordVisibilityService,
  ) {}

  // Everyone who can view the record sees its merge history; only admins can unmerge
  @Query(() => RoboostMergeHistoryDTO)
  async roboostMergeHistory(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
    @Args('recordId', { type: () => String }) recordId: string,
  ) {
    const canView =
      (await this.roboostMergeService.isAdmin(
        workspace.id,
        workspaceMemberId ?? null,
      )) ||
      (await this.roboostRecordVisibilityService.canViewRecord({
        workspaceId: workspace.id,
        workspaceMemberId: workspaceMemberId ?? '',
        objectNameSingular: objectName,
        recordId,
      }));

    return {
      canUnmerge: await this.roboostMergeService.isAdmin(
        workspace.id,
        workspaceMemberId ?? null,
      ),
      merges: canView
        ? await this.roboostMergeLogService.history(
            workspace.id,
            objectName,
            recordId,
          )
        : [],
    };
  }

  @Query(() => GraphQLJSON)
  async roboostUnmergePreview(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('mergeId', { type: () => String }) mergeId: string,
  ) {
    if (
      !(await this.roboostMergeService.isAdmin(
        workspace.id,
        workspaceMemberId ?? null,
      ))
    ) {
      throw new ForbiddenException('Only admins can unmerge records');
    }

    return this.roboostMergeLogService.unmergePreview(workspace.id, mergeId);
  }

  @Mutation(() => Boolean)
  async roboostUnmerge(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('mergeId', { type: () => String }) mergeId: string,
    @Args('keepCurrentFieldNames', { type: () => [String] })
    keepCurrentFieldNames: string[],
  ) {
    return this.roboostMergeLogService.unmerge({
      workspaceId: workspace.id,
      actor: await this.roboostMergeActorService.resolve(
        workspace.id,
        workspaceMemberId,
      ),
      isAdmin: await this.roboostMergeService.isAdmin(
        workspace.id,
        workspaceMemberId ?? null,
      ),
      mergeId,
      keepCurrentFieldNames,
    });
  }
}
