import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// One reminder per task: the chosen offset, and when it is due; open tasks with a due date get "at due time"
@RegisteredWorkspaceCommand('2.49.0', 1795545310151)
@Command({
  name: 'upgrade:2-49:create-roboost-task-reminder-table',
  description:
    'Create the task reminder table and give open tasks with a future due date the default reminder',
})
export class CreateRoboostTaskReminderTableCommand extends ProvisionedWorkspaceCommandRunner {
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

    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would create the task reminder table`,
      );

      return;
    }

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostTaskReminder" (
        "taskId" uuid PRIMARY KEY,
        "offset" text NOT NULL DEFAULT 'atDue',
        "offsetMinutes" integer NOT NULL DEFAULT 0,
        "customAt" timestamptz,
        "remindAt" timestamptz,
        "sentAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostTaskReminder_due" ON ${schema}."roboostTaskReminder" ("remindAt") WHERE "sentAt" IS NULL`,
    );
    const inserted = await dataSource.query(
      `WITH added AS (
        INSERT INTO ${schema}."roboostTaskReminder" ("taskId", "remindAt")
        SELECT id, "dueAt" FROM ${schema}."task"
        WHERE "deletedAt" IS NULL AND "dueAt" > now() AND status IS DISTINCT FROM 'DONE'
        ON CONFLICT ("taskId") DO NOTHING
        RETURNING 1
      ) SELECT count(*)::int AS count FROM added`,
    );

    this.logger.log(
      `Workspace ${workspaceId}: task reminders ready, ${inserted[0]?.count ?? 0} open task(s) got the default reminder`,
    );
  }

  async down({ workspaceId, dataSource }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      return;
    }
    await dataSource.query(
      `DROP TABLE IF EXISTS "${getWorkspaceSchemaName(workspaceId)}"."roboostTaskReminder"`,
    );
  }
}
