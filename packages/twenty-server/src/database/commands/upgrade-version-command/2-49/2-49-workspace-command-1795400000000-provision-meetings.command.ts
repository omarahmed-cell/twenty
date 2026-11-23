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

type ProvisionMeetingsCommandOptions = ProvisionedWorkspaceCommandOptions & {
  rollback?: boolean;
};

const MEETINGS_SEED_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.meeting.universalIdentifier,
  STANDARD_OBJECTS.meetingTarget.universalIdentifier,
  STANDARD_OBJECTS.meetingAttendee.universalIdentifier,
];

const RESERVED_FIELD_NAMES_BY_OBJECT_UNIVERSAL_IDENTIFIER: Record<
  string,
  string[]
> = {
  [STANDARD_OBJECTS.company.universalIdentifier]: ['meetingTargets'],
  [STANDARD_OBJECTS.person.universalIdentifier]: [
    'meetingTargets',
    'meetingAttendees',
  ],
  [STANDARD_OBJECTS.opportunity.universalIdentifier]: ['meetingTargets'],
  [STANDARD_OBJECTS.service.universalIdentifier]: ['meetingTargets'],
  [STANDARD_OBJECTS.workspaceMember.universalIdentifier]: [
    'hostedMeetings',
    'assignedMeetings',
    'meetingAttendees',
  ],
  [STANDARD_OBJECTS.timelineActivity.universalIdentifier]: ['targetMeeting'],
  [STANDARD_OBJECTS.attachment.universalIdentifier]: ['targetMeeting'],
};

@RegisteredWorkspaceCommand('2.49.0', 1795400000000)
@Command({
  name: 'upgrade:2-49:provision-meetings',
  description:
    'Create the Meeting object, its MeetingTarget links to people, companies, deals and services, its MeetingAttendee rows and its timeline types. Fails on a workspace holding custom metadata with the same names. Pass --rollback to remove what it added.',
})
export class ProvisionMeetingsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionMeetingsCommandOptions> {
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
  }: RunOnWorkspaceArgs<ProvisionMeetingsCommandOptions>): Promise<void> {
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

    if (isRollback) {
      fromToAllFlatEntityMaps = buildSeededStandardRollbackFromTo({
        existing,
        standard,
        seedUniversalIdentifiers: MEETINGS_SEED_UNIVERSAL_IDENTIFIERS,
      });
    } else {
      const provision = buildSeededStandardAdditionsFromTo({
        existing,
        standard,
        seedUniversalIdentifiers: MEETINGS_SEED_UNIVERSAL_IDENTIFIERS,
      });

      if (countSeededStandardAdditions(provision.additions) === 0) {
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
        `Meetings ${isRollback ? 'rollback' : 'provisioning'} failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: meetings ${isRollback ? 'rolled back' : 'provisioned'}`,
    );
  }

  async up(args: RunOnWorkspaceArgs<ProvisionMeetingsCommandOptions>) {
    await this.runOnWorkspace({
      ...args,
      options: { ...args.options, rollback: false },
    });
  }

  async down(args: RunOnWorkspaceArgs<ProvisionMeetingsCommandOptions>) {
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
    const reservedObjectNames = new Set([
      'meeting',
      'meetings',
      'meetingTarget',
      'meetingTargets',
      'meetingAttendee',
      'meetingAttendees',
    ]);

    const collidingObjectNames = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (flatObjectMetadata) =>
          flatObjectMetadata.applicationUniversalIdentifier !==
            twentyStandardApplicationUniversalIdentifier &&
          (reservedObjectNames.has(flatObjectMetadata.nameSingular) ||
            reservedObjectNames.has(flatObjectMetadata.namePlural)),
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
            RESERVED_FIELD_NAMES_BY_OBJECT_UNIVERSAL_IDENTIFIER[
              flatFieldMetadata.objectMetadataUniversalIdentifier
            ] ?? []
          ).includes(flatFieldMetadata.name),
      )
      .map(({ name }) => name);

    const collisions = [...collidingObjectNames, ...collidingFieldNames];

    if (collisions.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} still has custom metadata (${collisions.join(', ')}) that collides with the Meeting standard metadata. Delete it in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }
}
