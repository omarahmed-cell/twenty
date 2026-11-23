import { isNonEmptyString } from '@sniptt/guards';
import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import {
  buildQualifyingCalendarEventCondition,
  getTableColumns,
  getWorkspaceSchema,
} from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795400000001-copy-calendar-events-to-meetings.command';
import { buildStandardRemovalFromTo } from 'src/database/commands/upgrade-version-command/2-49/utils/build-seeded-standard-additions-from-to.util';
import {
  LEGACY_CALENDAR_EVENT_FIELD_UNIVERSAL_IDENTIFIERS,
  LEGACY_WORKSPACE_MEMBER_ASSIGNED_CALENDAR_EVENTS_UNIVERSAL_IDENTIFIER,
} from 'src/database/commands/upgrade-version-command/2-49/utils/legacy-calendar-event-field-universal-identifiers.constant';
import { ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS } from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const LEGACY_CALENDAR_EVENT_ASSIGNED_TO_INDEX_UNIVERSAL_IDENTIFIER =
  '432b9702-97f7-449c-a8db-a0916170cd83';

// calendarEvent goes back to Twenty's native fields once the Meeting copy is in place
@RegisteredWorkspaceCommand('2.49.0', 1795400000002)
@Command({
  name: 'upgrade:2-49:remove-legacy-calendar-event-meeting-fields',
  description:
    'Remove the meeting fields Roboost had added to calendar events (type, outcome, location type, assignee, recording, transcript, source, record source) now that meetings live on the Meeting object. Refuses to run while a linked calendar event has no Meeting copy.',
})
export class RemoveLegacyCalendarEventMeetingFieldsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace(args: RunOnWorkspaceArgs): Promise<void> {
    await this.up(args);
  }

  async up({ workspaceId, dataSource, options }: RunOnWorkspaceArgs) {
    const dryRun = options.dryRun ?? false;

    if (isDefined(dataSource)) {
      const schema = await getWorkspaceSchema(dataSource, workspaceId);

      if (isNonEmptyString(schema)) {
        const columns = await getTableColumns(
          dataSource,
          schema,
          'calendarEvent',
        );
        const meetingColumns = await getTableColumns(
          dataSource,
          schema,
          'meeting',
        );

        if (columns.size > 0) {
          if (meetingColumns.size === 0) {
            throw new Error(
              `Workspace ${workspaceId}: the Meeting object is missing, so calendar event meeting fields are kept`,
            );
          }

          const [{ count }] = await dataSource.query(
            `SELECT count(*) FROM "${schema}"."calendarEvent" e
             WHERE ${buildQualifyingCalendarEventCondition(schema, columns)}
               AND NOT EXISTS (SELECT 1 FROM "${schema}"."meeting" m WHERE m."id" = e."id")`,
          );

          if (Number(count) > 0) {
            throw new Error(
              `Workspace ${workspaceId}: ${count} linked calendar events have no Meeting copy; run upgrade:2-49:copy-calendar-events-to-meetings first`,
            );
          }
        }
      }
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

    const { fromToAllFlatEntityMaps, removedUniversalIdentifiers } =
      buildStandardRemovalFromTo({
        existing,
        universalIdentifiers: [
          ...Object.values(
            LEGACY_CALENDAR_EVENT_FIELD_UNIVERSAL_IDENTIFIERS,
          ).map(({ universalIdentifier }) => universalIdentifier),
          LEGACY_WORKSPACE_MEMBER_ASSIGNED_CALENDAR_EVENTS_UNIVERSAL_IDENTIFIER,
          LEGACY_CALENDAR_EVENT_ASSIGNED_TO_INDEX_UNIVERSAL_IDENTIFIER,
        ],
      });

    if (removedUniversalIdentifiers.length === 0) {
      return;
    }

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
          fromToAllFlatEntityMaps,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Removing calendar event meeting fields failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: removed ${removedUniversalIdentifiers.length} calendar event meeting metadata entities`,
    );
  }

  async down() {
    // The values live on Meeting now; restoring the old fields would bring them back empty
  }
}
