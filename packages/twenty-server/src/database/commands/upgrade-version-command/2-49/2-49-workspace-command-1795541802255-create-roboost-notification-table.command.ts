import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// Bell notifications are per-member system data: a plain table, not a metadata object,
// so they never show in navigation, the data model or the record API
@RegisteredWorkspaceCommand('2.49.0', 1795541802255)
@Command({
  name: 'upgrade:2-49:create-roboost-notification-table',
  description: 'Create the table that stores bell notifications',
})
export class CreateRoboostNotificationTableCommand extends ProvisionedWorkspaceCommandRunner {
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

    const schema = getWorkspaceSchemaName(workspaceId);

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would create "${schema}"."roboostNotification"`,
      );

      return;
    }

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "${schema}"."roboostNotification" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "recipientWorkspaceMemberId" uuid NOT NULL,
        type text NOT NULL,
        subtype text NOT NULL,
        title text NOT NULL,
        body text NOT NULL DEFAULT '',
        "actorWorkspaceMemberId" uuid,
        "actorName" text,
        "targetObjectNameSingular" text,
        "targetRecordId" uuid,
        "targetPath" text,
        "downloadUrl" text,
        "actionLabel" text,
        "relatedRecords" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "relatedCount" integer NOT NULL DEFAULT 0,
        "groupKey" text,
        "isRead" boolean NOT NULL DEFAULT false,
        "readAt" timestamptz,
        "isTrashed" boolean NOT NULL DEFAULT false,
        "trashedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostNotification_recipient_createdAt"
      ON "${schema}"."roboostNotification" ("recipientWorkspaceMemberId", "isTrashed", "createdAt" DESC)`,
    );
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostNotification_groupKey"
      ON "${schema}"."roboostNotification" ("recipientWorkspaceMemberId", "groupKey")
      WHERE "groupKey" IS NOT NULL`,
    );

    this.logger.log(
      `Workspace ${workspaceId}: notification table ready in ${schema}`,
    );
  }

  async down({ workspaceId, dataSource }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      return;
    }
    await dataSource.query(
      `DROP TABLE IF EXISTS "${getWorkspaceSchemaName(workspaceId)}"."roboostNotification"`,
    );
  }
}
