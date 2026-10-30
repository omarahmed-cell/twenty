import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { type SegmentTargetObject } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { In, IsNull, Not } from 'typeorm';

import { ActorFromAuthContextService } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { SEGMENT_MEMBERSHIP_MAX_RECORD_COUNT } from 'src/modules/segment/constants/segment-membership-max-record-count.constant';
import { SEGMENT_MEMBERSHIP_PAGE_SIZE } from 'src/modules/segment/constants/segment-membership-page-size.constant';
import { SEGMENT_TARGET_OBJECT_CONFIGS } from 'src/modules/segment/constants/segment-target-object-configs.constant';
import { type SegmentPullResultDTO } from 'src/modules/segment/dtos/segment-pull-result.dto';
import {
  SegmentException,
  SegmentExceptionCode,
} from 'src/modules/segment/exceptions/segment.exception';
import { SegmentMembershipSyncService } from 'src/modules/segment/services/segment-membership-sync.service';
import { SegmentMembershipService } from 'src/modules/segment/services/segment-membership.service';
import { type SegmentMemberWorkspaceEntity } from 'src/modules/segment/standard-objects/segment-member.workspace-entity';
import { type SegmentWorkspaceEntity } from 'src/modules/segment/standard-objects/segment.workspace-entity';
import { computeSegmentPullDiff } from 'src/modules/segment/utils/compute-segment-pull-diff.util';
import {
  resolveSegmentPullRelation,
  type SegmentPullRelation,
} from 'src/modules/segment/utils/resolve-segment-pull-relation.util';

type PullSegment = Pick<
  SegmentWorkspaceEntity,
  'id' | 'targetObject' | 'pulledFromId' | 'pullRelationFieldMetadataId'
>;

const chunkRecordIds = (recordIds: string[]): string[][] =>
  Array.from(
    { length: Math.ceil(recordIds.length / SEGMENT_MEMBERSHIP_PAGE_SIZE) },
    (_, index) =>
      recordIds.slice(
        index * SEGMENT_MEMBERSHIP_PAGE_SIZE,
        (index + 1) * SEGMENT_MEMBERSHIP_PAGE_SIZE,
      ),
  );

