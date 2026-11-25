import { Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { RoboostNotificationService } from 'src/modules/roboost-notification/services/roboost-notification.service';
import { RoboostDuplicateService } from 'src/modules/roboost-merge/services/roboost-duplicate.service';
import { type RoboostMergeActor } from 'src/modules/roboost-merge/types/roboost-merge.type';

export type RoboostBulkMergeJobData = {
  workspaceId: string;
  bulkMergeId: string;
  actor: RoboostMergeActor;
  objectNamePlural: string;
};

@Processor(MessageQueue.workspaceQueue)
export class RoboostBulkMergeJob {
  private readonly logger = new Logger(RoboostBulkMergeJob.name);

  constructor(
    private readonly roboostDuplicateService: RoboostDuplicateService,
    private readonly roboostNotificationService: RoboostNotificationService,
  ) {}

  @Process(RoboostBulkMergeJob.name)
  async handle({
    workspaceId,
    bulkMergeId,
    actor,
    objectNamePlural,
  }: RoboostBulkMergeJobData): Promise<void> {
    try {
      const bulk = await this.roboostDuplicateService.runBulkMerge({
        workspaceId,
        bulkMergeId,
        actor,
      });
      const mergedCount = bulk.results.filter(
        (result) => result.status === 'MERGED',
      ).length;

      if (actor.workspaceMemberId !== null) {
        await this.roboostNotificationService.notify({
          workspaceId,
          recipientWorkspaceMemberId: actor.workspaceMemberId,
          type: 'merge',
          subtype: 'bulk_merge_done',
          title: `Bulk merge finished: ${mergedCount} of ${bulk.total} pairs merged`,
          body:
            bulk.failedCount > 0
              ? `${bulk.failedCount} pairs could not be merged. Open the bulk merge log for details.`
              : 'Every pair was merged. You can unmerge any of them from Merge history for 30 days.',
          actorWorkspaceMemberId: actor.workspaceMemberId,
          actorName: actor.name,
          target: {
            path: `/objects/${objectNamePlural}?duplicates=open&bulk=${bulkMergeId}`,
            actionLabel: 'View bulk merge log',
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Workspace ${workspaceId}: bulk merge ${bulkMergeId} failed: ${(error as Error).message}`,
      );
      await this.roboostDuplicateService.markBulkMergeFailed(
        workspaceId,
        bulkMergeId,
      );
    }
  }
}
