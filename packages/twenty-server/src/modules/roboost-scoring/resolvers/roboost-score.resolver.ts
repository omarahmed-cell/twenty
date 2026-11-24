import { BadRequestException, UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  Float,
  Int,
  Mutation,
  ObjectType,
  Query,
} from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';
import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import {
  type RoboostScorePropertyChoice,
  RoboostScoreService,
} from 'src/modules/roboost-scoring/services/roboost-score.service';
import { RoboostScoreStoreService } from 'src/modules/roboost-scoring/services/roboost-score-store.service';
import {
  type RoboostScoreRow,
  type RoboostScoreVersionRow,
} from 'src/modules/roboost-scoring/types/roboost-score.type';

@ObjectType('RoboostScore')
class RoboostScoreDTO {
  @Field(() => String) id: string;
  @Field(() => String) name: string;
  @Field(() => String, { nullable: true }) description: string | null;
  @Field(() => String) objectName: string;
  @Field(() => Boolean) isActive: boolean;
  @Field(() => Int) scoreMin: number;
  @Field(() => Int) scoreMax: number;
  @Field(() => String, { nullable: true }) linkedFieldMetadataId: string | null;
  @Field(() => Boolean) freezeOnClosedWon: boolean;
  @Field(() => Int, { nullable: true }) publishedVersionNumber: number | null;
  @Field(() => GraphQLJSON) draft: unknown;
  @Field(() => Boolean) hasDraftChanges: boolean;
  @Field(() => String, { nullable: true }) recalcStatus: string | null;
  @Field(() => Int, { nullable: true }) recalcTotal: number | null;
  @Field(() => Int, { nullable: true }) recalcDone: number | null;
  @Field(() => String, { nullable: true }) recalcFinishedAt: string | null;
  @Field(() => String, { nullable: true }) lastFullRecalcAt: string | null;
  @Field(() => String, { nullable: true }) lastVerifiedAt: string | null;
  @Field(() => Int, { nullable: true }) lastDriftCount: number | null;
  @Field(() => String) createdAt: string;
  @Field(() => String, { nullable: true }) createdByName: string | null;
  @Field(() => String) updatedAt: string;
  @Field(() => String, { nullable: true }) updatedByName: string | null;
}

@ObjectType('RoboostScoreVersion')
class RoboostScoreVersionDTO {
  @Field(() => String) id: string;
  @Field(() => Int) version: number;
  @Field(() => GraphQLJSON) criteria: unknown;
  @Field(() => String) publishedAt: string;
  @Field(() => String, { nullable: true }) publishedByName: string | null;
  @Field(() => String, { nullable: true }) note: string | null;
}

@ObjectType('RoboostScoreEligibleField')
class RoboostScoreEligibleFieldDTO {
  @Field(() => String) id: string;
  @Field(() => String) label: string;
  @Field(() => String) name: string;
}

@ObjectType('RoboostScoreRecordResult')
class RoboostScoreRecordResultDTO {
  @Field(() => String) scoreId: string;
  @Field(() => String) scoreName: string;
  @Field(() => Float, { nullable: true }) value: number | null;
  @Field(() => Int, { nullable: true }) versionNumber: number | null;
  @Field(() => String, { nullable: true }) computedAt: string | null;
  @Field(() => Boolean) frozen: boolean;
  @Field(() => String, { nullable: true }) frozenAt: string | null;
  @Field(() => String, { nullable: true }) source: string | null;
  @Field(() => GraphQLJSON, { nullable: true }) breakdown: unknown;
  @Field(() => GraphQLJSON, { nullable: true }) criteria: unknown;
  @Field(() => Boolean) isActive: boolean;
}

const toScoreDTO = (score: RoboostScoreRow): RoboostScoreDTO => ({
  id: score.id,
  name: score.name,
  description: score.description,
  objectName: score.objectName,
  isActive: score.isActive,
  scoreMin: score.scoreMin,
  scoreMax: score.scoreMax,
  linkedFieldMetadataId: score.linkedFieldMetadataId,
  freezeOnClosedWon: score.freezeOnClosedWon,
  publishedVersionNumber: score.publishedVersionNumber,
  draft: score.draft,
  hasDraftChanges: score.hasDraftChanges,
  recalcStatus: score.recalcStatus,
  recalcTotal: score.recalcTotal,
  recalcDone: score.recalcDone,
  recalcFinishedAt: score.recalcFinishedAt,
  lastFullRecalcAt: score.lastFullRecalcAt,
  lastVerifiedAt: score.lastVerifiedAt,
  lastDriftCount: score.lastDriftCount,
  createdAt: score.createdAt,
  createdByName: score.createdByName,
  updatedAt: score.updatedAt,
  updatedByName: score.updatedByName,
});

