import { Command, Option } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FeatureFlagKey, FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { type DataSource } from 'typeorm';

import { ProvisionedWorkspaceCommandRunner, type ProvisionedWorkspaceCommandOptions } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import {
  buildSeededStandardAdditionsFromTo,
  buildSeededStandardRollbackFromTo,
  countSeededStandardAdditions,
} from 'src/database/commands/upgrade-version-command/2-49/utils/build-seeded-standard-additions-from-to.util';
import { ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS } from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionUnifiedEmailFieldsCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const EMAIL_FIELDS = STANDARD_OBJECTS.email.fields;

const PROMOTABLE_COUNT_FIELD_NAMES = [
  'openCount',
  'clickCount',
  'replyCount',
] as const;

const SEED_UNIVERSAL_IDENTIFIERS = [
  ...(
    [
      'cc',
      'bcc',
      'bodyPreview',
      'source',
      'loggedBy',
      'gmailMessageId',
      'gmailThreadId',
      'rfcMessageId',
      'inReplyTo',
      'trackEnabled',
      'firstOpenedAt',
      'lastOpenedAt',
      'lastClickedAt',
      'repliedAt',
      'deliveryError',
    ] as const
  ).map((fieldName) => EMAIL_FIELDS[fieldName].universalIdentifier),
  STANDARD_OBJECTS.workspaceMember.fields.emailsLogged.universalIdentifier,
];

type CustomCountFieldRow = {
  id: string;
  name: (typeof PROMOTABLE_COUNT_FIELD_NAMES)[number];
  type: string;
};

