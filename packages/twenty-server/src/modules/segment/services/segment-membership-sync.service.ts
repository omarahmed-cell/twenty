import { Injectable } from '@nestjs/common';

import { type SegmentTargetObject } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { In, MoreThanOrEqual } from 'typeorm';

import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { SEGMENT_TARGET_OBJECT_CONFIGS } from 'src/modules/segment/constants/segment-target-object-configs.constant';
import { type SegmentMemberWorkspaceEntity } from 'src/modules/segment/standard-objects/segment-member.workspace-entity';
import { type SegmentWorkspaceEntity } from 'src/modules/segment/standard-objects/segment.workspace-entity';
import { computeSegmentMembershipValuesByRecordId } from 'src/modules/segment/utils/compute-segment-membership-values-by-record-id.util';

@Injectable()
export class SegmentMembershipSyncService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  // Rewrites the read-only Segment Membership mirror of the given records from their
  // SegmentMember rows; the mirror is never the source of truth
  async syncRecordMemberships({
    workspaceId,
    targetObject,
    recordIds,
  }: {
    workspaceId: string;
    targetObject: SegmentTargetObject;
    recordIds: string[];
  }): Promise<void> {
    const uniqueRecordIds = [...new Set(recordIds)];

    if (uniqueRecordIds.length === 0) {
      return;
    }

    const { objectNameSingular, memberJoinColumnName } =
      SEGMENT_TARGET_OBJECT_CONFIGS[targetObject];

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const members = await this.workspaceOrmManager
        .getRepository<SegmentMemberWorkspaceEntity>('segmentMember', {
          shouldBypassPermissionChecks: true,
        })
        .find({
          select: { segmentId: true, [memberJoinColumnName]: true },
          where: { [memberJoinColumnName]: In(uniqueRecordIds) },
        });

      const segmentIds = [
        ...new Set(members.map(({ segmentId }) => segmentId)),
      ].filter(isDefined);

      const activeSegments =
        segmentIds.length === 0
          ? []
          : await this.workspaceOrmManager
              .getRepository<SegmentWorkspaceEntity>('segment', {
                shouldBypassPermissionChecks: true,
              })
              .find({
                select: { id: true },
                where: { id: In(segmentIds), targetObject },
              });

      const valuesByRecordId = computeSegmentMembershipValuesByRecordId({
        recordIds: uniqueRecordIds,
        members: members
          .filter((member) => isDefined(member.segmentId))
          .map((member) => ({
            recordId: member[memberJoinColumnName] as string,
            segmentId: member.segmentId as string,
          })),
        activeSegmentIds: new Set(activeSegments.map(({ id }) => id)),
      });

      const recordIdsByValues = new Map<string, string[]>();

      for (const [recordId, values] of valuesByRecordId) {
        const key = values.join(',');

        recordIdsByValues.set(key, [
          ...(recordIdsByValues.get(key) ?? []),
          recordId,
        ]);
      }

      // Membership changes already surface as SegmentMember events, so the mirror write
      // stays out of timelines and record-updated triggers
      const targetRepository = this.workspaceOrmManager.getRepository(
        objectNameSingular,
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );

      for (const [key, groupRecordIds] of recordIdsByValues) {
        await targetRepository.update(
          { id: In(groupRecordIds) },
          { segmentMembership: key === '' ? null : key.split(',') },
        );
      }
    }, buildSystemAuthContext(workspaceId));
  }

  async syncMemberCounts({
    workspaceId,
    segmentIds,
  }: {
    workspaceId: string;
    segmentIds: string[];
  }): Promise<void> {
    const uniqueSegmentIds = [...new Set(segmentIds)];

    if (uniqueSegmentIds.length === 0) {
      return;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const segmentRepository =
        this.workspaceOrmManager.getRepository<SegmentWorkspaceEntity>(
          'segment',
          { shouldBypassPermissionChecks: true },
        );
      const memberRepository =
        this.workspaceOrmManager.getRepository<SegmentMemberWorkspaceEntity>(
          'segmentMember',
          { shouldBypassPermissionChecks: true },
        );

      const segments = await segmentRepository.find({
        select: { id: true, memberCount: true },
        where: { id: In(uniqueSegmentIds) },
      });

      for (const segment of segments) {
        const memberCount = await memberRepository.count({
          where: { segmentId: segment.id },
        });

        if (memberCount !== segment.memberCount) {
          await segmentRepository.update({ id: segment.id }, { memberCount });
        }
      }
    }, buildSystemAuthContext(workspaceId));
  }

  async syncAllMemberCounts({
    workspaceId,
    targetObject,
  }: {
    workspaceId: string;
    targetObject: SegmentTargetObject;
  }): Promise<void> {
    const segments = await this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager
          .getRepository<SegmentWorkspaceEntity>('segment', {
            shouldBypassPermissionChecks: true,
          })
          .find({ select: { id: true }, where: { targetObject } }),
      buildSystemAuthContext(workspaceId),
    );

    await this.syncMemberCounts({
      workspaceId,
      segmentIds: segments.map(({ id }) => id),
    });
  }

  async softDeleteSegmentMembers({
    workspaceId,
    segmentIds,
  }: {
    workspaceId: string;
    segmentIds: string[];
  }): Promise<void> {
    if (segmentIds.length === 0) {
      return;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager
          .getRepository<SegmentMemberWorkspaceEntity>('segmentMember', {
            shouldBypassPermissionChecks: true,
          })
          .softDelete({ segmentId: In(segmentIds) }),
      buildSystemAuthContext(workspaceId),
    );
  }

  // Brings back only the members trashed along with the segment, not ones removed earlier
  async restoreSegmentMembers({
    workspaceId,
    segments,
  }: {
    workspaceId: string;
    segments: { id: string; deletedAt: string }[];
  }): Promise<void> {
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const memberRepository =
        this.workspaceOrmManager.getRepository<SegmentMemberWorkspaceEntity>(
          'segmentMember',
          { shouldBypassPermissionChecks: true },
        );

      for (const segment of segments) {
        await memberRepository.restore({
          segmentId: segment.id,
          deletedAt: MoreThanOrEqual(segment.deletedAt),
        });
      }
    }, buildSystemAuthContext(workspaceId));
  }
}