const toVersionDTO = (
  version: RoboostScoreVersionRow,
): RoboostScoreVersionDTO => ({
  id: version.id,
  version: version.version,
  criteria: version.criteria,
  publishedAt: version.publishedAt,
  publishedByName: version.publishedByName,
  note: version.note,
});

const requireMember = (workspaceMemberId: string | undefined) => {
  if (!isDefined(workspaceMemberId)) {
    throw new BadRequestException('A workspace member is required');
  }

  return workspaceMemberId;
};

const toPropertyChoice = (
  propertyMode: string,
  propertyLabel: string | null,
  fieldMetadataId: string | null,
): RoboostScorePropertyChoice => {
  if (propertyMode === 'existing') {
    if (!isDefined(fieldMetadataId)) {
      throw new BadRequestException('Pick an existing Number property');
    }

    return { mode: 'existing', fieldMetadataId };
  }

  return { mode: 'new', label: propertyLabel ?? '' };
};

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
export class RoboostScoreResolver {
  constructor(
    private readonly roboostScoreService: RoboostScoreService,
    private readonly roboostScoreStoreService: RoboostScoreStoreService,
  ) {}

  @Query(() => [RoboostScoreDTO])
  async roboostScores(@AuthWorkspace() workspace: WorkspaceEntity) {
    return (await this.roboostScoreStoreService.listScores(workspace.id)).map(
      toScoreDTO,
    );
  }

  @Query(() => RoboostScoreDTO)
  async roboostScore(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('scoreId', { type: () => String }) scoreId: string,
  ) {
    return toScoreDTO(
      await this.roboostScoreService.getScoreOrThrow(workspace.id, scoreId),
    );
  }

  @Query(() => Boolean)
  async roboostScoringCanEdit(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return isDefined(workspaceMemberId)
      ? this.roboostScoreStoreService.isAdmin(workspace.id, workspaceMemberId)
      : false;
  }

