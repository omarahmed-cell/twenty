import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { EmailReplySyncService } from 'src/modules/unified-email/services/email-reply-sync.service';

@Command({
  name: 'unified-email:reply-sync',
  description:
    'Read new messages in logged Gmail threads now (the cron does this every 5 minutes) and print what happened.',
})
export class EmailReplySyncCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly emailReplySyncService: EmailReplySyncService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (options.dryRun) {
      const threads =
        await this.emailReplySyncService.findLoggedThreads(workspaceId);

      this.logger.log(
        `RESULT ${JSON.stringify({ loggedThreads: threads.length })}`,
      );

      return;
    }

    const summary = await this.emailReplySyncService.syncWorkspace(workspaceId);

    this.logger.log(`RESULT ${JSON.stringify(summary)}`);
  }
}
