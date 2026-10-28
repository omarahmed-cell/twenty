import { Injectable } from '@nestjs/common';

import { type SegmentTargetObject } from 'twenty-shared/types';
import {
  getSegmentMembershipOptionValue,
  isDefined,
} from 'twenty-shared/utils';
import { In } from 'typeorm';

import { CommonFindManyQueryRunnerService } from 'src/engine/api/common/common-query-runners/common-find-many-query-runner.service';
import { type ObjectRecordFilter } from 'src/engine/api/graphql/workspace-query-builder/interfaces/object-record.interface';
import { ActorFromAuthContextService } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { CommonApiContextBuilderService } from 'src/engine/core-modules/record-crud/services/common-api-context-builder.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { SEGMENT_MEMBERSHIP_MAX_RECORD_COUNT } from 'src/modules/segment/constants/segment-membership-max-record-count.constant';
import { SEGMENT_MEMBERSHIP_PAGE_SIZE } from 'src/modules/segment/constants/segment-membership-page-size.constant';
import { SEGMENT_TARGET_OBJECT_CONFIGS } from 'src/modules/segment/constants/segment-target-object-configs.constant';
import {
  SegmentException,
  SegmentExceptionCode,
} from 'src/modules/segment/exceptions/segment.exception';
import { SegmentMembershipOptionsService } from 'src/modules/segment/services/segment-membership-options.service';
import { SegmentMembershipSyncService } from 'src/modules/segment/services/segment-membership-sync.service';
import { type SegmentMemberWorkspaceEntity } from 'src/modules/segment/standard-objects/segment-member.workspace-entity';
import { type SegmentWorkspaceEntity } from 'src/modules/segment/standard-objects/segment.workspace-entity';
import { type SegmentMembershipOperation } from 'src/modules/segment/types/segment-membership-operation.type';

@Injectable()
export class SegmentMembershipService {
  constructor(
    private readonly commonApiContextBuilderService: CommonApiContextBuilderService,
    private readonly commonFindManyQueryRunnerService: CommonFindManyQueryRunnerService,
    private readonly actorFromAuthContextService: ActorFromAuthContextService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly segmentMembershipOptionsService: SegmentMembershipOptionsService,
    private readonly segmentMembershipSyncService: SegmentMembershipSyncService,
  ) {}

  // SegmentMember rows are the source of truth and the workflow trigger source; the mirror
  // field and the segment size are rewritten here so the caller sees them right away
  async updateSegmentMembership({
    authContext,
    operation,
    segmentId,
    objectNameSingular,
    recordFilter,
  }: {
    authContext: WorkspaceAuthContext;
    operation: SegmentMembershipOperation;
    segmentId: string;
    objectNameSingular: string;
    recordFilter: Partial<ObjectRecordFilter>;
  }): Promise<{ affectedRecordCount: number; memberCount: number }> {
    const workspaceId = authContext.workspace.id;

    const segment = await this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager
          .getRepositoryWithContextPermissions<SegmentWorkspaceEntity>(
            'segment',
          )
          .findOne({
            select: { id: true, targetObject: true },
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

    if (!isDefined(segment.targetObject)) {
      throw new SegmentException(
        `Segment ${segmentId} has no target object`,
        SegmentExceptionCode.SEGMENT_TARGET_OBJECT_MISSING,
      );
    }

    const targetObject = segment.targetObject;
    const { objectNameSingular: segmentObjectNameSingular } =
      SEGMENT_TARGET_OBJECT_CONFIGS[targetObject];

    if (segmentObjectNameSingular !== objectNameSingular) {
      throw new SegmentException(
        `Segment ${segmentId} targets ${segmentObjectNameSingular}, not ${objectNameSingular}`,
        SegmentExceptionCode.SEGMENT_TARGET_OBJECT_MISMATCH,
      );
    }

    const recordIds = await this.findSelectedRecordIds({
      authContext,
      objectNameSingular,
      recordFilter,
    });

    const affectedRecordIds =
      operation === 'ADD'
        ? await this.addMembers({
            authContext,
            segmentId,
            targetObject,
            recordIds,
          })
        : await this.removeMembers({
            authContext,
            segmentId,
            targetObject,
            recordIds,
          });

    await this.segmentMembershipSyncService.syncRecordMemberships({
      workspaceId,
      targetObject,
      recordIds: affectedRecordIds,
    });
    await this.segmentMembershipSyncService.syncMemberCounts({
      workspaceId,
      segmentIds: [segmentId],
    });

    const memberCount =
      await this.workspaceOrmManager.executeInWorkspaceContext(
        () =>
          this.workspaceOrmManager
            .getRepositoryWithContextPermissions<SegmentMemberWorkspaceEntity>(
              'segmentMember',
            )
            .count({ where: { segmentId } }),
        authContext,
      );

    return { affectedRecordCount: affectedRecordIds.length, memberCount };
  }

  private async addMembers({
    authContext,
    segmentId,
    targetObject,
    recordIds,
  }: {
    authContext: WorkspaceAuthContext;
    segmentId: string;
    targetObject: SegmentTargetObject;
    recordIds: string[];
  }): Promise<string[]> {
    const workspaceId = authContext.workspace.id;
    const { memberJoinColumnName, segmentMembershipFieldUniversalIdentifier } =
      SEGMENT_TARGET_OBJECT_CONFIGS[targetObject];

    // The segment listener normally adds the option; a segment used right after creation
    // can get here first, and the mirror write needs the enum value to exist
    const hasOption = await this.segmentMembershipOptionsService.hasOption({
      workspaceId,
      fieldUniversalIdentifier: segmentMembershipFieldUniversalIdentifier,
      optionValue: getSegmentMembershipOptionValue(segmentId),
    });

    if (!hasOption) {
      await this.segmentMembershipOptionsService.syncOptions(workspaceId);
    }

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const memberRepository =
        this.workspaceOrmManager.getRepositoryWithContextPermissions<SegmentMemberWorkspaceEntity>(
          'segmentMember',
        );

      const existingMembers = await memberRepository.find({
        select: { [memberJoinColumnName]: true },
        where: { segmentId, [memberJoinColumnName]: In(recordIds) },
      });

      const existingRecordIds = new Set(
        existingMembers.map((member) => member[memberJoinColumnName]),
      );
      const newRecordIds = recordIds.filter(
        (recordId) => !existingRecordIds.has(recordId),
      );

      for (
        let start = 0;
        start < newRecordIds.length;
        start += SEGMENT_MEMBERSHIP_PAGE_SIZE
      ) {
        const members =
          await this.actorFromAuthContextService.injectActorFieldsOnCreate({
            records: newRecordIds
              .slice(start, start + SEGMENT_MEMBERSHIP_PAGE_SIZE)
              .map((recordId) => ({
                segmentId,
                [memberJoinColumnName]: recordId,
              })),
            objectMetadataNameSingular: 'segmentMember',
            authContext,
          });

        await memberRepository.insert(members, { onConflictDoNothing: true });
      }

      return newRecordIds;
    }, authContext);
  }

