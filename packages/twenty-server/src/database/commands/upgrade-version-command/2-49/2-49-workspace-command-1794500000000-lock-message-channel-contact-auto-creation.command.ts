import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';

@RegisteredWorkspaceCommand('2.49.0', 1794500000000)
@Command({
  name: 'upgrade:2-49:lock-message-channel-contact-auto-creation',
  description:
    'Set every mail channel to create no contacts or companies from synced mail',
})
export class LockMessageChannelContactAutoCreationCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace(args: RunOnWorkspaceArgs): Promise<void> {
    await this.up(args);
  }

  async up({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      return;
    }

    const [{ count }] = await dataSource.query(
      `SELECT count(*)::int AS "count" FROM "core"."messageChannel"
      WHERE "workspaceId" = $1
        AND ("contactAutoCreationPolicy" <> 'NONE' OR "isContactAutoCreationEnabled")`,
      [workspaceId],
    );

    if (count === 0) {
      return;
    }

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would lock contact auto-creation on ${count} mail channel(s)`,
      );

      return;
    }

    await dataSource.query(
      `UPDATE "core"."messageChannel"
      SET "contactAutoCreationPolicy" = 'NONE', "isContactAutoCreationEnabled" = false
      WHERE "workspaceId" = $1`,
      [workspaceId],
    );

    this.logger.log(
      `Workspace ${workspaceId}: locked contact auto-creation on ${count} mail channel(s)`,
    );
  }

  async down({ workspaceId }: RunOnWorkspaceArgs): Promise<void> {
    // The previous per-channel policies are not kept, so there is nothing to restore.
    this.logger.log(
      `Workspace ${workspaceId}: nothing to roll back for the mail contact auto-creation lock`,
    );
  }
}
