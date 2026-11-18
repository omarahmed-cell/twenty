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

type ProvisionTaskAndNoteFieldsCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const SEEDED_FIELD_NAMES_BY_OBJECT = {
  task: ['assignedBy', 'assigneeAssignedAt', 'completedAt', 'isOverdue'],
  note: ['activityDate'],
  workspaceMember: ['tasksAssignedBy'],
} as const satisfies Partial<
  Record<keyof typeof STANDARD_OBJECTS, readonly string[]>
>;

const TASK_AND_NOTE_FIELDS_SEED_UNIVERSAL_IDENTIFIERS = Object.entries(
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

type RunArgs = {
  workspaceId: string;
  dataSource: DataSource;
  dryRun: boolean;
};

const NOTE_LINKED_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIER =
  '20202020-0d1a-4f0e-8a55-1c0a2f0a2c09';

@RegisteredWorkspaceCommand('2.49.0', 1795011565106)
@Command({
  name: 'upgrade:2-49:provision-task-and-note-fields',
  description:
    'Add the task Completed at, Is Overdue, Task assigned by and Owner assigned date fields and the note Activity date field, and date "added a note" timeline rows from Activity date. Fails on a workspace that holds custom fields with the same names. Pass --rollback to undo it.',
})
export class ProvisionTaskAndNoteFieldsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionTaskAndNoteFieldsCommandOptions> {
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

  override async runOnWorkspace({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs<ProvisionTaskAndNoteFieldsCommandOptions>): Promise<void> {
    if (!isDefined(dataSource)) {
      this.logger.log(`No data source for workspace ${workspaceId}, skipping`);

      return;
    }

    const runArgs = {
      workspaceId,
      dataSource,
      dryRun: options.dryRun ?? false,
    };

    if (options.rollback === true) {
      await this.down(runArgs);

      return;
    }

    await this.up(runArgs);
  }

  async up({ workspaceId, dataSource, dryRun }: RunArgs) {

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
      seedUniversalIdentifiers: TASK_AND_NOTE_FIELDS_SEED_UNIVERSAL_IDENTIFIERS,
    });
    const additionCount = countSeededStandardAdditions(provision.additions);

    if (dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: ${additionCount} task and note field standard addition(s)`,
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
          `Task and note fields provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }

      await this.backfill({ workspaceId, dataSource });
    }

    await this.setNoteLinkedHappensAtField({
      workspaceId,
      dataSource,
      applicationId: twentyStandardFlatApplication.id,
      happensAtFieldUniversalIdentifier:
        STANDARD_OBJECTS.note.fields.activityDate.universalIdentifier,
    });

    this.logger.log(
      `Workspace ${workspaceId}: ${additionCount} task and note field standard addition(s)`,
    );
  }

  async down({ workspaceId, dataSource, dryRun }: RunArgs) {

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    if (!dryRun) {
      await this.setNoteLinkedHappensAtField({
        workspaceId,
        dataSource,
        applicationId: twentyStandardFlatApplication.id,
        happensAtFieldUniversalIdentifier: null,
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
              TASK_AND_NOTE_FIELDS_SEED_UNIVERSAL_IDENTIFIERS,
          }),
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Task and note fields rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: task and note fields rolled back`,
    );
  }

  // Adding the column stamps every existing note with the upgrade time, so it is reset to createdAt
  private async backfill({
    workspaceId,
    dataSource,
  }: {
    workspaceId: string;
    dataSource: DataSource;
  }) {
    const schemaName = getWorkspaceSchemaName(workspaceId);

    await dataSource.query(
      `UPDATE "${schemaName}"."note" SET "activityDate" = "createdAt"`,
    );
    await dataSource.query(
      `UPDATE "${schemaName}"."timelineActivity" AS timeline_activity
       SET "happensAt" = note."activityDate"
       FROM "${schemaName}"."note" AS note, "core"."timelineActivityType" AS timeline_activity_type
       WHERE timeline_activity."linkedRecordId" = note.id
         AND timeline_activity."timelineActivityTypeId" = timeline_activity_type.id
         AND timeline_activity_type."workspaceId" = $1
         AND timeline_activity_type."universalIdentifier" = $2
         AND timeline_activity."happensAt" IS DISTINCT FROM note."activityDate"`,
      [workspaceId, NOTE_LINKED_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIER],
    );
    await dataSource.query(
      `UPDATE "${schemaName}"."task"
       SET "isOverdue" = true
       WHERE "dueAt" < now() AND "status" IS DISTINCT FROM 'DONE'`,
    );
  }

  private async setNoteLinkedHappensAtField({
    workspaceId,
    dataSource,
    applicationId,
    happensAtFieldUniversalIdentifier,
  }: {
    workspaceId: string;
    dataSource: DataSource;
    applicationId: string;
    happensAtFieldUniversalIdentifier: string | null;
  }) {
    await dataSource.query(
      `UPDATE "core"."timelineActivityType"
       SET "happensAtFieldUniversalIdentifier" = $4
       WHERE "workspaceId" = $1
         AND "applicationId" = $2
         AND "universalIdentifier" = $3
         AND "happensAtFieldUniversalIdentifier" IS DISTINCT FROM $4`,
      [
        workspaceId,
        applicationId,
        NOTE_LINKED_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIER,
        happensAtFieldUniversalIdentifier,
      ],
    );

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatTimelineActivityTypeMaps',
    ]);
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
        `Workspace ${workspaceId} has custom fields (${collisions.join(', ')}) that collide with the native task and note fields. Delete or rename them in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }
}
