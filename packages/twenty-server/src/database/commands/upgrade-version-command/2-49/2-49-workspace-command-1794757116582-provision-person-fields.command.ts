import { Command, Option } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FieldMetadataType, MetadataWritability } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import {
  ProvisionedWorkspaceCommandRunner,
  type ProvisionedWorkspaceCommandOptions,
} from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
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
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionPersonFieldsCommandOptions = ProvisionedWorkspaceCommandOptions & {
  rollback?: boolean;
};

type DataSource = NonNullable<RunOnWorkspaceArgs['dataSource']>;

const PERSON_FIELDS = STANDARD_OBJECTS.person.fields;
const COMPANY_FIELDS = STANDARD_OBJECTS.company.fields;
const WORKSPACE_MEMBER_FIELDS = STANDARD_OBJECTS.workspaceMember.fields;

const PERSON_FIELD_SEED_UNIVERSAL_IDENTIFIERS = [
  PERSON_FIELDS.lifecycleStage,
  PERSON_FIELDS.dateEnteredCurrentStage,
  PERSON_FIELDS.timeInCurrentStage,
  PERSON_FIELDS.team,
  PERSON_FIELDS.contactOwner,
  PERSON_FIELDS.contactSdrOwner,
  PERSON_FIELDS.ownerAssignedDate,
  PERSON_FIELDS.sdrOwnerAssignedDate,
  PERSON_FIELDS.lastActivityDate,
  PERSON_FIELDS.firstDealCreatedDate,
  ...Object.entries(PERSON_FIELDS)
    .filter(([fieldName]) =>
      /^date(Entered|Exited).+LifecycleStage$/.test(fieldName),
    )
    .map(([, field]) => field),
  COMPANY_FIELDS.ownerAssignedDate,
].map(({ universalIdentifier }) => universalIdentifier);

// Company SDR Owner and its date may already exist as custom fields; those are made native in place
const PROMOTABLE_COMPANY_FIELD_UNIVERSAL_IDENTIFIERS = [
  COMPANY_FIELDS.sdrOwner.universalIdentifier,
  COMPANY_FIELDS.sdrOwnerAssignedDate.universalIdentifier,
];

const PROMOTED_UNIVERSAL_IDENTIFIERS = {
  sdrOwner: COMPANY_FIELDS.sdrOwner.universalIdentifier,
  sdrOwnedCompanies: WORKSPACE_MEMBER_FIELDS.sdrOwnedCompanies.universalIdentifier,
  sdrOwnerAssignedDate: COMPANY_FIELDS.sdrOwnerAssignedDate.universalIdentifier,
  sdrOwnerIdIndex:
    STANDARD_OBJECTS.company.indexes.sdrOwnerIdIndex.universalIdentifier,
};

type CustomFieldRow = {
  id: string;
  name: string;
  type: string;
  applicationId: string;
  settings: { relationType?: string; joinColumnName?: string } | null;
  relationTargetObjectMetadataId: string | null;
  relationTargetFieldMetadataId: string | null;
};

