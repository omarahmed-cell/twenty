import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import {
  type RoboostAssignActor,
  type RoboostAssignment,
  RoboostAssignNotificationService,
} from 'src/modules/roboost-notification/services/roboost-assign-notification.service';

export type RoboostAssignNotificationJobData = {
  workspaceId: string;
  objectMetadataId: string;
  objectNameSingular: string;
  objectNamePlural: string;
  actor: RoboostAssignActor;
  assignments: RoboostAssignment[];
};

@Processor(MessageQueue.workspaceQueue)
export class RoboostAssignNotificationJob {
  constructor(
    private readonly roboostAssignNotificationService: RoboostAssignNotificationService,
  ) {}

  @Process(RoboostAssignNotificationJob.name)
  async handle(data: RoboostAssignNotificationJobData): Promise<void> {
    await this.roboostAssignNotificationService.notifyAssignments(data);
  }
}
