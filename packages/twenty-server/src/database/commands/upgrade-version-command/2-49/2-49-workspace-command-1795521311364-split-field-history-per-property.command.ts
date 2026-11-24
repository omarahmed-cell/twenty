import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

const LIMITS_KEY = 'roboost.default.propertyHistoryLimits';
const DEFAULT_CONTACTS_LIMIT = 45;
const DEFAULT_OTHERS_LIMIT = 20;

const HISTORY_ROW = `t."linkedRecordId" IS NULL
  AND t."timelineActivityTypeSnapshot"->>'action' = 'updated'
  AND jsonb_typeof(t.properties->'diff') = 'object'`;

const MULTI_FIELD_ROW = `${HISTORY_ROW}
  AND (SELECT count(*) FROM jsonb_object_keys(t.properties->'diff')) > 1`;

const readLimit = (value: unknown, fallback: number) =>
  Number.isInteger(value) && (value as number) >= 1
    ? Math.min(value as number, 1000)
    : fallback;

@RegisteredWorkspaceCommand('2.49.0', 1795521311364)
@Command({
  name: 'upgrade:2-49:split-field-history-per-property',
  description:
    'Split field history rows that hold several properties into one row per property, then keep only the latest changes per record and property',
})
export class SplitFieldHistoryPerPropertyCommand extends ProvisionedWorkspaceCommandRunner {
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
    const table = `"${schema}"."timelineActivity"`;
    const columns: { name: string; isTarget: boolean }[] =
      await dataSource.query(
        `SELECT column_name AS name, column_name ~ '^target[A-Z]\\w*Id$' AS "isTarget"
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = 'timelineActivity' AND is_generated = 'NEVER'
          AND column_name NOT IN ('id', 'properties')`,
        [schema],
      );

    if (columns.length === 0) {
      return;
    }

    const [{ multiFieldRows }]: { multiFieldRows: number }[] =
      await dataSource.query(
        `SELECT count(*)::int AS "multiFieldRows" FROM ${table} t WHERE ${MULTI_FIELD_ROW}`,
      );
    const [saved]: { value: Record<string, unknown> | null }[] =
      await dataSource.query(
        `SELECT value FROM core."keyValuePair"
        WHERE "workspaceId" = $1 AND "userId" IS NULL AND key = $2 AND type = 'USER_VARIABLE'`,
        [workspaceId, LIMITS_KEY],
      );
    const contactsLimit = readLimit(
      saved?.value?.contacts,
      DEFAULT_CONTACTS_LIMIT,
    );
    const othersLimit = readLimit(saved?.value?.others, DEFAULT_OTHERS_LIMIT);

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would split ${multiFieldRows} multi-property history row(s) and trim to ${contactsLimit} (contacts) / ${othersLimit} (other objects)`,
      );

      return;
    }

    const copiedColumns = columns
      .map(({ name }) => `"${name}"`)
      .join(', ');
    const copiedValues = columns.map(({ name }) => `t."${name}"`).join(', ');
    let removedCount = 0;

    await dataSource.transaction(async (manager) => {
      await manager.query(
        `WITH "multi" AS (SELECT * FROM ${table} t WHERE ${MULTI_FIELD_ROW}),
        "inserted" AS (
          INSERT INTO ${table} (id, ${copiedColumns}, properties)
          SELECT gen_random_uuid(), ${copiedValues},
            (t.properties - 'diff' - 'updatedFields') || jsonb_build_object('diff', jsonb_build_object(k.key, k.value))
          FROM "multi" t CROSS JOIN LATERAL jsonb_each(t.properties->'diff') k
          RETURNING id
        )
        DELETE FROM ${table} WHERE id IN (SELECT id FROM "multi")`,
      );

      for (const { name, isTarget } of columns) {
        if (!isTarget) {
          continue;
        }

        const limit = name === 'targetPersonId' ? contactsLimit : othersLimit;
        const [result]: { removedCount: number }[] = await manager.query(
          `WITH "ranked" AS (
            SELECT t.id, t."${name}" AS "recordId", k AS "fieldName",
              row_number() OVER (
                PARTITION BY t."${name}", k
                ORDER BY t."happensAt" DESC, t."createdAt" DESC, t.id DESC
              ) AS "rank"
            FROM ${table} t CROSS JOIN LATERAL jsonb_object_keys(t.properties->'diff') k
            WHERE t."${name}" IS NOT NULL AND ${HISTORY_ROW}
          ), "removed" AS (
            DELETE FROM ${table} WHERE id IN (SELECT id FROM "ranked" WHERE "rank" > $1)
            RETURNING id
          ), "flagged" AS (
            UPDATE ${table} t SET properties = t.properties || '{"olderChangesRemoved": true}'::jsonb
            FROM "ranked" r
            WHERE t.id = r.id AND r."rank" = $1
              AND EXISTS (
                SELECT 1 FROM "ranked" o
                WHERE o."recordId" = r."recordId" AND o."fieldName" = r."fieldName" AND o."rank" > $1
              )
            RETURNING t.id
          )
          SELECT (SELECT count(*) FROM "removed")::int AS "removedCount"`,
          [limit],
        );

        removedCount += result?.removedCount ?? 0;
      }
    });

    this.logger.log(
      `Workspace ${workspaceId}: split ${multiFieldRows} multi-property history row(s), removed ${removedCount} change(s) beyond ${contactsLimit} (contacts) / ${othersLimit} (other objects)`,
    );
  }

  async down({ workspaceId }: RunOnWorkspaceArgs): Promise<void> {
    // Split rows are equivalent to the originals and trimmed ones live in the pre-deploy backup
    this.logger.log(
      `Workspace ${workspaceId}: per-property history rows are not merged back`,
    );
  }
}
