import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type EmailDerivedFieldUpdates } from 'src/modules/unified-email/utils/compute-email-derived-field-updates.util';

export type EmailDerivedFieldsJobData = {
  workspaceId: string;
  updates: { recordId: string; values: EmailDerivedFieldUpdates }[];
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class EmailDerivedFieldsJob {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  @Process(EmailDerivedFieldsJob.name)
  async handle({ workspaceId, updates }: EmailDerivedFieldsJobData) {
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository = this.workspaceOrmManager.getRepository(
        'email',
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );

      for (const { recordId, values } of updates) {
        await repository.update({ id: recordId }, values);
      }
    }, buildSystemAuthContext(workspaceId));
  }
}