// A pull is a snapshot: the target segment only changes when the pull runs again
@Injectable()
export class SegmentPullService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly actorFromAuthContextService: ActorFromAuthContextService,
    private readonly segmentMembershipService: SegmentMembershipService,
    private readonly segmentMembershipSyncService: SegmentMembershipSyncService,
  ) {}

  async pullAssociatedRecordsIntoSegment({
    authContext,
    sourceSegmentId,
    relationFieldMetadataId,
    targetSegmentId,
    newTargetSegmentName,
  }: {
    authContext: WorkspaceAuthContext;
    sourceSegmentId: string;
    relationFieldMetadataId: string;
    targetSegmentId?: string | null;
    newTargetSegmentName?: string | null;
  }): Promise<SegmentPullResultDTO> {
    const sourceSegment = await this.findSegmentOrThrow({
      authContext,
      segmentId: sourceSegmentId,
    });

    const relation = await this.resolveRelation({
      authContext,
      relationFieldMetadataId,
      sourceObject: this.getTargetObjectOrThrow(sourceSegment),
    });

    if (isDefined(targetSegmentId)) {
      const targetSegment = await this.findSegmentOrThrow({
        authContext,
        segmentId: targetSegmentId,
      });

      if (
        targetSegment.id === sourceSegment.id ||
        targetSegment.targetObject !== relation.targetObject
      ) {
        throw new SegmentException(
          `Segment ${targetSegment.id} cannot receive records pulled through ${relationFieldMetadataId}`,
          SegmentExceptionCode.SEGMENT_PULL_TARGET_INVALID,
        );
      }

      await this.workspaceOrmManager.executeInWorkspaceContext(
        () =>
          this.workspaceOrmManager
            .getRepositoryWithContextPermissions<SegmentWorkspaceEntity>(
              'segment',
            )
            .update(
              { id: targetSegment.id },
              {
                pulledFromId: sourceSegment.id,
                pullRelationFieldMetadataId: relationFieldMetadataId,
              },
            ),
        authContext,
      );
    }

    const resolvedTargetSegmentId = isDefined(targetSegmentId)
      ? targetSegmentId
      : await this.createTargetSegment({
          authContext,
          name: newTargetSegmentName,
          targetObject: relation.targetObject,
          pulledFromId: sourceSegment.id,
          pullRelationFieldMetadataId: relationFieldMetadataId,
        });

    return this.reconcile({
      authContext,
      sourceSegment,
      targetSegmentId: resolvedTargetSegmentId,
      relation,
    });
  }

  async refreshSegmentPull({
    authContext,
    segmentId,
  }: {
    authContext: WorkspaceAuthContext;
    segmentId: string;
  }): Promise<SegmentPullResultDTO> {
    const targetSegment = await this.findSegmentOrThrow({
      authContext,
      segmentId,
    });

    if (
      !isDefined(targetSegment.pulledFromId) ||
      !isDefined(targetSegment.pullRelationFieldMetadataId)
    ) {
      throw new SegmentException(
        `Segment ${segmentId} has no pull to refresh`,
        SegmentExceptionCode.SEGMENT_PULL_NOT_CONFIGURED,
      );
    }

    const sourceSegment = await this.findSegmentOrThrow({
      authContext,
      segmentId: targetSegment.pulledFromId,
    });

    const relation = await this.resolveRelation({
      authContext,
      relationFieldMetadataId: targetSegment.pullRelationFieldMetadataId,
      sourceObject: this.getTargetObjectOrThrow(sourceSegment),
    });

    if (targetSegment.targetObject !== relation.targetObject) {
      throw new SegmentException(
        `Segment ${segmentId} no longer holds the records its pull returns`,
        SegmentExceptionCode.SEGMENT_PULL_TARGET_INVALID,
      );
    }

    return this.reconcile({
      authContext,
      sourceSegment,
      targetSegmentId: targetSegment.id,
      relation,
    });
  }

  private async reconcile({
    authContext,
    sourceSegment,
    targetSegmentId,
    relation,
  }: {
    authContext: WorkspaceAuthContext;
    sourceSegment: PullSegment;
    targetSegmentId: string;
    relation: SegmentPullRelation;
  }): Promise<SegmentPullResultDTO> {
    const workspaceId = authContext.workspace.id;
    const sourceObject = this.getTargetObjectOrThrow(sourceSegment);
    const { targetObject } = relation;

    const sourceRecordIds = await this.findMemberRecordIds({
      authContext,
      segmentId: sourceSegment.id,
      targetObject: sourceObject,
    });

    const associatedRecordIds = await this.findAssociatedRecordIds({
      authContext,
      sourceObject,
      sourceRecordIds,
      relation,
    });

    if (associatedRecordIds.length > SEGMENT_MEMBERSHIP_MAX_RECORD_COUNT) {
      throw new SegmentException(
        `More than ${SEGMENT_MEMBERSHIP_MAX_RECORD_COUNT} associated records`,
        SegmentExceptionCode.SEGMENT_TOO_MANY_RECORDS,
      );
    }

    const currentRecordIds = await this.findMemberRecordIds({
      authContext,
      segmentId: targetSegmentId,
      targetObject,
    });

    const { recordIdsToAdd, recordIdsToRemove } = computeSegmentPullDiff({
      associatedRecordIds,
      currentRecordIds,
    });

    const addedRecordIds =
      recordIdsToAdd.length === 0
        ? []
        : await this.segmentMembershipService.addMembers({
            authContext,
            segmentId: targetSegmentId,
            targetObject,
            recordIds: recordIdsToAdd,
          });

    const removedRecordIds =
      recordIdsToRemove.length === 0
        ? []
        : await this.segmentMembershipService.removeMembers({
            authContext,
            segmentId: targetSegmentId,
            targetObject,
            recordIds: recordIdsToRemove,
          });

    await this.segmentMembershipSyncService.syncRecordMemberships({
      workspaceId,
      targetObject,
      recordIds: [...addedRecordIds, ...removedRecordIds],
    });
    await this.segmentMembershipSyncService.syncMemberCounts({
      workspaceId,
      segmentIds: [targetSegmentId],
    });

    return {
      targetSegmentId,
      addedRecordCount: addedRecordIds.length,
      removedRecordCount: removedRecordIds.length,
      memberCount:
        currentRecordIds.length +
        addedRecordIds.length -
        removedRecordIds.length,
    };
  }

  private async findAssociatedRecordIds({
    authContext,
    sourceObject,
    sourceRecordIds,
    relation,
  }: {
    authContext: WorkspaceAuthContext;
    sourceObject: SegmentTargetObject;
    sourceRecordIds: string[];
    relation: SegmentPullRelation;
  }): Promise<string[]> {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const targetRepository =
        this.workspaceOrmManager.getRepositoryWithContextPermissions(
          SEGMENT_TARGET_OBJECT_CONFIGS[relation.targetObject]
            .objectNameSingular,
        );
      const associatedRecordIds = new Set<string>();

      const addTargetRecordIds = async (
        where: Record<string, unknown>,
      ): Promise<void> => {
        const records = await targetRepository.find({
          select: { id: true },
          where,
        });

        records.forEach(({ id }) => associatedRecordIds.add(id as string));
      };

      if (relation.relationType === 'ONE_TO_MANY') {
        for (const recordIds of chunkRecordIds(sourceRecordIds)) {
          await addTargetRecordIds({
            [relation.targetJoinColumnName]: In(recordIds),
          });
        }

        return [...associatedRecordIds];
      }

      const sourceRepository =
        this.workspaceOrmManager.getRepositoryWithContextPermissions(
          SEGMENT_TARGET_OBJECT_CONFIGS[sourceObject].objectNameSingular,
        );
      const linkedRecordIds = new Set<string>();

      for (const recordIds of chunkRecordIds(sourceRecordIds)) {
        const sourceRecords = await sourceRepository.find({
          select: { id: true, [relation.sourceJoinColumnName]: true },
          where: {
            id: In(recordIds),
            [relation.sourceJoinColumnName]: Not(IsNull()),
          },
        });

        sourceRecords.forEach((sourceRecord) =>
          linkedRecordIds.add(
            sourceRecord[relation.sourceJoinColumnName] as string,
          ),
        );
      }

      // Re-reads the linked records to drop deleted ones and ones the caller cannot see
      for (const recordIds of chunkRecordIds([...linkedRecordIds])) {
        await addTargetRecordIds({ id: In(recordIds) });
      }

      return [...associatedRecordIds];
    }, authContext);
  }

  private async findMemberRecordIds({
    authContext,
    segmentId,
    targetObject,
  }: {
    authContext: WorkspaceAuthContext;
    segmentId: string;
    targetObject: SegmentTargetObject;
  }): Promise<string[]> {
    const { memberJoinColumnName } =
      SEGMENT_TARGET_OBJECT_CONFIGS[targetObject];

    const members = await this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager
          .getRepositoryWithContextPermissions<SegmentMemberWorkspaceEntity>(
            'segmentMember',
          )
          .find({
            select: { [memberJoinColumnName]: true },
            where: { segmentId, [memberJoinColumnName]: Not(IsNull()) },
          }),
      authContext,
    );

    return [
      ...new Set(
        members.map((member) => member[memberJoinColumnName] as string),
      ),
    ];
  }

  private async resolveRelation({
    authContext,
    relationFieldMetadataId,
    sourceObject,
  }: {
    authContext: WorkspaceAuthContext;
    relationFieldMetadataId: string;
    sourceObject: SegmentTargetObject;
  }): Promise<SegmentPullRelation> {
    const { flatFieldMetadataMaps, flatObjectMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(
        authContext.workspace.id,
        ['flatFieldMetadataMaps', 'flatObjectMetadataMaps'],
      );

    return resolveSegmentPullRelation({
      relationFieldMetadataId,
      sourceObject,
      flatFieldMetadataMaps,
      flatObjectMetadataMaps,
    });
  }

  private async createTargetSegment({
    authContext,
    name,
    targetObject,
    pulledFromId,
    pullRelationFieldMetadataId,
  }: {
    authContext: WorkspaceAuthContext;
    name?: string | null;
    targetObject: SegmentTargetObject;
    pulledFromId: string;
    pullRelationFieldMetadataId: string;
  }): Promise<string> {
    const trimmedName = name?.trim();

    if (!isNonEmptyString(trimmedName)) {
      throw new SegmentException(
        'Pick a target segment or name a new one',
        SegmentExceptionCode.SEGMENT_PULL_TARGET_INVALID,
      );
    }

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const [segment] =
        await this.actorFromAuthContextService.injectActorFieldsOnCreate({
          records: [
            {
              name: trimmedName,
              targetObject,
              pulledFromId,
              pullRelationFieldMetadataId,
            },
          ],
          objectMetadataNameSingular: 'segment',
          authContext,
        });

      const result = await this.workspaceOrmManager
        .getRepositoryWithContextPermissions<SegmentWorkspaceEntity>('segment')
        .insert(segment);

      return result.identifiers[0].id as string;
    }, authContext);
  }

  private async findSegmentOrThrow({
    authContext,
    segmentId,
  }: {
    authContext: WorkspaceAuthContext;
    segmentId: string;
  }): Promise<PullSegment> {
    const segment = await this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager
          .getRepositoryWithContextPermissions<SegmentWorkspaceEntity>(
            'segment',
          )
          .findOne({
            select: {
              id: true,
              targetObject: true,
              pulledFromId: true,
              pullRelationFieldMetadataId: true,
            },
            where: { id: segmentId },
          }),
      authContext,
    );

    if (!isDefined(segment)) {
      throw new SegmentException(
        `Segment ${segmentId} not found`,
        SegmentExceptionCode.SEGMENT_NOT_FOUND,
      );
    }

    return segment;
  }

  private getTargetObjectOrThrow(segment: PullSegment): SegmentTargetObject {
    if (!isDefined(segment.targetObject)) {
      throw new SegmentException(
        `Segment ${segment.id} has no target object`,
        SegmentExceptionCode.SEGMENT_TARGET_OBJECT_MISSING,
      );
    }

    return segment.targetObject;
  }
}
