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
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionDealFieldsCommandOptions = ProvisionedWorkspaceCommandOptions & {
  rollback?: boolean;
};

const SEEDED_FIELD_NAMES_BY_OBJECT = {
  opportunity: [
    'dealCollaborators',
    'ownerAssignedDate',
    'lastActivityDate',
    'numberOfAssociatedContacts',
    'numberOfAssociatedLineItems',
    'nextActivityDate',
  ],
  person: ['nextActivityDate'],
  company: ['nextActivityDate'],
  workspaceMember: ['collaboratingOpportunities'],
} as const satisfies Partial<
  Record<keyof typeof STANDARD_OBJECTS, readonly string[]>
>;

const DEAL_FIELD_SEED_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.opportunityCollaborator.universalIdentifier,
  // Deal Team, removed by upgrade:2-49:remove-hubspot-team-fields
  'df1a7520-16f7-4753-bd3b-66fdfdd15683',
  ...Object.entries(SEEDED_FIELD_NAMES_BY_OBJECT).flatMap(
    ([objectName, fieldNames]) =>
      fieldNames.map(
        (fieldName) =>
          (
            STANDARD_OBJECTS[objectName as keyof typeof STANDARD_OBJECTS]
              .fields as Record<string, { universalIdentifier: string }>
          )[fieldName].universalIdentifier,
      ),
  ),
];

const RESERVED_OBJECT_NAMES = new Set([
  'opportunityCollaborator',
  'opportunityCollaborators',
]);

@RegisteredWorkspaceCommand('2.49.0', 1794778290530)
@Command({
  name: 'upgrade:2-49:provision-deal-fields',
  description:
    'Add the native deal fields (Team, Deal collaborators through the Deal Collaborator junction, Owner assigned date, Last Activity Date, Next Activity Date, Number of Associated Contacts, Number of Associated Line Items), Next Activity Date on people and companies, and the collaborator timeline entries. Fails on a workspace that holds custom metadata with the same names. Pass --rollback to remove what it added.',
})
export class ProvisionDealFieldsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionDealFieldsCommandOptions> {
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
  }: RunOnWorkspaceArgs<ProvisionDealFieldsCommandOptions>): Promise<void> {
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
      this.assertNoNameCollision({
        workspaceId,
        flatObjectMetadataMaps: existing.flatObjectMetadataMaps,
        flatFieldMetadataMaps: existing.flatFieldMetadataMaps,
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
    let additionCount = 0;

    if (isRollback) {
      fromToAllFlatEntityMaps = buildSeededStandardRollbackFromTo({
        existing,
        standard,
        seedUniversalIdentifiers: DEAL_FIELD_SEED_UNIVERSAL_IDENTIFIERS,
      });
    } else {
      const provision = buildSeededStandardAdditionsFromTo({
        existing,
        standard,
        seedUniversalIdentifiers: DEAL_FIELD_SEED_UNIVERSAL_IDENTIFIERS,
      });

      additionCount = countSeededStandardAdditions(provision.additions);

      if (additionCount === 0) {
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
        `Deal fields ${isRollback ? 'rollback' : 'provisioning'} failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${isRollback ? 'deal fields rolled back' : `${additionCount} deal field standard addition(s)`}`,
    );
  }

  async up(args: RunOnWorkspaceArgs<ProvisionDealFieldsCommandOptions>) {
    await this.runOnWorkspace({
      ...args,
      options: { ...args.options, rollback: false },
    });
  }

  async down(args: RunOnWorkspaceArgs<ProvisionDealFieldsCommandOptions>) {
    await this.runOnWorkspace({
      ...args,
      options: { ...args.options, rollback: true },
    });
  }

  private assertNoNameCollision({
    workspaceId,
    flatObjectMetadataMaps,
    flatFieldMetadataMaps,
    twentyStandardApplicationUniversalIdentifier,
  }: {
    workspaceId: string;
    flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
    flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
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

    const collidingObjectNames = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (flatObjectMetadata) =>
          flatObjectMetadata.applicationUniversalIdentifier !==
            twentyStandardApplicationUniversalIdentifier &&
          (RESERVED_OBJECT_NAMES.has(flatObjectMetadata.nameSingular) ||
            RESERVED_OBJECT_NAMES.has(flatObjectMetadata.namePlural)),
      )
      .map(({ nameSingular }) => nameSingular);

    const collidingFieldNames = Object.values(
      flatFieldMetadataMaps.byUniversalIdentifier,
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

    const collisions = [...collidingObjectNames, ...collidingFieldNames];

    if (collisions.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} has custom metadata (${collisions.join(', ')}) that collides with the native deal fields. Delete or rename it in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }
}