  @Query(() => [RoboostScoreVersionDTO])
  async roboostScoreVersions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('scoreId', { type: () => String }) scoreId: string,
  ) {
    return (
      await this.roboostScoreStoreService.listVersions(workspace.id, scoreId)
    ).map(toVersionDTO);
  }

  @Query(() => [RoboostScoreEligibleFieldDTO])
  async roboostScoreEligibleFields(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('objectName', { type: () => String }) objectName: string,
  ) {
    return this.roboostScoreService.eligibleFields(workspace.id, objectName);
  }

  @Query(() => GraphQLJSON)
  async roboostTestScore(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('scoreId', { type: () => String }) scoreId: string,
    @Args('criteria', { type: () => GraphQLJSON }) criteria: unknown,
    @Args('recordId', { type: () => String }) recordId: string,
  ) {
    return this.roboostScoreService.testRecord({
      workspaceId: workspace.id,
      scoreId,
      criteria,
      recordId,
    });
  }

  @Query(() => RoboostScoreRecordResultDTO, { nullable: true })
  async roboostExplainScore(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('fieldMetadataId', { type: () => String }) fieldMetadataId: string,
    @Args('recordId', { type: () => String }) recordId: string,
  ): Promise<RoboostScoreRecordResultDTO | null> {
    const explanation = await this.roboostScoreService.explainRecord(
      workspace.id,
      fieldMetadataId,
      recordId,
    );

    if (!isDefined(explanation)) {
      return null;
    }
    const { score, result, version } = explanation;

    return {
      scoreId: score.id,
      scoreName: score.name,
      value: result?.value ?? null,
      versionNumber: result?.versionNumber ?? null,
      computedAt: result?.computedAt ?? null,
      frozen: result?.frozen === true,
      frozenAt: result?.frozenAt ?? null,
      source: result?.source ?? null,
      breakdown: result?.breakdown ?? null,
      criteria: version?.criteria ?? null,
      isActive: score.isActive,
    };
  }

  @Mutation(() => RoboostScoreDTO)
  async roboostCreateScore(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('name', { type: () => String }) name: string,
    @Args('objectName', { type: () => String }) objectName: string,
    @Args('propertyMode', { type: () => String }) propertyMode: string,
    @Args('propertyLabel', { type: () => String, nullable: true })
    propertyLabel: string | null,
    @Args('fieldMetadataId', { type: () => String, nullable: true })
    fieldMetadataId: string | null,
    @Args('cloneFromScoreId', { type: () => String, nullable: true })
    cloneFromScoreId: string | null,
    @Args('defaultGroupName', { type: () => String, nullable: true })
    defaultGroupName: string | null,
  ) {
    return toScoreDTO(
      await this.roboostScoreService.createScore({
        scope: {
          workspaceId: workspace.id,
          workspaceMemberId: requireMember(workspaceMemberId),
        },
        name,
        objectName,
        property: toPropertyChoice(
          propertyMode,
          propertyLabel,
          fieldMetadataId,
        ),
        cloneFromScoreId,
        defaultGroupName: defaultGroupName ?? 'New scoring group',
      }),
    );
  }

  @Mutation(() => RoboostScoreDTO)
  async roboostSaveScore(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('scoreId', { type: () => String }) scoreId: string,
    @Args('draft', { type: () => GraphQLJSON, nullable: true }) draft: unknown,
    @Args('name', { type: () => String, nullable: true }) name: string | null,
    @Args('description', { type: () => String, nullable: true })
    description: string | null | undefined,
    @Args('freezeOnClosedWon', { type: () => Boolean, nullable: true })
    freezeOnClosedWon: boolean | null,
  ) {
    return toScoreDTO(
      await this.roboostScoreService.saveDraft({
        scope: {
          workspaceId: workspace.id,
          workspaceMemberId: requireMember(workspaceMemberId),
        },
        scoreId,
        draft: draft ?? undefined,
        name,
        description,
        freezeOnClosedWon,
      }),
    );
  }

  @Mutation(() => RoboostScoreDTO)
  async roboostPublishScore(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('scoreId', { type: () => String }) scoreId: string,
    @Args('draft', { type: () => GraphQLJSON }) draft: unknown,
    @Args('note', { type: () => String, nullable: true }) note: string | null,
  ) {
    const { score } = await this.roboostScoreService.publish({
      scope: {
        workspaceId: workspace.id,
        workspaceMemberId: requireMember(workspaceMemberId),
      },
      scoreId,
      draft,
      note,
    });

    return toScoreDTO(score);
  }

  @Mutation(() => RoboostScoreDTO)
  async roboostSetScoreActive(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('scoreId', { type: () => String }) scoreId: string,
    @Args('isActive', { type: () => Boolean }) isActive: boolean,
  ) {
    return toScoreDTO(
      await this.roboostScoreService.setActive({
        scope: {
          workspaceId: workspace.id,
          workspaceMemberId: requireMember(workspaceMemberId),
        },
        scoreId,
        isActive,
      }),
    );
  }

  @Mutation(() => RoboostScoreDTO)
  async roboostRecalculateScore(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('scoreId', { type: () => String }) scoreId: string,
  ) {
    return toScoreDTO(
      await this.roboostScoreService.recalculateNow(
        {
          workspaceId: workspace.id,
          workspaceMemberId: requireMember(workspaceMemberId),
        },
        scoreId,
      ),
    );
  }

  @Mutation(() => Boolean)
  async roboostDeleteScore(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('scoreId', { type: () => String }) scoreId: string,
    @Args('deleteProperty', { type: () => Boolean }) deleteProperty: boolean,
  ) {
    return this.roboostScoreService.deleteScore({
      scope: {
        workspaceId: workspace.id,
        workspaceMemberId: requireMember(workspaceMemberId),
      },
      scoreId,
      deleteProperty,
    });
  }

  @Mutation(() => RoboostScoreDTO)
  async roboostChangeScoreProperty(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('scoreId', { type: () => String }) scoreId: string,
    @Args('propertyMode', { type: () => String }) propertyMode: string,
    @Args('propertyLabel', { type: () => String, nullable: true })
    propertyLabel: string | null,
    @Args('fieldMetadataId', { type: () => String, nullable: true })
    fieldMetadataId: string | null,
  ) {
    return toScoreDTO(
      await this.roboostScoreService.changeProperty({
        scope: {
          workspaceId: workspace.id,
          workspaceMemberId: requireMember(workspaceMemberId),
        },
        scoreId,
        property: toPropertyChoice(
          propertyMode,
          propertyLabel,
          fieldMetadataId,
        ),
      }),
    );
  }

  @Mutation(() => RoboostScoreDTO)
  async roboostRestoreScoreVersion(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('scoreId', { type: () => String }) scoreId: string,
    @Args('versionId', { type: () => String }) versionId: string,
  ) {
    return toScoreDTO(
      await this.roboostScoreService.restoreVersionAsDraft(
        {
          workspaceId: workspace.id,
          workspaceMemberId: requireMember(workspaceMemberId),
        },
        scoreId,
        versionId,
      ),
    );
  }
}
