import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// HubSpot's currencies on 2026-03-11, so a fresh workspace starts where HubSpot is
const STARTING_CURRENCIES: { code: string; rate: number }[] = [
  { code: 'JOD', rate: 1.410437 },
  { code: 'SAR', rate: 0.266354 },
  { code: 'TND', rate: 0.334367 },
];

@RegisteredWorkspaceCommand('2.49.0', 1795720409964)
@Command({
  name: 'upgrade:2-49:create-roboost-currency-tables',
  description:
    'Create the currency, dated exchange rate, currency settings and currency log tables, with USD as company currency and JOD, SAR and TND',
})
export class CreateRoboostCurrencyTablesCommand extends ProvisionedWorkspaceCommandRunner {
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
        `[DRY RUN] Workspace ${workspaceId}: would create the currency tables`,
      );

      return;
    }

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostCurrency" (
        code text PRIMARY KEY,
        "isCompanyCurrency" boolean NOT NULL DEFAULT false,
        "archivedAt" timestamptz,
        "addedByWorkspaceMemberId" uuid,
        "addedByName" text,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);
    // Rate = how many company-currency units one unit of the currency is worth, effective from that date
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostExchangeRate" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "currencyCode" text NOT NULL,
        rate numeric(30, 12) NOT NULL,
        "effectiveDate" date NOT NULL,
        source text NOT NULL,
        "setByWorkspaceMemberId" uuid,
        "setByName" text,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostExchangeRate_lookup" ON ${schema}."roboostExchangeRate" ("currencyCode", "effectiveDate" DESC)`,
    );
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostCurrencySetting" (
        key text PRIMARY KEY,
        value jsonb,
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )`);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostCurrencyLog" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        action text NOT NULL,
        detail jsonb,
        "workspaceMemberId" uuid,
        "actorName" text,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);
    await dataSource.query(
      `INSERT INTO ${schema}."roboostCurrency" (code, "isCompanyCurrency", "addedByName")
       VALUES ('USD', true, 'System') ON CONFLICT (code) DO NOTHING`,
    );

    for (const { code, rate } of STARTING_CURRENCIES) {
      const inserted: { code: string }[] = await dataSource.query(
        `INSERT INTO ${schema}."roboostCurrency" (code, "addedByName") VALUES ($1, 'System')
         ON CONFLICT (code) DO NOTHING RETURNING code`,
        [code],
      );

      if (inserted.length > 0) {
        await dataSource.query(
          `INSERT INTO ${schema}."roboostExchangeRate" ("currencyCode", rate, "effectiveDate", source, "setByName")
           VALUES ($1, $2, '2026-03-11', 'IMPORT', 'HubSpot')`,
          [code, rate],
        );
      }
    }

    await dataSource.query(
      `INSERT INTO ${schema}."roboostCurrencySetting" (key, value)
       VALUES ('autoUpdate', '{"enabled": true, "frequency": "DAILY"}'::jsonb) ON CONFLICT (key) DO NOTHING`,
    );

    this.logger.log(`Workspace ${workspaceId}: currency tables ready`);
  }

  async down({ workspaceId, dataSource }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      return;
    }
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    await dataSource.query(`DROP TABLE IF EXISTS ${schema}."roboostCurrencyLog"`);
    await dataSource.query(`DROP TABLE IF EXISTS ${schema}."roboostCurrencySetting"`);
    await dataSource.query(`DROP TABLE IF EXISTS ${schema}."roboostExchangeRate"`);
    await dataSource.query(`DROP TABLE IF EXISTS ${schema}."roboostCurrency"`);
  }
}
