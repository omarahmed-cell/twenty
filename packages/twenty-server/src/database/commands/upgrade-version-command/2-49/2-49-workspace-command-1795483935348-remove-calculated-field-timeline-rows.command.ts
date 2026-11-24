import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// Update rows whose changed fields include calculated ones (formula or not UI-editable) on the row's record
const buildClassifiedUpdatesQuery = (schema: string) => `
  WITH calc AS (
    SELECT o."nameSingular" AS obj, f.name
    FROM "core"."fieldMetadata" f
    JOIN "core"."objectMetadata" o ON o.id = f."objectMetadataId"
    WHERE f."workspaceId" = $1
      AND (coalesce(f.settings->'formula'->>'expression', '') <> '' OR f."isUIEditable" = false)
  ), updates AS (
    SELECT t.id,
      CASE
        WHEN t."targetCompanyId" IS NOT NULL THEN 'company'
        WHEN t."targetPersonId" IS NOT NULL THEN 'person'
        WHEN t."targetOpportunityId" IS NOT NULL THEN 'opportunity'
        WHEN t."targetServiceId" IS NOT NULL THEN 'service'
      END AS obj,
      ARRAY(SELECT jsonb_object_keys(t.properties->'diff')) AS keys
    FROM "${schema}"."timelineActivity" t
    WHERE t."timelineActivityTypeSnapshot"->>'name' = 'recordUpdated'
      AND jsonb_typeof(t.properties->'diff') = 'object'
  )
  SELECT u.id,
    ARRAY(SELECT k FROM unnest(u.keys) k WHERE EXISTS (SELECT 1 FROM calc c WHERE c.obj = u.obj AND c.name = k)) AS "calcKeys",
    cardinality(u.keys) AS "keyCount"
  FROM updates u`;

@RegisteredWorkspaceCommand('2.49.0', 1795483935348)
@Command({
  name: 'upgrade:2-49:remove-calculated-field-timeline-rows',
  description:
    'Delete timeline rows that only record calculated-field changes and drop the calculated part from mixed rows; calculated fields no longer write history',
})
export class RemoveCalculatedFieldTimelineRowsCommand extends ProvisionedWorkspaceCommandRunner {
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
    const rows: { id: string; calcKeys: string[]; keyCount: number }[] =
      await dataSource.query(buildClassifiedUpdatesQuery(schema), [
        workspaceId,
      ]);
    const calcOnlyIds = rows
      .filter(
        ({ calcKeys, keyCount }) =>
          calcKeys.length > 0 && calcKeys.length === keyCount,
      )
      .map(({ id }) => id);
    const mixedRows = rows.filter(
      ({ calcKeys, keyCount }) =>
        calcKeys.length > 0 && calcKeys.length < keyCount,
    );

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would delete ${calcOnlyIds.length} calculated-only timeline row(s) and trim ${mixedRows.length} mixed row(s)`,
      );

      return;
    }

    await dataSource.transaction(async (manager) => {
      if (calcOnlyIds.length > 0) {
        await manager.query(
          `DELETE FROM "${schema}"."timelineActivity" WHERE id = ANY($1::uuid[])`,
          [calcOnlyIds],
        );
      }

      for (const { id, calcKeys } of mixedRows) {
        await manager.query(
          `UPDATE "${schema}"."timelineActivity"
          SET properties = jsonb_set(properties, '{diff}', (properties->'diff') - $2::text[])
            || CASE WHEN jsonb_typeof(properties->'updatedFields') = 'array'
              THEN jsonb_build_object('updatedFields', coalesce((
                SELECT jsonb_agg(field) FROM jsonb_array_elements_text(properties->'updatedFields') field
                WHERE field <> ALL($2::text[])), '[]'::jsonb))
              ELSE '{}'::jsonb END
          WHERE id = $1`,
          [id, calcKeys],
        );
      }
    });

    this.logger.log(
      `Workspace ${workspaceId}: deleted ${calcOnlyIds.length} calculated-only timeline row(s), trimmed ${mixedRows.length} mixed row(s)`,
    );
  }

  async down({ workspaceId }: RunOnWorkspaceArgs): Promise<void> {
    // Deleted history is restored from the pre-deploy backup if ever needed
    this.logger.log(
      `Workspace ${workspaceId}: calculated-field timeline rows are not recreated`,
    );
  }
}