@RegisteredWorkspaceCommand('2.49.0', 1795034153621)
@Command({
  name: 'upgrade:2-49:provision-unified-email-fields',
  description:
    'Add the email CC, BCC, Body preview, Source, Logged by, Gmail and RFC ids, tracking and Delivery error fields, make existing custom Open/Click/Reply count fields native in place, and backfill Source and Body preview. Pass --rollback to remove the added fields.',
})
export class ProvisionUnifiedEmailFieldsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionUnifiedEmailFieldsCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  @Option({
    flags: '--rollback',
    description: 'Undo what this command did',
    required: false,
  })
  parseRollback(): boolean {
    return true;
  }

  override async runOnWorkspace(
    args: RunOnWorkspaceArgs<ProvisionUnifiedEmailFieldsCommandOptions>,
  ): Promise<void> {
    if (args.options.rollback === true) {
      await this.down(args);

      return;
    }

    await this.up(args);
  }

  async up({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs<ProvisionUnifiedEmailFieldsCommandOptions>) {
    const dryRun = options.dryRun ?? false;

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    if (isDefined(dataSource) && !dryRun) {
      await this.promoteCustomCountFields({
        workspaceId,
        dataSource,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });
    }

    const existing = structuredClone(
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        ...ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
        'featureFlagsMap',
      ]),
    );

    const {
      allFlatEntityMaps: standard,
      idByUniversalIdentifierByMetadataName,
    } = computeTwentyStandardApplicationAllFlatEntityMaps({
      now: new Date().toISOString(),
      workspaceId,
      twentyStandardApplicationId: twentyStandardFlatApplication.id,
    });

    const provision = buildSeededStandardAdditionsFromTo({
      existing,
      standard,
      seedUniversalIdentifiers: [
        ...SEED_UNIVERSAL_IDENTIFIERS,
        ...PROMOTABLE_COUNT_FIELD_NAMES.map(
          (fieldName) => EMAIL_FIELDS[fieldName].universalIdentifier,
        ),
      ],
    });
    const additionCount = countSeededStandardAdditions(provision.additions);

    if (dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: ${additionCount} email field standard addition(s)`,
      );

      return;
    }

    if (additionCount > 0) {
      const result =
        await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
          {
            workspaceId,
            dryRun,
            buildOptions: {
              isSystemBuild: true,
              inferDeletionFromMissingEntities: {},
              applicationUniversalIdentifier:
                twentyStandardFlatApplication.universalIdentifier,
            },
            additionalCacheDataMaps: {
              featureFlagsMap: existing.featureFlagsMap,
            },
            idByUniversalIdentifierByMetadataName,
            fromToAllFlatEntityMaps: provision.fromToAllFlatEntityMaps,
          },
        );

      if (result.status === 'fail') {
        throw new Error(
          `Unified email fields provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }
    }

    if (isDefined(dataSource)) {
      await this.backfill({ workspaceId, dataSource });
      await this.switchToUnifiedEmail({ workspaceId, dataSource });
    }

    this.logger.log(
      `Workspace ${workspaceId}: ${additionCount} email field standard addition(s)`,
    );
  }

  async down({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionUnifiedEmailFieldsCommandOptions>) {
    const dryRun = options.dryRun ?? false;

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const existing = structuredClone(
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        ...ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
        'featureFlagsMap',
      ]),
    );
    const {
      allFlatEntityMaps: standard,
      idByUniversalIdentifierByMetadataName,
    } = computeTwentyStandardApplicationAllFlatEntityMaps({
      now: new Date().toISOString(),
      workspaceId,
      twentyStandardApplicationId: twentyStandardFlatApplication.id,
    });

    // Promoted count fields stay: they held data before this command
    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
        {
          workspaceId,
          dryRun,
          buildOptions: {
            isSystemBuild: true,
            inferDeletionFromMissingEntities: true,
            applicationUniversalIdentifier:
              twentyStandardFlatApplication.universalIdentifier,
          },
          additionalCacheDataMaps: {
            featureFlagsMap: existing.featureFlagsMap,
          },
          idByUniversalIdentifierByMetadataName,
          fromToAllFlatEntityMaps: buildSeededStandardRollbackFromTo({
            existing,
            standard,
            seedUniversalIdentifiers: SEED_UNIVERSAL_IDENTIFIERS,
          }),
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Unified email fields rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: unified email fields rolled back`,
    );
  }

  // Moves the custom fields to the standard application without touching ids, columns or data
  private async promoteCustomCountFields({
    workspaceId,
    dataSource,
    twentyStandardApplicationId,
  }: {
    workspaceId: string;
    dataSource: DataSource;
    twentyStandardApplicationId: string;
  }) {
    const rows: CustomCountFieldRow[] = await dataSource.query(
      `SELECT f."id", f."name", f."type"
      FROM "core"."fieldMetadata" f
      JOIN "core"."objectMetadata" o ON o."id" = f."objectMetadataId"
      WHERE f."workspaceId" = $1 AND o."universalIdentifier" = $2
        AND f."name" = ANY($3::text[]) AND f."applicationId" <> $4`,
      [
        workspaceId,
        STANDARD_OBJECTS.email.universalIdentifier,
        [...PROMOTABLE_COUNT_FIELD_NAMES],
        twentyStandardApplicationId,
      ],
    );

    if (rows.length === 0) {
      return;
    }

    const nonNumberRow = rows.find(
      ({ type }) => type !== FieldMetadataType.NUMBER,
    );

    if (isDefined(nonNumberRow)) {
      throw new Error(
        `Workspace ${workspaceId}: email ${nonNumberRow.name} is a custom ${nonNumberRow.type} field, so it cannot be made native in place. Make it a NUMBER field, then rerun the upgrade.`,
      );
    }

    await dataSource.transaction(async (manager) => {
      for (const row of rows) {
        await manager.query(
          `UPDATE "core"."fieldMetadata"
          SET "applicationId" = $1, "universalIdentifier" = $2, "isUIEditable" = false
          WHERE "id" = $3`,
          [
            twentyStandardApplicationId,
            EMAIL_FIELDS[row.name].universalIdentifier,
            row.id,
          ],
        );
      }
    });

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatFieldMetadataMaps',
    ]);

    this.logger.log(
      `Workspace ${workspaceId}: made the custom ${rows.map(({ name }) => name).join(', ')} field(s) native in place`,
    );
  }

  // The flag is inserted only when missing, so a workspace that turned it off keeps it off
  private async switchToUnifiedEmail({
    workspaceId,
    dataSource,
  }: {
    workspaceId: string;
    dataSource: DataSource;
  }) {
    await dataSource.query(
      `INSERT INTO "core"."featureFlag" ("key", "workspaceId", "value")
      VALUES ($1, $2, true)
      ON CONFLICT ("key", "workspaceId") DO NOTHING`,
      [FeatureFlagKey.IS_UNIFIED_EMAIL_ENABLED, workspaceId],
    );

    const [{ value: isEnabled }]: { value: boolean }[] = await dataSource.query(
      `SELECT "value" FROM "core"."featureFlag" WHERE "key" = $1 AND "workspaceId" = $2`,
      [FeatureFlagKey.IS_UNIFIED_EMAIL_ENABLED, workspaceId],
    );

    if (isEnabled) {
      await dataSource.query(
        `UPDATE "core"."messageChannel" SET "isSyncEnabled" = false
        WHERE "workspaceId" = $1 AND "isSyncEnabled" = true AND "type" = 'EMAIL'`,
        [workspaceId],
      );
    }

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'featureFlagsMap',
    ]);
  }

  private async backfill({
    workspaceId,
    dataSource,
  }: {
    workspaceId: string;
    dataSource: DataSource;
  }) {
    const schemaName = getWorkspaceSchemaName(workspaceId);

    await dataSource.query(
      `UPDATE "${schemaName}"."email" SET "source" = 'HUBSPOT_IMPORT'
      WHERE "source" IS NULL AND "hubspotId" IS NOT NULL`,
    );
    await dataSource.query(
      `UPDATE "${schemaName}"."email"
      SET "bodyPreview" = left(btrim(regexp_replace("bodyV2Markdown", '[#*_>\`\\[\\]()!~|-]+|\\s+', ' ', 'g')), 300)
      WHERE "bodyPreview" IS NULL AND "bodyV2Markdown" IS NOT NULL`,
    );
  }
}
