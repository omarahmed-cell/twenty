import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type TaskCalculatedFieldUpdates } from 'src/modules/task-calculated-fields/utils/compute-task-calculated-field-updates.util';

export type TaskCalculatedFieldsJobData = {
  workspaceId: string;
  updates: { recordId: string; values: TaskCalculatedFieldUpdates }[];
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class TaskCalculatedFieldsJob {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  @Process(TaskCalculatedFieldsJob.name)
  async handle({
    workspaceId,
    updates,
  }: TaskCalculatedFieldsJobData): Promise<void> {
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      // Server-written values; the user's own change already has its timeline entry
      const repository = this.workspaceOrmManager.getRepository(
        'task',
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );

      for (const { recordId, values } of updates) {
        await repository.update({ id: recordId }, values);
      }
    }, buildSystemAuthContext(workspaceId));
  }
}
