import { isNonEmptyString } from '@sniptt/guards';
import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { isBeyondCalendarEventsImportHorizon } from 'src/modules/calendar/calendar-event-import-manager/utils/is-beyond-calendar-events-import-horizon.util';
import { isInternalCalendarEvent } from 'src/modules/calendar/calendar-event-import-manager/utils/is-internal-calendar-event.util';

const CALENDAR_EVENTS_IMPORT_HORIZON_DAYS = 365;
const DELETE_BATCH_SIZE = 500;

type SyncedCalendarEventRow = {
  id: string;
  startsAt: Date | null;
  calendarChannelIds: string[];
};

type CalendarChannelHandlesRow = {
  id: string;
  handle: string | null;
  handleAliases: string[] | null;
};

type CalendarEventParticipantRow = {
  calendarEventId: string;
  handle: string | null;
};

@RegisteredWorkspaceCommand('2.49.0', 1794410000000)
@Command({
  name: 'upgrade:2-49:remove-out-of-horizon-and-internal-calendar-events',
  description:
    'Delete synced calendar events starting more than 365 days ahead, and internal ones when internal meeting import is off',
})
export class RemoveOutOfHorizonAndInternalCalendarEventsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace(args: RunOnWorkspaceArgs): Promise<void> {
    await this.up(args);
  }

  async up({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      return;
    }

    const [workspace] = await dataSource.query(
      `SELECT "databaseSchema", "isInternalCalendarEventsImportEnabled" FROM "core"."workspace" WHERE "id" = $1`,
      [workspaceId],
    );

    const databaseSchema: string | undefined = workspace?.databaseSchema;

    if (!isNonEmptyString(databaseSchema)) {
      return;
    }

    const isInternalCalendarEventsImportEnabled =
      workspace.isInternalCalendarEventsImportEnabled === true;

    const syncedCalendarEvents: SyncedCalendarEventRow[] =
      await dataSource.query(
        `SELECT "calendarEvent"."id", "calendarEvent"."startsAt",
          array_agg(DISTINCT "association"."calendarChannelId") AS "calendarChannelIds"
        FROM "${databaseSchema}"."calendarEvent" "calendarEvent"
        JOIN "${databaseSchema}"."calendarChannelEventAssociation" "association"
          ON "association"."calendarEventId" = "calendarEvent"."id"
        GROUP BY "calendarEvent"."id"`,
      );

    if (syncedCalendarEvents.length === 0) {
      return;
    }

    const calendarChannels: CalendarChannelHandlesRow[] =
      await dataSource.query(
        `SELECT "calendarChannel"."id", "calendarChannel"."handle", "connectedAccount"."handleAliases"
        FROM "core"."calendarChannel" "calendarChannel"
        JOIN "core"."connectedAccount" "connectedAccount"
          ON "connectedAccount"."id" = "calendarChannel"."connectedAccountId"
        WHERE "calendarChannel"."workspaceId" = $1`,
        [workspaceId],
      );

    const handlesByCalendarChannelId = new Map(
      calendarChannels.map(({ id, handle, handleAliases }) => [
        id,
        [handle, ...(handleAliases ?? [])].filter(isDefined),
      ]),
    );

    const participants: CalendarEventParticipantRow[] =
      isInternalCalendarEventsImportEnabled
        ? []
        : await dataSource.query(
            `SELECT "calendarEventId", "handle" FROM "${databaseSchema}"."calendarEventParticipant"`,
          );

    const participantHandlesByCalendarEventId = new Map<string, string[]>();

    for (const { calendarEventId, handle } of participants) {
      if (!isDefined(handle)) {
        continue;
      }

      participantHandlesByCalendarEventId.set(calendarEventId, [
        ...(participantHandlesByCalendarEventId.get(calendarEventId) ?? []),
        handle,
      ]);
    }

    const isInternalForAllItsChannels = ({
      id,
      calendarChannelIds,
    }: SyncedCalendarEventRow) => {
      const event = {
        organizerHandle: '',
        participants: (participantHandlesByCalendarEventId.get(id) ?? []).map(
          (handle) => ({
            handle,
            displayName: '',
            responseStatus: '',
            isOrganizer: false,
          }),
        ),
      };

      return calendarChannelIds.every((calendarChannelId) => {
        const calendarChannelHandles =
          handlesByCalendarChannelId.get(calendarChannelId) ?? [];

        return (
          calendarChannelHandles.length > 0 &&
          isInternalCalendarEvent(event, calendarChannelHandles)
        );
      });
    };

    const calendarEventIdsToDelete = syncedCalendarEvents
      .filter(
        (calendarEvent) =>
          isBeyondCalendarEventsImportHorizon({
            startsAt: calendarEvent.startsAt?.toISOString(),
            horizonDays: CALENDAR_EVENTS_IMPORT_HORIZON_DAYS,
          }) ||
          (!isInternalCalendarEventsImportEnabled &&
            isInternalForAllItsChannels(calendarEvent)),
      )
      .map(({ id }) => id);

    if (calendarEventIdsToDelete.length === 0) {
      return;
    }

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would delete ${calendarEventIdsToDelete.length} of ${syncedCalendarEvents.length} synced calendar event(s)`,
      );

      return;
    }

    for (
      let index = 0;
      index < calendarEventIdsToDelete.length;
      index += DELETE_BATCH_SIZE
    ) {
      const batch = calendarEventIdsToDelete.slice(
        index,
        index + DELETE_BATCH_SIZE,
      );

      // Participants, channel associations and targets cascade; timeline rows only reference the event by id.
      await dataSource.query(
        `DELETE FROM "${databaseSchema}"."timelineActivity" WHERE "linkedRecordId" = ANY($1::uuid[])`,
        [batch],
      );
      await dataSource.query(
        `DELETE FROM "${databaseSchema}"."calendarEvent" WHERE "id" = ANY($1::uuid[])`,
        [batch],
      );
    }

    this.logger.log(
      `Workspace ${workspaceId}: deleted ${calendarEventIdsToDelete.length} of ${syncedCalendarEvents.length} synced calendar event(s)`,
    );
  }

  async down({ workspaceId }: RunOnWorkspaceArgs): Promise<void> {
    // Deleted events cannot be restored; the next calendar sync re-imports what is in range.
    this.logger.log(
      `Workspace ${workspaceId}: nothing to roll back for calendar event cleanup`,
    );
  }
}
