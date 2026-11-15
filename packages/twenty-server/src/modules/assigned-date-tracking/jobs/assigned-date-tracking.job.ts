import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

export type AssignedDateTrackingJobData = {
  workspaceId: string;
  objectNameSingular: string;
  updates: { recordId: string; values: Record<string, string> }[];
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class AssignedDateTrackingJob {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  @Process(AssignedDateTrackingJob.name)
  async handle({
    workspaceId,
    objectNameSingular,
    updates,
  }: AssignedDateTrackingJobData): Promise<void> {
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      // The owner change already has its own timeline entry
      const repository = this.workspaceOrmManager.getRepository(
        objectNameSingular,
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );

      for (const { recordId, values } of updates) {
        await repository.update({ id: recordId }, values);
      }
    }, buildSystemAuthContext(workspaceId));
  }
}
