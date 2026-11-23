import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';

@RegisteredWorkspaceCommand('2.49.0', 1795400000003)
@Command({
  name: 'upgrade:2-49:turn-off-native-calendar-sync',
  description:
    "Turn off Twenty's own calendar import and contact auto-creation on every calendar and mail channel; connected accounts stay, the Meetings and Emails jobs use their tokens",
})
export class TurnOffNativeCalendarSyncCommand extends ProvisionedWorkspaceCommandRunner {
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
      `SELECT count(*)::int AS "count" FROM "core"."calendarChannel"
      WHERE "workspaceId" = $1 AND ("isSyncEnabled" OR "isContactAutoCreationEnabled")`,
      [workspaceId],
    );

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would turn off ${count} calendar channel(s)`,
      );

      return;
    }

    await dataSource.query(
      `UPDATE "core"."calendarChannel"
      SET "isSyncEnabled" = false, "isContactAutoCreationEnabled" = false
      WHERE "workspaceId" = $1 AND ("isSyncEnabled" OR "isContactAutoCreationEnabled")`,
      [workspaceId],
    );
    await dataSource.query(
      `UPDATE "core"."messageChannel" SET "isContactAutoCreationEnabled" = false
      WHERE "workspaceId" = $1 AND "isContactAutoCreationEnabled"`,
      [workspaceId],
    );

    this.logger.log(
      `Workspace ${workspaceId}: turned off ${count} calendar channel(s)`,
    );
  }

  async down({ workspaceId }: RunOnWorkspaceArgs): Promise<void> {
    // Which channels synced before is not kept; reps turn sync back on in Settings if ever needed
    this.logger.log(
      `Workspace ${workspaceId}: nothing to roll back for the calendar sync switch-off`,
    );
  }
}
