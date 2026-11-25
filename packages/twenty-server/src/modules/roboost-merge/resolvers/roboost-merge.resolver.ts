import { UseGuards } from '@nestjs/common';
import { Args, Field, Mutation, ObjectType, Query } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';
import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { RoboostMergeActorService } from 'src/modules/roboost-merge/services/roboost-merge-actor.service';
import { RoboostMergeService } from 'src/modules/roboost-merge/services/roboost-merge.service';

@ObjectType('RoboostMergeCandidate')
class RoboostMergeCandidateDTO {
  @Field(() => String) id: string;
  @Field(() => String) name: string;
  @Field(() => String) keyText: string;
  @Field(() => String) createdAt: string;
}

@ObjectType('RoboostMergedInto')
class RoboostMergedIntoDTO {
  @Field(() => String) primaryId: string;
  @Field(() => String, { nullable: true }) primaryName: string | null;
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
export class RoboostMergeResolver {
  constructor(
    private readonly roboostMergeService: RoboostMergeService,
    private readonly roboostMergeActorService: RoboostMergeActorService,
  ) {}

  @Query(() => [RoboostMergeCandidateDTO])
  async roboostMergeCandidates(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
    @Args('excludeId', { type: () => String }) excludeId: string,
    @Args('search', { type: () => String }) search: string,
  ) {
    return this.roboostMergeService.candidates({
      workspaceId: workspace.id,
      actor: await this.roboostMergeActorService.resolve(
        workspace.id,
        workspaceMemberId,
      ),
      objectName,
      excludeId,
      search,
    });
  }

  @Query(() => GraphQLJSON)
  async roboostMergePreview(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
    @Args('primaryId', { type: () => String }) primaryId: string,
    @Args('secondaryId', { type: () => String }) secondaryId: string,
  ) {
    return this.roboostMergeService.preview({
      workspaceId: workspace.id,
      actor: await this.roboostMergeActorService.resolve(
        workspace.id,
        workspaceMemberId,
      ),
      objectName,
      primaryId,
      secondaryId,
    });
  }

  @Mutation(() => String)
  async roboostMergeRecords(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
    @Args('primaryId', { type: () => String }) primaryId: string,
    @Args('secondaryId', { type: () => String }) secondaryId: string,
    @Args('secondaryFieldNames', { type: () => [String] })
    secondaryFieldNames: string[],
  ) {
    const { mergeId } = await this.roboostMergeService.merge({
      workspaceId: workspace.id,
      actor: await this.roboostMergeActorService.resolve(
        workspace.id,
        workspaceMemberId,
      ),
      objectName,
      primaryId,
      secondaryId,
      secondaryFieldNames,
    });

    return mergeId;
  }

  @Query(() => RoboostMergedIntoDTO, { nullable: true })
  async roboostMergedInto(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('objectName', { type: () => String }) objectName: string,
    @Args('recordId', { type: () => String }) recordId: string,
  ) {
    const result = await this.roboostMergeService.mergedInto(
      workspace.id,
      objectName,
      recordId,
    );

    return isDefined(result) ? result : null;
  }
}
