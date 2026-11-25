import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Args, Float, Int, Mutation, Query } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';
import {
  type RoboostDuplicateConfidence,
  type RoboostDuplicatePairStatus,
} from 'twenty-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import {
  RoboostBulkMergeJob,
  type RoboostBulkMergeJobData,
} from 'src/modules/roboost-merge/jobs/roboost-bulk-merge.job';
import { RoboostDuplicateService } from 'src/modules/roboost-merge/services/roboost-duplicate.service';
import { RoboostMergeActorService } from 'src/modules/roboost-merge/services/roboost-merge-actor.service';
import { RoboostMergeLogService } from 'src/modules/roboost-merge/services/roboost-merge-log.service';
import { RoboostMergeService } from 'src/modules/roboost-merge/services/roboost-merge.service';

const PAIR_STATUSES: RoboostDuplicatePairStatus[] = [
  'OPEN',
  'REJECTED',
  'MERGED',
];

const toCsvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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
export class RoboostDuplicateResolver {
  constructor(
    private readonly roboostDuplicateService: RoboostDuplicateService,
    private readonly roboostMergeActorService: RoboostMergeActorService,
    private readonly roboostMergeLogService: RoboostMergeLogService,
    private readonly roboostMergeService: RoboostMergeService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  private actor(workspaceId: string, workspaceMemberId: string | undefined) {
    return this.roboostMergeActorService.resolve(
      workspaceId,
      workspaceMemberId,
    );
  }

  @Query(() => GraphQLJSON)
  async roboostDuplicatePairs(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
    @Args('status', { type: () => String }) status: string,
    @Args('confidence', { type: () => String, nullable: true })
    confidence: string | null,
    @Args('search', { type: () => String, nullable: true })
    search: string | null,
    @Args('sort', { type: () => String, nullable: true }) sort: string | null,
    @Args('offset', { type: () => Int, nullable: true }) offset: number | null,
    @Args('limit', { type: () => Int, nullable: true }) limit: number | null,
  ) {
    return this.roboostDuplicateService.listPairsPage({
      workspaceId: workspace.id,
      actor: await this.actor(workspace.id, workspaceMemberId),
      objectName,
      status: PAIR_STATUSES.includes(status as RoboostDuplicatePairStatus)
        ? (status as RoboostDuplicatePairStatus)
        : 'OPEN',
      confidence: ['EXACT', 'HIGH', 'POSSIBLE'].includes(confidence ?? '')
        ? (confidence as RoboostDuplicateConfidence)
        : null,
      search,
      sort:
        sort === 'newest' || sort === 'oldest' || sort === 'confidence'
          ? sort
          : 'confidence',
      offset: offset ?? 0,
      limit: limit ?? undefined,
    });
  }

  @Query(() => GraphQLJSON)
  async roboostDuplicateOverview(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
  ) {
    const actor = await this.actor(workspace.id, workspaceMemberId);
    const mergeObject = this.roboostMergeService.assertMergeObject(objectName);
    const mergeScope = await this.roboostDuplicateService.getMergeScope(
      workspace.id,
      actor.workspaceMemberId,
      mergeObject,
    );

    return {
      isAvailable: await this.roboostDuplicateService.tablesExist(workspace.id),
      mergeScope,
      openCount:
        mergeScope === 'NONE'
          ? 0
          : await this.roboostDuplicateService.openPairCount(
              workspace.id,
              actor,
              objectName,
            ),
      settings: await this.roboostDuplicateService.getRuleSettings(
        workspace.id,
        mergeObject,
      ),
    };
  }

  @Mutation(() => Int)
  async roboostScanDuplicates(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
  ) {
    return this.roboostDuplicateService.scanNow({
      workspaceId: workspace.id,
      actor: await this.actor(workspace.id, workspaceMemberId),
      objectName,
    });
  }

  @Mutation(() => GraphQLJSON)
  async roboostSaveDuplicateRules(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
    @Args('rules', { type: () => GraphQLJSON }) rules: Record<string, boolean>,
    @Args('similarityThreshold', { type: () => Float, nullable: true })
    similarityThreshold: number | null,
  ) {
    return this.roboostDuplicateService.saveRuleSettings({
      workspaceId: workspace.id,
      actor: await this.actor(workspace.id, workspaceMemberId),
      objectName,
      rules,
      similarityThreshold,
    });
  }

  @Mutation(() => Boolean)
  async roboostSetDuplicatePairRejected(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('pairId', { type: () => String }) pairId: string,
    @Args('isRejected', { type: () => Boolean }) isRejected: boolean,
  ) {
    return this.roboostDuplicateService.setRejected({
      workspaceId: workspace.id,
      actor: await this.actor(workspace.id, workspaceMemberId),
      pairId,
      isRejected,
    });
  }

  @Query(() => GraphQLJSON)
  async roboostBulkMergePreview(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
    @Args('pairIds', { type: () => [String], nullable: true })
    pairIds: string[] | null,
  ) {
    return this.roboostDuplicateService.bulkPreview({
      workspaceId: workspace.id,
      actor: await this.actor(workspace.id, workspaceMemberId),
      objectName,
      pairIds,
    });
  }

  @Mutation(() => String)
  async roboostStartBulkMerge(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
    @Args('objectNamePlural', { type: () => String }) objectNamePlural: string,
    @Args('pairIds', { type: () => [String] }) pairIds: string[],
  ) {
    const actor = await this.actor(workspace.id, workspaceMemberId);
    const { bulkMergeId } = await this.roboostDuplicateService.startBulkMerge({
      workspaceId: workspace.id,
      actor,
      objectName,
      pairIds,
    });

    await this.messageQueueService.add<RoboostBulkMergeJobData>(
      RoboostBulkMergeJob.name,
      { workspaceId: workspace.id, bulkMergeId, actor, objectNamePlural },
    );

    return bulkMergeId;
  }

  @Query(() => GraphQLJSON)
  async roboostBulkMerges(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
  ) {
    const actor = await this.actor(workspace.id, workspaceMemberId);
    const mergeObject = this.roboostMergeService.assertMergeObject(objectName);

    if (
      (await this.roboostDuplicateService.getMergeScope(
        workspace.id,
        actor.workspaceMemberId,
        mergeObject,
      )) === 'NONE'
    ) {
      return [];
    }

    return this.roboostDuplicateService.listBulkMerges(
      workspace.id,
      objectName,
    );
  }

  @Mutation(() => Int)
  async roboostCheckImportedDuplicates(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('objectName', { type: () => String }) objectName: string,
    @Args('importId', { type: () => String, nullable: true })
    importId: string | null,
    @Args('recordIds', { type: () => [String] }) recordIds: string[],
  ) {
    return this.roboostDuplicateService.checkImportedRecords({
      workspaceId: workspace.id,
      objectName,
      importId,
      recordIds,
    });
  }

  // Admins, or users with Merge = All on at least one merge object
  @Query(() => String)
  async roboostMergeHistoryCsv(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('objectName', { type: () => String }) objectName: string,
  ) {
    const actor = await this.actor(workspace.id, workspaceMemberId);
    const mergeObject = this.roboostMergeService.assertMergeObject(objectName);

    if (
      (await this.roboostDuplicateService.getMergeScope(
        workspace.id,
        actor.workspaceMemberId,
        mergeObject,
      )) !== 'ALL'
    ) {
      throw new ForbiddenException(
        'Exporting merge history needs Merge = All on this object',
      );
    }

    const header = [
      'Merge ID',
      'Object',
      'Surviving record ID',
      'Surviving record',
      'Merged record ID',
      'Merged record',
      'Merged by',
      'Merged at',
      'Bulk',
      'Status',
      'Unmerged at',
      'Unmerged by',
    ];
    const rows = (await this.roboostMergeLogService.listAll(workspace.id))
      .filter((row) => row.objectName === objectName)
      .map((row) => [
        row.id,
        row.objectName,
        row.primaryId,
        row.primaryName,
        row.secondaryId,
        row.secondaryName,
        row.mergedByName,
        row.mergedAt,
        row.isBulk ? 'Yes' : 'No',
        row.status,
        row.unmergedAt ?? '',
        row.unmergedByName,
      ]);

    return [header, ...rows]
      .map((row) => row.map(toCsvCell).join(','))
      .join('\n');
  }
}
