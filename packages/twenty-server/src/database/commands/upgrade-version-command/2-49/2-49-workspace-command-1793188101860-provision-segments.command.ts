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
import { ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS } from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { computeMissingInitialObjectViewOperations } from 'src/engine/metadata-modules/view/utils/compute-missing-initial-object-view-operations.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { STANDARD_COMMAND_MENU_ITEMS } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-command-menu-item.constant';
import { STANDARD_NAVIGATION_MENU_ITEMS } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-navigation-menu-item.constant';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionSegmentsCommandOptions = ProvisionedWorkspaceCommandOptions & {
  rollback?: boolean;
};

const SEGMENT_OBJECT_NAMES = ['segment', 'segmentMember'];

const SEGMENT_OBJECT_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.segment.universalIdentifier,
  STANDARD_OBJECTS.segmentMember.universalIdentifier,
];

// The objects pull in their fields, views, layout and the inverse relations on the targets;
// the rest is not reached from them
const SEGMENT_SEED_UNIVERSAL_IDENTIFIERS = [
  ...SEGMENT_OBJECT_UNIVERSAL_IDENTIFIERS,
  STANDARD_OBJECTS.company.fields.segmentMembership.universalIdentifier,
  STANDARD_OBJECTS.person.fields.segmentMembership.universalIdentifier,
  STANDARD_OBJECTS.opportunity.fields.segmentMembership.universalIdentifier,
  STANDARD_NAVIGATION_MENU_ITEMS.allSegments.universalIdentifier,
  STANDARD_COMMAND_MENU_ITEMS.addToSegment.universalIdentifier,
  STANDARD_COMMAND_MENU_ITEMS.removeFromSegment.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.49.0', 1793188101860)
@Command({
  name: 'upgrade:2-49:provision-segments',
  description:
    'Create the Segment and Segment Member standard objects, the Segment Membership field on companies, people and opportunities, the Segments sidebar item and the segment record actions in existing workspaces. Fails on a workspace that still holds a custom segment/segmentMember object. Pass --rollback to remove what it added.',
})
export class ProvisionSegmentsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionSegmentsCommandOptions> {
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
  }: RunOnWorkspaceArgs<ProvisionSegmentsCommandOptions>): Promise<void> {
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

    if (!isRollback) {
      this.assertNoSegmentObjectNameCollision({
        workspaceId,
        flatObjectMetadataMaps: existing.flatObjectMetadataMaps,
        twentyStandardApplicationUniversalIdentifier:
          twentyStandardFlatApplication.universalIdentifier,
      });
    }

    const {
      allFlatEntityMaps: standard,
      idByUniversalIdentifierByMetadataName,
    } = computeTwentyStandardApplicationAllFlatEntityMaps({
      now: new Date().toISOString(),
      workspaceId,
      twentyStandardApplicationId: twentyStandardFlatApplication.id,
    });

    let fromToAllFlatEntityMaps;

    if (isRollback) {
      fromToAllFlatEntityMaps = buildSeededStandardRollbackFromTo({
        existing,
        standard,
        seedUniversalIdentifiers: SEGMENT_SEED_UNIVERSAL_IDENTIFIERS,
      });
    } else {
      const provision = buildSeededStandardAdditionsFromTo({
        existing,
        standard,
        seedUniversalIdentifiers: SEGMENT_SEED_UNIVERSAL_IDENTIFIERS,
      });

      if (countSeededStandardAdditions(provision.additions) === 0) {
        if (!dryRun) {
          await this.provisionInitialObjectViews(workspaceId);
        }

        return;
      }

      fromToAllFlatEntityMaps = provision.fromToAllFlatEntityMaps;
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
        `Segments ${isRollback ? 'rollback' : 'provisioning'} failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    if (!isRollback && !dryRun) {
      await this.provisionInitialObjectViews(workspaceId);
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: segments ${isRollback ? 'rolled back' : 'provisioned'}`,
    );
  }

  async up(args: RunOnWorkspaceArgs<ProvisionSegmentsCommandOptions>) {
    await this.runOnWorkspace({
      ...args,
      options: { ...args.options, rollback: false },
    });
  }

  async down(args: RunOnWorkspaceArgs<ProvisionSegmentsCommandOptions>) {
    await this.runOnWorkspace({
      ...args,
      options: { ...args.options, rollback: true },
    });
  }

  private assertNoSegmentObjectNameCollision({
    workspaceId,
    flatObjectMetadataMaps,
    twentyStandardApplicationUniversalIdentifier,
  }: {
    workspaceId: string;
    flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
    twentyStandardApplicationUniversalIdentifier: string;
  }) {
    const reservedNames = new Set(
      SEGMENT_OBJECT_NAMES.flatMap((nameSingular) => [
        nameSingular,
        `${nameSingular}s`,
      ]),
    );

    const collidingObjects = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (flatObjectMetadata) =>
          flatObjectMetadata.applicationUniversalIdentifier !==
            twentyStandardApplicationUniversalIdentifier &&
          (reservedNames.has(flatObjectMetadata.nameSingular) ||
            reservedNames.has(flatObjectMetadata.namePlural)),
      );

    if (collidingObjects.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} still has custom object(s) ${collidingObjects
          .map(({ nameSingular }) => nameSingular)
          .join(
            ', ',
          )} that collide with the Segment standard objects. Export their records, delete them in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }

  // Workspace creation gives each standard object an initial view owned by the custom application
  private async provisionInitialObjectViews(workspaceId: string) {
    const { flatObjectMetadataMaps, flatViewMaps, flatViewFieldMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatViewMaps',
        'flatViewFieldMaps',
      ]);

    const { workspaceCustomFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const { viewsToCreate, viewFieldsToCreate } =
      computeMissingInitialObjectViewOperations({
        flatObjectMetadatas: SEGMENT_OBJECT_UNIVERSAL_IDENTIFIERS.map(
          (universalIdentifier) =>
            flatObjectMetadataMaps.byUniversalIdentifier[universalIdentifier],
        ).filter(isDefined),
        flatViewMaps,
        flatViewFieldMaps,
        initialViewApplicationUniversalIdentifier:
          workspaceCustomFlatApplication.universalIdentifier,
      });

    if (viewsToCreate.length + viewFieldsToCreate.length === 0) {
      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          workspaceId,
          applicationUniversalIdentifier:
            workspaceCustomFlatApplication.universalIdentifier,
          allFlatEntityOperationByMetadataName: {
            view: {
              flatEntityToCreate: viewsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
            viewField: {
              flatEntityToCreate: viewFieldsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Failed to seed segment initial views for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }
  }
}
