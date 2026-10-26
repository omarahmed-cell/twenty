import { Command, Option } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import {
  ProvisionedWorkspaceCommandRunner,
  type ProvisionedWorkspaceCommandOptions,
} from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import {
  ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
  type ActivityObjectsFlatEntities,
  type ActivityObjectsFlatEntityMaps,
  collectParentReferences,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { selectStandardAdditionsFromSeeds } from 'src/database/commands/upgrade-version-command/2-49/utils/select-standard-additions-from-seeds.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type SyncableFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { type FromToAllUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';

type ProvisionMeetingFieldsCommandOptions =
  ProvisionedWorkspaceCommandOptions & { rollback?: boolean };

const MEETING_FIELD_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.calendarEvent.fields.locationType.universalIdentifier,
  STANDARD_OBJECTS.calendarEvent.fields.meetingType.universalIdentifier,
  STANDARD_OBJECTS.calendarEvent.fields.meetingOutcome.universalIdentifier,
  STANDARD_OBJECTS.calendarEvent.fields.assignedTo.universalIdentifier,
];

const countFlatEntities = (flatEntitiesByMapsKey: ActivityObjectsFlatEntities) =>
  Object.values(flatEntitiesByMapsKey).reduce(
    (total, flatEntities) => total + flatEntities.length,
    0,
  );

const addFlatEntities = <T extends SyncableFlatEntity>(
  flatEntityMaps: FlatEntityMaps<T>,
  flatEntities: T[],
): FlatEntityMaps<T> =>
  flatEntities.reduce(
    (maps, flatEntity) => ({
      byUniversalIdentifier: {
        ...maps.byUniversalIdentifier,
        [flatEntity.universalIdentifier]: flatEntity,
      },
      universalIdentifierById: {
        ...maps.universalIdentifierById,
        [flatEntity.id]: flatEntity.universalIdentifier,
      },
      universalIdentifiersByApplicationId: {
        ...maps.universalIdentifiersByApplicationId,
        [flatEntity.applicationId]: Array.from(
          new Set([
            ...(maps.universalIdentifiersByApplicationId[
              flatEntity.applicationId
            ] ?? []),
            flatEntity.universalIdentifier,
          ]),
        ),
      },
    }),
    flatEntityMaps,
  );

const removeFlatEntities = <T extends SyncableFlatEntity>(
  flatEntityMaps: FlatEntityMaps<T>,
  universalIdentifiers: Set<string>,
): FlatEntityMaps<T> => ({
  byUniversalIdentifier: Object.fromEntries(
    Object.entries(flatEntityMaps.byUniversalIdentifier).filter(
      ([universalIdentifier]) => !universalIdentifiers.has(universalIdentifier),
    ),
  ),
  universalIdentifierById: Object.fromEntries(
    Object.entries(flatEntityMaps.universalIdentifierById).filter(
      ([, universalIdentifier]) =>
        !isDefined(universalIdentifier) ||
        !universalIdentifiers.has(universalIdentifier),
    ),
  ),
  universalIdentifiersByApplicationId: Object.fromEntries(
    Object.entries(flatEntityMaps.universalIdentifiersByApplicationId).map(
      ([applicationId, applicationUniversalIdentifiers]) => [
        applicationId,
        (applicationUniversalIdentifiers ?? []).filter(
          (universalIdentifier) =>
            !universalIdentifiers.has(universalIdentifier),
        ),
      ],
    ),
  ),
});

