import { Command, Option } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
import { type DataSource } from 'typeorm';

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
import { computeSelectOptionConversions } from 'src/database/commands/upgrade-version-command/2-49/utils/compute-select-option-conversions.util';
import { ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS } from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionMeetingSourceCommandOptions = ProvisionedWorkspaceCommandOptions & {
  rollback?: boolean;
};

type SelectOption = {
  id: string;
  value: string;
  label: string;
  position: number;
  color: string;
};

const CALENDAR_EVENT_FIELDS = STANDARD_OBJECTS.calendarEvent.fields;

const MEETING_FIELD_SEED_UNIVERSAL_IDENTIFIERS = [
  CALENDAR_EVENT_FIELDS.hasMeetingTranscript.universalIdentifier,
  CALENDAR_EVENT_FIELDS.hubspotHasTranscript.universalIdentifier,
  CALENDAR_EVENT_FIELDS.meetingSource.universalIdentifier,
];

// The option ids stay, so the column is converted in place (old value -> new value)
const LEGACY_LOCATION_TYPE_OPTIONS: SelectOption[] = [
  {
    id: '3d055c1e-258b-439a-be84-81adeec58364',
    value: 'PHONE_CALL',
    label: 'Phone-Call',
    position: 0,
    color: 'blue',
  },
  {
    id: 'fc75e91f-3b32-4a16-8412-d4308e7d81f7',
    value: 'IN_PERSON',
    label: 'In-Person',
    position: 1,
    color: 'green',
  },
  {
    id: '6e65760e-1600-424e-b6f4-aa4fe0e8a755',
    value: 'GOOGLE_MEET',
    label: 'Google Meet',
    position: 2,
    color: 'turquoise',
  },
];

const toComparableOptions = (options: unknown) =>
  JSON.stringify(
    ((options ?? []) as SelectOption[])
      .map(({ id, value }) => `${id}:${value}`)
      .sort(),
  );

@RegisteredWorkspaceCommand('2.49.0', 1794853579951)
@Command({
  name: 'upgrade:2-49:provision-meeting-source-and-location-types',
  description:
    'Add the native Meeting source, Meeting transcript available and Transcript in HubSpot meeting fields, and switch Location type to the HubSpot options (Phone call, Address, Custom, Video Conference), converting PHONE_CALL, IN_PERSON and GOOGLE_MEET in place. Pass --rollback to undo it.',
})
export class ProvisionMeetingSourceAndLocationTypesCommand extends ProvisionedWorkspaceCommandRunner<ProvisionMeetingSourceCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    private readonly fieldMetadataService: FieldMetadataService,
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
    args: RunOnWorkspaceArgs<ProvisionMeetingSourceCommandOptions>,
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
  }: RunOnWorkspaceArgs<ProvisionMeetingSourceCommandOptions>) {
    const dryRun = options.dryRun ?? false;

    if (!isDefined(dataSource)) {
      throw new Error(`Workspace ${workspaceId}: no data source`);
    }

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

    const provision = buildSeededStandardAdditionsFromTo({
      existing,
      standard,
      seedUniversalIdentifiers: MEETING_FIELD_SEED_UNIVERSAL_IDENTIFIERS,
    });
    const additionCount = countSeededStandardAdditions(provision.additions);

    if (!dryRun && additionCount > 0) {
      const result =
        await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
          {
            workspaceId,
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
          `Meeting fields provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }
    }

    const standardLocationTypeField =
      findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
        flatEntityMaps: standard.flatFieldMetadataMaps,
        universalIdentifier: CALENDAR_EVENT_FIELDS.locationType.universalIdentifier,
      });

    const conversionCounts = await this.switchLocationTypeOptions({
      workspaceId,
      dataSource,
      dryRun,
      ownerFlatApplication: twentyStandardFlatApplication,
      targetOptions: (standardLocationTypeField?.options ?? []) as SelectOption[],
    });

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${additionCount} meeting field standard addition(s); location types converted ${JSON.stringify(conversionCounts)}`,
    );
  }

  async down({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs<ProvisionMeetingSourceCommandOptions>) {
    const dryRun = options.dryRun ?? false;

    if (!isDefined(dataSource)) {
      throw new Error(`Workspace ${workspaceId}: no data source`);
    }

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    if (!dryRun) {
      // CUSTOM has no legacy equivalent
      await dataSource.query(
        `UPDATE "${getWorkspaceSchemaName(workspaceId)}"."calendarEvent" SET "locationType" = NULL WHERE "locationType"::text = 'CUSTOM'`,
      );
    }

    const conversionCounts = await this.switchLocationTypeOptions({
      workspaceId,
      dataSource,
      dryRun,
      ownerFlatApplication: twentyStandardFlatApplication,
      targetOptions: LEGACY_LOCATION_TYPE_OPTIONS,
    });

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

    if (!dryRun) {
      const result =
        await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
          {
            workspaceId,
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
              seedUniversalIdentifiers: MEETING_FIELD_SEED_UNIVERSAL_IDENTIFIERS,
            }),
          },
        );

      if (result.status === 'fail') {
        throw new Error(
          `Meeting fields rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: meeting fields rolled back; location types converted ${JSON.stringify(conversionCounts)}`,
    );
  }

  private async switchLocationTypeOptions({
    workspaceId,
    dataSource,
    dryRun,
    ownerFlatApplication,
    targetOptions,
  }: {
    workspaceId: string;
    dataSource: DataSource;
    dryRun: boolean;
    ownerFlatApplication: FlatApplication;
    targetOptions: SelectOption[];
  }): Promise<Record<string, number>> {
    const { flatFieldMetadataMaps } = await this.workspaceCacheService.getOrRecompute(
      workspaceId,
      ['flatFieldMetadataMaps'],
    );
    const locationTypeField = findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
      flatEntityMaps: flatFieldMetadataMaps,
      universalIdentifier: CALENDAR_EVENT_FIELDS.locationType.universalIdentifier,
    });

    if (
      !isDefined(locationTypeField) ||
      targetOptions.length === 0 ||
      toComparableOptions(locationTypeField.options) ===
        toComparableOptions(targetOptions)
    ) {
      return {};
    }

    const rows: { value: string; count: string }[] = await dataSource.query(
      `SELECT "locationType"::text AS "value", count(*) AS "count"
       FROM "${getWorkspaceSchemaName(workspaceId)}"."calendarEvent"
       WHERE "locationType" IS NOT NULL GROUP BY 1`,
    );
    const conversionCounts = computeSelectOptionConversions({
      fromOptions: (locationTypeField.options ?? []) as SelectOption[],
      toOptions: targetOptions,
      countByValue: Object.fromEntries(
        rows.map(({ value, count }) => [value, Number(count)]),
      ),
    });

    if (!dryRun) {
      await this.fieldMetadataService.updateOneField({
        workspaceId,
        isSystemBuild: true,
        ownerFlatApplication,
        updateFieldInput: { id: locationTypeField.id, options: targetOptions },
      });
    }

    return conversionCounts;
  }
}
