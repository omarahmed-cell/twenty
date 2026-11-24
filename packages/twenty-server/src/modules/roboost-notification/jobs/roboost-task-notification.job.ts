import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { RoboostTaskNotificationService } from 'src/modules/roboost-notification/services/roboost-task-notification.service';

export type RoboostTaskChange = {
  taskId: string;
  title: string | null;
  dueAt: string | null;
  assigneeId: string | null;
  isClosed: boolean;
  isNew: boolean;
  dueChanged: boolean;
  // Set when the assignee changed to someone other than the person making the change
  assignedBy: { workspaceMemberId: string | null; name: string } | null;
};

export type RoboostTaskNotificationJobData = {
  workspaceId: string;
  changes: RoboostTaskChange[];
};

@Processor(MessageQueue.workspaceQueue)
export class RoboostTaskNotificationJob {
  constructor(
    private readonly roboostTaskNotificationService: RoboostTaskNotificationService,
  ) {}

  @Process(RoboostTaskNotificationJob.name)
  async handle({ workspaceId, changes }: RoboostTaskNotificationJobData) {
    for (const change of changes) {
      if (change.isNew || change.dueChanged || change.isClosed) {
        await this.roboostTaskNotificationService.syncReminder({
          workspaceId,
          taskId: change.taskId,
          dueAt: change.dueAt,
          isClosed: change.isClosed,
          isNew: change.isNew,
        });
      }

      if (
        isDefined(change.assignedBy) &&
        isNonEmptyString(change.assigneeId) &&
        !change.isClosed
      ) {
        await this.roboostTaskNotificationService.notifyTaskAssigned({
          workspaceId,
          task: {
            id: change.taskId,
            title: change.title,
            dueAt: change.dueAt,
            assigneeId: change.assigneeId,
          },
          actorWorkspaceMemberId: change.assignedBy.workspaceMemberId,
          actorName: change.assignedBy.name,
        });
      }
    }
  }
}
