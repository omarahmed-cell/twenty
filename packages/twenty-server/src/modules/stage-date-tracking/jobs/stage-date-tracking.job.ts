import { Scope } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import {
  type CalculatedFieldChange,
  TimelineActivityService,
} from 'src/modules/timeline/services/timeline-activity.service';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { type StageDateUpdates } from 'src/modules/stage-date-tracking/types/stage-date-tracking-config.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

const toTime = (value: unknown): number | null =>
  isDefined(value) ? new Date(value as string | Date).getTime() : null;

const isSameStageDate = (before: unknown, after: unknown) =>
  toTime(before) === toTime(after);

export type StageDateTrackingJobData = {
  workspaceId: string;
  objectNameSingular: string;
  updates: { recordId: string; values: StageDateUpdates }[];
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class StageDateTrackingJob {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly timelineActivityService: TimelineActivityService,
  ) {}

  @Process(StageDateTrackingJob.name)
  async handle({
    workspaceId,
    objectNameSingular,
    updates,
  }: StageDateTrackingJobData): Promise<void> {
    const changes = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
        // Stage dates are bookkeeping for the stage change, so they skip record events and triggers
        const repository = this.workspaceOrmManager.getRepository(
          objectNameSingular,
          { shouldBypassPermissionChecks: true },
          { shouldSkipEventEmission: true },
        );
        const writtenChanges: CalculatedFieldChange[] = [];

        for (const { recordId, values } of updates) {
          const current = await repository.findOne({
            select: ['id', ...Object.keys(values)],
            where: { id: recordId },
          });

          await repository.update({ id: recordId }, values);

          writtenChanges.push(
            ...Object.entries(values)
              .filter(
                ([fieldName, after]) =>
                  !isSameStageDate(current?.[fieldName], after),
              )
              .map(([fieldName, after]) => ({
                recordId,
                fieldName,
                before: current?.[fieldName] ?? null,
                after,
              })),
          );
        }

        return writtenChanges;
      },
      buildSystemAuthContext(workspaceId),
    );

    await this.timelineActivityService.recordCalculatedFieldChanges({
      workspaceId,
      objectNameSingular,
      changes,
    });
  }
}
