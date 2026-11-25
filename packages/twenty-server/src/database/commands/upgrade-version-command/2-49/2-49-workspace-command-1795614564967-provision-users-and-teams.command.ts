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
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionUsersAndTeamsCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const RESERVED_FIELD_NAMES_BY_OBJECT_UNIVERSAL_IDENTIFIER: Record<
  string,
  string[]
> = {
  [STANDARD_OBJECTS.service.universalIdentifier]: [
    'serviceOwner',
    'serviceOwnerAssignedDate',
  ],
  [STANDARD_OBJECTS.segment.universalIdentifier]: ['segmentOwner'],
  [STANDARD_OBJECTS.workspaceMember.universalIdentifier]: [
    'ownedServices',
    'ownedSegments',
  ],
};

const RESERVED_OBJECT_NAMES = new Set(['team', 'teamMembership']);

const USERS_AND_TEAMS_SEED_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.team.universalIdentifier,
  STANDARD_OBJECTS.teamMembership.universalIdentifier,
  STANDARD_OBJECTS.service.fields.serviceOwner.universalIdentifier,
  STANDARD_OBJECTS.service.fields.serviceOwnerAssignedDate.universalIdentifier,
  STANDARD_OBJECTS.service.indexes.serviceOwnerIdIndex.universalIdentifier,
  STANDARD_OBJECTS.segment.fields.segmentOwner.universalIdentifier,
  STANDARD_OBJECTS.segment.indexes.segmentOwnerIdIndex.universalIdentifier,
  STANDARD_OBJECTS.workspaceMember.fields.ownedServices.universalIdentifier,
  STANDARD_OBJECTS.workspaceMember.fields.ownedSegments.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.49.0', 1795614564967)
@Command({
  name: 'upgrade:2-49:provision-users-and-teams',
  description:
    'Add the hidden Team and Team Membership objects, Service Owner with its assigned date, and Segment owner. Fails on a workspace that holds custom metadata with the same names. Pass --rollback to remove them.',
})
export class ProvisionUsersAndTeamsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionUsersAndTeamsCommandOptions> {
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
    description: 'Remove the fields this command added',
    required: false,
  })
  parseRollback(): boolean {
    return true;
  }

  override async runOnWorkspace(
    args: RunOnWorkspaceArgs<ProvisionUsersAndTeamsCommandOptions>,
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
  }: RunOnWorkspaceArgs<ProvisionUsersAndTeamsCommandOptions>) {
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
      seedUniversalIdentifiers:
        USERS_AND_TEAMS_SEED_UNIVERSAL_IDENTIFIERS,
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
        `Users and teams provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    if (!dryRun) {
      await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
        'flatWorkspaceMemberMaps',
      ]);

      if (isDefined(dataSource)) {
        await dataSource.query(
          `UPDATE "${getWorkspaceSchemaName(workspaceId)}"."segment" SET "segmentOwnerId" = "createdByWorkspaceMemberId" WHERE "segmentOwnerId" IS NULL AND "createdByWorkspaceMemberId" IS NOT NULL`,
        );
      }
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${additionCount} users and teams standard addition(s)`,
    );
  }

  async down({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionUsersAndTeamsCommandOptions>) {
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
            seedUniversalIdentifiers:
              USERS_AND_TEAMS_SEED_UNIVERSAL_IDENTIFIERS,
          }),
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Users and teams rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    if (!dryRun) {
      await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
        'flatWorkspaceMemberMaps',
      ]);
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: users and teams rolled back`,
    );
  }

  private assertNoNameCollision({
    workspaceId,
    existing,
    twentyStandardApplicationUniversalIdentifier,
  }: {
    workspaceId: string;
    existing: Pick<
      ActivityObjectsFlatEntityMaps,
      'flatFieldMetadataMaps' | 'flatObjectMetadataMaps'
    >;
    twentyStandardApplicationUniversalIdentifier: string;
  }) {
    const fieldCollisions = Object.values(
      existing.flatFieldMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (flatFieldMetadata) =>
          flatFieldMetadata.applicationUniversalIdentifier !==
            twentyStandardApplicationUniversalIdentifier &&
          (
            RESERVED_FIELD_NAMES_BY_OBJECT_UNIVERSAL_IDENTIFIER[
              flatFieldMetadata.objectMetadataUniversalIdentifier
            ] ?? []
          ).includes(flatFieldMetadata.name),
      )
      .map(({ name }) => name);

    const objectCollisions = Object.values(
      existing.flatObjectMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (flatObjectMetadata) =>
          flatObjectMetadata.applicationUniversalIdentifier !==
            twentyStandardApplicationUniversalIdentifier &&
          RESERVED_OBJECT_NAMES.has(flatObjectMetadata.nameSingular),
      )
      .map(({ nameSingular }) => nameSingular);

    const collisions = [...fieldCollisions, ...objectCollisions];

    if (collisions.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} has custom metadata (${collisions.join(', ')}) that collides with the native Users & Teams metadata. Delete or rename it in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }
}