  private async removeMembers({
    authContext,
    segmentId,
    targetObject,
    recordIds,
  }: {
    authContext: WorkspaceAuthContext;
    segmentId: string;
    targetObject: SegmentTargetObject;
    recordIds: string[];
  }): Promise<string[]> {
    const { memberJoinColumnName } =
      SEGMENT_TARGET_OBJECT_CONFIGS[targetObject];

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const memberRepository =
        this.workspaceOrmManager.getRepositoryWithContextPermissions<SegmentMemberWorkspaceEntity>(
          'segmentMember',
        );

      const members = await memberRepository.find({
        select: { id: true, [memberJoinColumnName]: true },
        where: { segmentId, [memberJoinColumnName]: In(recordIds) },
      });

      if (members.length === 0) {
        return [];
      }

      await memberRepository.softDelete({
        id: In(members.map(({ id }) => id)),
      });

      return members.map((member) => member[memberJoinColumnName] as string);
    }, authContext);
  }

  private async findSelectedRecordIds({
    authContext,
    objectNameSingular,
    recordFilter,
  }: {
    authContext: WorkspaceAuthContext;
    objectNameSingular: string;
    recordFilter: Partial<ObjectRecordFilter>;
  }): Promise<string[]> {
    const { queryRunnerContext } =
      await this.commonApiContextBuilderService.build({
        authContext,
        objectName: objectNameSingular,
      });

    const recordIds: string[] = [];
    let after: string | undefined;

    while (recordIds.length <= SEGMENT_MEMBERSHIP_MAX_RECORD_COUNT) {
      const {
        results: { records, pageInfo },
      } = await this.commonFindManyQueryRunnerService.execute(
        {
          filter: recordFilter,
          selectedFields: { edges: { node: { id: true } } },
          first: SEGMENT_MEMBERSHIP_PAGE_SIZE,
          after,
        },
        queryRunnerContext,
      );

      recordIds.push(...records.map((record) => record.id as string));

      if (!pageInfo.hasNextPage) {
        return recordIds;
      }

      if (!isDefined(pageInfo.endCursor) || pageInfo.endCursor === after) {
        throw new SegmentException(
          'Record pagination did not advance',
          SegmentExceptionCode.SEGMENT_MEMBERSHIP_UPDATE_FAILED,
        );
      }

      after = pageInfo.endCursor;
    }

    throw new SegmentException(
      `More than ${SEGMENT_MEMBERSHIP_MAX_RECORD_COUNT} records match the selection`,
      SegmentExceptionCode.SEGMENT_TOO_MANY_RECORDS,
    );
  }
}