// Adds the meeting fields (location type, meeting type, outcome, assigned AE) with their
// view fields, index and the workspace member inverse relation to existing workspaces
@RegisteredWorkspaceCommand('2.49.0', 1793022325268)
@Command({
  name: 'upgrade:2-49:provision-meeting-fields',
  description:
    'Add the Meeting (calendar event) locationType, meetingType, meetingOutcome and assignedTo fields, with their view fields and index, to existing workspaces. Pass --rollback to remove them.',
})
export class ProvisionMeetingFieldsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionMeetingFieldsCommandOptions> {
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

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionMeetingFieldsCommandOptions>): Promise<void> {
    const dryRun = options.dryRun ?? false;
    const isRollback = options.rollback === true;

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

    const fromToAllFlatEntityMaps = isRollback
      ? this.buildRollbackFromTo({ existing, standard })
      : this.buildProvisionFromTo({ workspaceId, existing, standard });

    if (!isDefined(fromToAllFlatEntityMaps)) {
      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
        {
          workspaceId,
          dryRun,
          buildOptions: {
            isSystemBuild: true,
            inferDeletionFromMissingEntities: isRollback ? true : {},
            applicationUniversalIdentifier:
              twentyStandardFlatApplication.universalIdentifier,
          },
          additionalCacheDataMaps: {
            featureFlagsMap: existing.featureFlagsMap,
          },
          idByUniversalIdentifierByMetadataName,
          fromToAllFlatEntityMaps,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Meeting fields ${isRollback ? 'rollback' : 'provisioning'} failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: meeting fields ${isRollback ? 'rolled back' : 'provisioned'}`,
    );
  }

  private buildProvisionFromTo({
    workspaceId,
    existing,
    standard,
  }: {
    workspaceId: string;
    existing: ActivityObjectsFlatEntityMaps;
    standard: ActivityObjectsFlatEntityMaps;
  }): FromToAllUniversalFlatEntityMaps | undefined {
    const { additions } = selectStandardAdditionsFromSeeds({
      existing,
      standard,
      seedUniversalIdentifiers: MEETING_FIELD_UNIVERSAL_IDENTIFIERS,
    });

    const additionCount = countFlatEntities(additions);

    if (additionCount === 0) {
      return undefined;
    }

    this.logger.log(
      `Workspace ${workspaceId}: ${additionCount} meeting field addition(s) (${Object.entries(
        additions,
      )
        .filter(([, flatEntities]) => flatEntities.length > 0)
        .map(([mapsKey, flatEntities]) => `${mapsKey}: ${flatEntities.length}`)
        .join(', ')})`,
    );

    return Object.fromEntries(
      ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
        mapsKey,
        {
          from: existing[mapsKey],
          to: addFlatEntities(
            existing[mapsKey] as FlatEntityMaps<SyncableFlatEntity>,
            additions[mapsKey] as SyncableFlatEntity[],
          ),
        },
      ]),
    ) as FromToAllUniversalFlatEntityMaps;
  }

  private buildRollbackFromTo({
    existing,
    standard,
  }: {
    existing: ActivityObjectsFlatEntityMaps;
    standard: ActivityObjectsFlatEntityMaps;
  }): FromToAllUniversalFlatEntityMaps {
    const emptyMaps = Object.fromEntries(
      ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
        mapsKey,
        {
          byUniversalIdentifier: {},
          universalIdentifierById: {},
          universalIdentifiersByApplicationId: {},
        },
      ]),
    ) as unknown as ActivityObjectsFlatEntityMaps;

    const { additions } = selectStandardAdditionsFromSeeds({
      existing: emptyMaps,
      standard,
      seedUniversalIdentifiers: MEETING_FIELD_UNIVERSAL_IDENTIFIERS,
    });

    const universalIdentifiersToRemove = new Set(
      Object.values(additions)
        .flat()
        .map((flatEntity) => flatEntity.universalIdentifier),
    );

    // Views or filters users built on the new fields point at what is removed
    let hasChanged = true;

    while (hasChanged) {
      hasChanged = false;

      for (const mapsKey of ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS) {
        for (const flatEntity of Object.values(
          existing[mapsKey].byUniversalIdentifier,
        ).filter(isDefined)) {
          if (
            !universalIdentifiersToRemove.has(flatEntity.universalIdentifier) &&
            collectParentReferences(flatEntity).some((reference) =>
              universalIdentifiersToRemove.has(reference),
            )
          ) {
            universalIdentifiersToRemove.add(flatEntity.universalIdentifier);
            hasChanged = true;
          }
        }
      }
    }

    return Object.fromEntries(
      ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
        mapsKey,
        {
          from: existing[mapsKey],
          to: removeFlatEntities(
            existing[mapsKey] as FlatEntityMaps<SyncableFlatEntity>,
            universalIdentifiersToRemove,
          ),
        },
      ]),
    ) as FromToAllUniversalFlatEntityMaps;
  }
}
