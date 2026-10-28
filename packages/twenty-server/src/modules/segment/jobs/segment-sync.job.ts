import { Scope } from '@nestjs/common';

import { type SegmentTargetObject } from 'twenty-shared/types';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { SEGMENT_TARGET_OBJECTS } from 'src/modules/segment/constants/segment-target-object-configs.constant';
import { SegmentMembershipOptionsService } from 'src/modules/segment/services/segment-membership-options.service';
import { SegmentMembershipSyncService } from 'src/modules/segment/services/segment-membership-sync.service';

export type SegmentSyncJobData = { workspaceId: string } & (
  | { type: 'SYNC_OPTIONS' }
  | {
      type: 'SYNC_MEMBERS';
      segmentIds: string[];
      recordIdsByTargetObject: Partial<Record<SegmentTargetObject, string[]>>;
    }
  | { type: 'SEGMENTS_DELETED'; segmentIds: string[] }
  | {
      type: 'SEGMENTS_RESTORED';
      segments: { id: string; deletedAt: string }[];
    }
  | { type: 'TARGETS_DESTROYED'; targetObject: SegmentTargetObject }
);

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class SegmentSyncJob {
  constructor(
    private readonly segmentMembershipOptionsService: SegmentMembershipOptionsService,
    private readonly segmentMembershipSyncService: SegmentMembershipSyncService,
  ) {}

  @Process(SegmentSyncJob.name)
  async handle(data: SegmentSyncJobData): Promise<void> {
    const { workspaceId } = data;

    switch (data.type) {
      case 'SYNC_OPTIONS':
        await this.segmentMembershipOptionsService.syncOptions(workspaceId);

        return;
      case 'SYNC_MEMBERS':
        for (const targetObject of SEGMENT_TARGET_OBJECTS) {
          await this.segmentMembershipSyncService.syncRecordMemberships({
            workspaceId,
            targetObject,
            recordIds: data.recordIdsByTargetObject[targetObject] ?? [],
          });
        }
        await this.segmentMembershipSyncService.syncMemberCounts({
          workspaceId,
          segmentIds: data.segmentIds,
        });

        return;
      // Members go to the trash with their segment, which fires "Removed from segment"
      case 'SEGMENTS_DELETED':
        await this.segmentMembershipSyncService.softDeleteSegmentMembers({
          workspaceId,
          segmentIds: data.segmentIds,
        });
        await this.segmentMembershipOptionsService.syncOptions(workspaceId);

        return;
      // Options go first so the restored members' mirror values are valid enum values
      case 'SEGMENTS_RESTORED':
        await this.segmentMembershipOptionsService.syncOptions(workspaceId);
        await this.segmentMembershipSyncService.restoreSegmentMembers({
          workspaceId,
          segments: data.segments,
        });

        return;
      // Destroying a record cascades to its SegmentMember rows without events
      case 'TARGETS_DESTROYED':
        await this.segmentMembershipSyncService.syncAllMemberCounts({
          workspaceId,
          targetObject: data.targetObject,
        });

        return;
    }
  }
}