@RegisteredWorkspaceCommand('2.49.0', 1794757116582)
@Command({
  name: 'upgrade:2-49:provision-person-fields',
  description:
    'Add the native person fields (lifecycle stage with its dates, team, contact owner and SDR owner with assigned dates, Last Activity Date, First Deal Created Date, Time in current stage) and the company Owner assigned date, and make an existing custom company SDR Owner and SDR Owner assigned date native in place (same fields, columns, data and inverse). Pass --rollback to remove what it added and hand the promoted fields back to the custom application.',
})
export class ProvisionPersonFieldsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionPersonFieldsCommandOptions> {
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
    description: 'Remove the metadata this command added',
    required: false,
  })
  parseRollback(): boolean {
    return true;
  }

  override async runOnWorkspace(
    args: RunOnWorkspaceArgs<ProvisionPersonFieldsCommandOptions>,
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
  }: RunOnWorkspaceArgs<ProvisionPersonFieldsCommandOptions>) {
    const dryRun = options.dryRun ?? false;

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const promotedUniversalIdentifiers = isDefined(dataSource)
      ? await this.promoteCustomCompanySdrOwnerFields({
        workspaceId,
        dataSource,
          twentyStandardApplicationId: twentyStandardFlatApplication.id,
          dryRun,
        })
      : [];

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

    // A promoted field keeps its own view fields, so only a missing one is seeded
    const missingPromotableUniversalIdentifiers =
      PROMOTABLE_COMPANY_FIELD_UNIVERSAL_IDENTIFIERS.filter(
        (universalIdentifier) =>
          !promotedUniversalIdentifiers.includes(universalIdentifier) &&
          !isDefined(
            existing.flatFieldMetadataMaps.byUniversalIdentifier[
              universalIdentifier
            ],
          ),
      );

    const provision = buildSeededStandardAdditionsFromTo({
      existing,
      standard,
      seedUniversalIdentifiers: [
        ...PERSON_FIELD_SEED_UNIVERSAL_IDENTIFIERS,
        ...missingPromotableUniversalIdentifiers,
      ],
    });

    const additionCount = countSeededStandardAdditions(provision.additions);

    if (additionCount === 0) {
      return;
    }

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
        `Person fields provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${additionCount} person field standard addition(s)`,
    );
  }

  async down({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs<ProvisionPersonFieldsCommandOptions>) {
    const dryRun = options.dryRun ?? false;

    const { twentyStandardFlatApplication, workspaceCustomFlatApplication } =
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

    // The SDR Owner fields hold data, so the rollback hands them back instead of deleting them
    const rollback = buildSeededStandardRollbackFromTo({
      existing,
      standard,
      seedUniversalIdentifiers: PERSON_FIELD_SEED_UNIVERSAL_IDENTIFIERS,
    });

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
          fromToAllFlatEntityMaps: rollback,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Person fields rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    if (!dryRun && isDefined(dataSource)) {
      await dataSource.transaction(async (manager) => {
        await manager.query(
          `UPDATE "core"."fieldMetadata" SET "applicationId" = $1
          WHERE "workspaceId" = $2 AND "applicationId" = $3 AND "universalIdentifier" = ANY($4::uuid[])`,
          [
            workspaceCustomFlatApplication.id,
            workspaceId,
            twentyStandardFlatApplication.id,
            [
              PROMOTED_UNIVERSAL_IDENTIFIERS.sdrOwner,
              PROMOTED_UNIVERSAL_IDENTIFIERS.sdrOwnedCompanies,
            ],
          ],
        );
        await manager.query(
          `UPDATE "core"."fieldMetadata" SET "applicationId" = $1, "writability" = $5, "isUIEditable" = true
          WHERE "workspaceId" = $2 AND "applicationId" = $3 AND "universalIdentifier" = $4`,
          [
            workspaceCustomFlatApplication.id,
            workspaceId,
            twentyStandardFlatApplication.id,
            PROMOTED_UNIVERSAL_IDENTIFIERS.sdrOwnerAssignedDate,
            MetadataWritability.OPEN,
          ],
        );
        await manager.query(
          `UPDATE "core"."indexMetadata" SET "applicationId" = $1
          WHERE "workspaceId" = $2 AND "applicationId" = $3 AND "universalIdentifier" = $4`,
          [
            workspaceCustomFlatApplication.id,
            workspaceId,
            twentyStandardFlatApplication.id,
            PROMOTED_UNIVERSAL_IDENTIFIERS.sdrOwnerIdIndex,
          ],
        );
      });

      await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
        'flatFieldMetadataMaps',
        'flatIndexMaps',
      ]);
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: person fields rolled back`,
    );
  }

  // Moves the fields, the inverse and the index to the standard application without touching ids, columns or data
  private async promoteCustomCompanySdrOwnerFields({
    workspaceId,
    dataSource,
    twentyStandardApplicationId,
    dryRun,
  }: {
    workspaceId: string;
    dataSource: DataSource;
    twentyStandardApplicationId: string;
    dryRun: boolean;
  }): Promise<string[]> {
    const rows: CustomFieldRow[] = await dataSource.query(
      `SELECT f."id", f."name", f."type", f."applicationId", f."settings",
        f."relationTargetObjectMetadataId", f."relationTargetFieldMetadataId"
      FROM "core"."fieldMetadata" f
      JOIN "core"."objectMetadata" o ON o."id" = f."objectMetadataId"
      WHERE f."workspaceId" = $1 AND o."universalIdentifier" = $2
        AND f."name" IN ('sdrOwner', 'sdrOwnerAssignedDate') AND f."applicationId" <> $3`,
      [
        workspaceId,
        STANDARD_OBJECTS.company.universalIdentifier,
        twentyStandardApplicationId,
      ],
    );

    const sdrOwner = rows.find(({ name }) => name === 'sdrOwner');
    const sdrOwnerAssignedDate = rows.find(
      ({ name }) => name === 'sdrOwnerAssignedDate',
    );

    if (!isDefined(sdrOwner) && !isDefined(sdrOwnerAssignedDate)) {
      return [];
    }

    const promotedUniversalIdentifiers = [
      ...(isDefined(sdrOwner) ? [PROMOTED_UNIVERSAL_IDENTIFIERS.sdrOwner] : []),
      ...(isDefined(sdrOwnerAssignedDate)
        ? [PROMOTED_UNIVERSAL_IDENTIFIERS.sdrOwnerAssignedDate]
        : []),
    ];

    const inverse = isDefined(sdrOwner)
      ? await this.findSdrOwnerInverseOrThrow({
          workspaceId,
          dataSource,
          sdrOwner,
        })
      : undefined;

    if (
      isDefined(sdrOwnerAssignedDate) &&
      sdrOwnerAssignedDate.type !== FieldMetadataType.DATE_TIME
    ) {
      throw new Error(
        `Workspace ${workspaceId}: company sdrOwnerAssignedDate is a custom ${sdrOwnerAssignedDate.type} field, so it cannot be made native in place. Make it a DATE_TIME field, then rerun the upgrade.`,
      );
    }

    if (dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would make ${rows.map(({ name }) => name).join(' and ')} native`,
      );

      return promotedUniversalIdentifiers;
    }

    await dataSource.transaction(async (manager) => {
      if (isDefined(sdrOwner) && isDefined(inverse)) {
        await manager.query(
          `UPDATE "core"."fieldMetadata" SET "applicationId" = $1, "universalIdentifier" = $2 WHERE "id" = $3`,
          [
            twentyStandardApplicationId,
            PROMOTED_UNIVERSAL_IDENTIFIERS.sdrOwner,
            sdrOwner.id,
          ],
        );
        await manager.query(
          `UPDATE "core"."fieldMetadata" SET "applicationId" = $1, "universalIdentifier" = $2 WHERE "id" = $3`,
          [
            twentyStandardApplicationId,
            PROMOTED_UNIVERSAL_IDENTIFIERS.sdrOwnedCompanies,
            inverse.id,
          ],
        );
        await manager.query(
          `UPDATE "core"."indexMetadata" SET "applicationId" = $1, "universalIdentifier" = $2
          WHERE "workspaceId" = $3 AND "applicationId" <> $1 AND "id" IN (
            SELECT "indexMetadataId" FROM "core"."indexFieldMetadata" WHERE "fieldMetadataId" = $4
          )`,
          [
            twentyStandardApplicationId,
            PROMOTED_UNIVERSAL_IDENTIFIERS.sdrOwnerIdIndex,
            workspaceId,
            sdrOwner.id,
          ],
        );
      }

      if (isDefined(sdrOwnerAssignedDate)) {
        // The date becomes server-written, like the other assigned dates
        await manager.query(
          `UPDATE "core"."fieldMetadata"
          SET "applicationId" = $1, "universalIdentifier" = $2, "writability" = $3, "isUIEditable" = false,
            "icon" = COALESCE(NULLIF("icon", ''), 'IconCalendarTime')
          WHERE "id" = $4`,
          [
            twentyStandardApplicationId,
            PROMOTED_UNIVERSAL_IDENTIFIERS.sdrOwnerAssignedDate,
            MetadataWritability.SYSTEM,
            sdrOwnerAssignedDate.id,
          ],
        );
      }
    });

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatFieldMetadataMaps',
      'flatIndexMaps',
    ]);

    this.logger.log(
      `Workspace ${workspaceId}: made the custom ${rows.map(({ name }) => name).join(' and ')} field(s) native in place`,
    );

    return promotedUniversalIdentifiers;
  }

  private async findSdrOwnerInverseOrThrow({
    workspaceId,
    dataSource,
    sdrOwner,
  }: {
    workspaceId: string;
    dataSource: DataSource;
    sdrOwner: CustomFieldRow;
  }): Promise<{ id: string }> {
    const [inverse]: { id: string; name: string; objectUniversalIdentifier: string }[] =
      await dataSource.query(
        `SELECT f."id", f."name", o."universalIdentifier" AS "objectUniversalIdentifier"
        FROM "core"."fieldMetadata" f
        JOIN "core"."objectMetadata" o ON o."id" = f."objectMetadataId"
        WHERE f."id" = $1`,
        [sdrOwner.relationTargetFieldMetadataId],
      );

    if (
      sdrOwner.type !== FieldMetadataType.RELATION ||
      sdrOwner.settings?.relationType !== 'MANY_TO_ONE' ||
      sdrOwner.settings?.joinColumnName !== 'sdrOwnerId' ||
      !isDefined(inverse) ||
      inverse.name !== 'sdrOwnedCompanies' ||
      inverse.objectUniversalIdentifier !==
        STANDARD_OBJECTS.workspaceMember.universalIdentifier
    ) {
      throw new Error(
        `Workspace ${workspaceId}: company sdrOwner is not a many-to-one relation to workspaceMember stored in sdrOwnerId with the inverse sdrOwnedCompanies, so it cannot be made native in place. Align it, then rerun the upgrade.`,
      );
    }

    return inverse;
  }
}
