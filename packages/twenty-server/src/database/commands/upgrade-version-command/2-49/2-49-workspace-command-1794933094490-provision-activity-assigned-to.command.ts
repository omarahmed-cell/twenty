import { Command, Option } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import {
  ProvisionedWorkspaceCommandRunner,
  type ProvisionedWorkspaceCommandOptions,
} from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { buildActivityAssignedToLabelUpdates } from 'src/database/commands/upgrade-version-command/2-49/utils/build-activity-assigned-to-label-updates.util';
import {
  buildSeededStandardAdditionsFromTo,
  buildSeededStandardRollbackFromTo,
  countSeededStandardAdditions,
} from 'src/database/commands/upgrade-version-command/2-49/utils/build-seeded-standard-additions-from-to.util';
import {
  ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
  type ActivityObjectsFlatEntityMaps,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { type FromToAllUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';

type ProvisionActivityAssignedToCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const SEEDED_FIELD_NAMES_BY_OBJECT = {
  call: ['assignedTo'],
  note: ['assignedTo'],
  email: ['assignedTo'],
  communication: ['assignedTo'],
  workspaceMember: [
    'assignedCalls',
    'assignedNotes',
    'assignedEmails',
    'assignedCommunications',
  ],
} as const satisfies Partial<
  Record<keyof typeof STANDARD_OBJECTS, readonly string[]>
>;

const ACTIVITY_ASSIGNED_TO_SEED_UNIVERSAL_IDENTIFIERS = Object.entries(
  SEEDED_FIELD_NAMES_BY_OBJECT,
).flatMap(([objectName, fieldNames]) =>
  fieldNames.map(
    (fieldName) =>
      (
        STANDARD_OBJECTS[objectName as keyof typeof STANDARD_OBJECTS]
          .fields as Record<string, { universalIdentifier: string }>
      )[fieldName].universalIdentifier,
  ),
);

@RegisteredWorkspaceCommand('2.49.0', 1794933094490)
@Command({
  name: 'upgrade:2-49:provision-activity-assigned-to',
  description:
    'Add the Activity assigned to field (with its index and view fields) to calls, notes, emails and communications, and relabel task Assignee and meeting Assigned to as Activity assigned to. Fails on a workspace that holds custom fields with the same names. Pass --rollback to undo it.',
})
export class ProvisionActivityAssignedToCommand extends ProvisionedWorkspaceCommandRunner<ProvisionActivityAssignedToCommandOptions> {
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
    args: RunOnWorkspaceArgs<ProvisionActivityAssignedToCommandOptions>,
  ): Promise<void> {
    if (args.options.rollback === true) {
      await this.down(args);

      return;
    }

    await this.up(args);
  }

  async up({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionActivityAssignedToCommandOptions>) {
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

    this.assertNoNameCollision({
      workspaceId,
      existing,
      twentyStandardApplicationUniversalIdentifier:
        twentyStandardFlatApplication.universalIdentifier,
    });

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
      seedUniversalIdentifiers: ACTIVITY_ASSIGNED_TO_SEED_UNIVERSAL_IDENTIFIERS,
    });
    const additionCount = countSeededStandardAdditions(provision.additions);

    const labelUpdates = buildActivityAssignedToLabelUpdates({
      existingFlatFieldMetadataMaps: existing.flatFieldMetadataMaps,
      standardFlatFieldMetadataMaps: standard.flatFieldMetadataMaps,
      direction: 'up',
    });

    if (additionCount + labelUpdates.length === 0) {
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
          fromToAllFlatEntityMaps: withFieldMetadataUpdates({
            fromToAllFlatEntityMaps: provision.fromToAllFlatEntityMaps,
            existingFlatFieldMetadataMaps: existing.flatFieldMetadataMaps,
            flatFieldMetadatas: labelUpdates,
          }),
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Activity assigned to provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${additionCount} activity assigned to standard addition(s) and ${labelUpdates.length} label update(s)`,
    );
  }

  async down({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionActivityAssignedToCommandOptions>) {
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

    const labelUpdates = buildActivityAssignedToLabelUpdates({
      existingFlatFieldMetadataMaps: existing.flatFieldMetadataMaps,
      standardFlatFieldMetadataMaps: standard.flatFieldMetadataMaps,
      direction: 'down',
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
          fromToAllFlatEntityMaps: withFieldMetadataUpdates({
            fromToAllFlatEntityMaps: buildSeededStandardRollbackFromTo({
              existing,
              standard,
              seedUniversalIdentifiers:
                ACTIVITY_ASSIGNED_TO_SEED_UNIVERSAL_IDENTIFIERS,
            }),
            existingFlatFieldMetadataMaps: existing.flatFieldMetadataMaps,
            flatFieldMetadatas: labelUpdates,
          }),
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Activity assigned to rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: activity assigned to rolled back`,
    );
  }

  private assertNoNameCollision({
    workspaceId,
    existing,
    twentyStandardApplicationUniversalIdentifier,
  }: {
    workspaceId: string;
    existing: Pick<ActivityObjectsFlatEntityMaps, 'flatFieldMetadataMaps'>;
    twentyStandardApplicationUniversalIdentifier: string;
  }) {
    const reservedFieldNamesByObjectUniversalIdentifier = new Map<
      string,
      readonly string[]
    >(
      Object.entries(SEEDED_FIELD_NAMES_BY_OBJECT).map(
        ([objectName, fieldNames]) => [
          STANDARD_OBJECTS[objectName as keyof typeof STANDARD_OBJECTS]
            .universalIdentifier,
          fieldNames,
        ],
      ),
    );

    const collisions = Object.values(
      existing.flatFieldMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (flatFieldMetadata) =>
          flatFieldMetadata.applicationUniversalIdentifier !==
            twentyStandardApplicationUniversalIdentifier &&
          (
            reservedFieldNamesByObjectUniversalIdentifier.get(
              flatFieldMetadata.objectMetadataUniversalIdentifier,
            ) ?? []
          ).includes(flatFieldMetadata.name),
      )
      .map(({ name }) => name);

    if (collisions.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} has custom fields (${collisions.join(', ')}) that collide with the native Activity assigned to fields. Delete or rename them in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }
}

const withFieldMetadataUpdates = ({
  fromToAllFlatEntityMaps,
  existingFlatFieldMetadataMaps,
  flatFieldMetadatas,
}: {
  fromToAllFlatEntityMaps: FromToAllUniversalFlatEntityMaps;
  existingFlatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  flatFieldMetadatas: FlatFieldMetadata[];
}): FromToAllUniversalFlatEntityMaps => {
  const fieldMetadataFromTo = fromToAllFlatEntityMaps.flatFieldMetadataMaps;
  const from = fieldMetadataFromTo?.from ?? existingFlatFieldMetadataMaps;
  const to = (fieldMetadataFromTo?.to ??
    existingFlatFieldMetadataMaps) as FlatEntityMaps<FlatFieldMetadata>;

  return {
    ...fromToAllFlatEntityMaps,
    flatFieldMetadataMaps: {
      from,
      to: {
        ...to,
        byUniversalIdentifier: {
          ...to.byUniversalIdentifier,
          ...Object.fromEntries(
            flatFieldMetadatas.map((flatFieldMetadata) => [
              flatFieldMetadata.universalIdentifier,
              flatFieldMetadata,
            ]),
          ),
        },
      },
    },
  } as FromToAllUniversalFlatEntityMaps;
};
