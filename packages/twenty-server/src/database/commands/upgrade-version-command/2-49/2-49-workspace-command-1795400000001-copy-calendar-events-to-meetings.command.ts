import { isNonEmptyString } from '@sniptt/guards';
import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';
import { type DataSource } from 'typeorm';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';

// Meetings keep the calendar event id, so the mapping is one to one and a rerun skips what was copied
@RegisteredWorkspaceCommand('2.49.0', 1795400000001)
@Command({
  name: 'upgrade:2-49:copy-calendar-events-to-meetings',
  description:
    'Copy every calendar event linked to the CRM (a matched contact, a link, or values in the meeting fields) to a Meeting with the same id, with its attendees and links (contacts plus their companies)',
})
export class CopyCalendarEventsToMeetingsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace(args: RunOnWorkspaceArgs): Promise<void> {
    await this.up(args);
  }

  async up({ workspaceId, dataSource, options }: RunOnWorkspaceArgs) {
    if (!isDefined(dataSource)) {
      return;
    }

    const schema = await getWorkspaceSchema(dataSource, workspaceId);

    if (!isNonEmptyString(schema)) {
      return;
    }

    const columns = await getTableColumns(dataSource, schema, 'calendarEvent');

    if (!(await tableExists(dataSource, schema, 'meeting'))) {
      this.logger.warn(`Workspace ${workspaceId}: no meeting table, skipped`);

      return;
    }

    const statements = buildCopyStatements(schema, columns);

    if (options.dryRun === true) {
      const [{ count }] = await dataSource.query(statements.countQualifying);

      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: ${count} calendar events would be copied to meetings`,
      );

      return;
    }

    await dataSource.transaction(async (manager) => {
      const meetings = await manager.query(statements.insertMeetings);
      const attendees = await manager.query(statements.insertAttendees);
      const targets = await manager.query(statements.insertTargets);

      this.logger.log(
        `Workspace ${workspaceId}: copied ${countRows(meetings)} meetings, ${countRows(attendees)} attendees, ${countRows(targets)} links`,
      );
    });
  }

  async down({ workspaceId, dataSource }: RunOnWorkspaceArgs) {
    if (!isDefined(dataSource)) {
      return;
    }

    const schema = await getWorkspaceSchema(dataSource, workspaceId);

    if (
      !isNonEmptyString(schema) ||
      !(await tableExists(dataSource, schema, 'meeting'))
    ) {
      return;
    }

    await dataSource.query(
      `DELETE FROM "${schema}"."meeting" WHERE "id" IN (SELECT "id" FROM "${schema}"."calendarEvent")`,
    );
  }
}

const countRows = (result: unknown) =>
  Array.isArray(result) && Array.isArray(result[0])
    ? result[0].length
    : Array.isArray(result)
      ? result.length
      : 0;

export const getWorkspaceSchema = async (
  dataSource: DataSource,
  workspaceId: string,
): Promise<string | undefined> => {
  const [workspace] = await dataSource.query(
    `SELECT "databaseSchema" FROM "core"."workspace" WHERE "id" = $1`,
    [workspaceId],
  );

  return workspace?.databaseSchema;
};

export const getTableColumns = async (
  dataSource: DataSource,
  schema: string,
  table: string,
): Promise<Set<string>> => {
  const rows: { column_name: string }[] = await dataSource.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
    [schema, table],
  );

  return new Set(rows.map(({ column_name }) => column_name));
};

const tableExists = async (
  dataSource: DataSource,
  schema: string,
  table: string,
) => (await getTableColumns(dataSource, schema, table)).size > 0;

// Values a rep or an import put on the meeting; sync bookkeeping (source, assignee, record source) does not count
const USER_VALUE_CONDITIONS: Record<string, string> = {
  hubspotId: `e."hubspotId" IS NOT NULL`,
  meetingType: `e."meetingType" IS NOT NULL`,
  meetingOutcome: `e."meetingOutcome" IS NOT NULL`,
  locationType: `e."locationType" IS NOT NULL`,
  internalMeetingNotesMarkdown: `coalesce(e."internalMeetingNotesMarkdown", '') <> ''`,
  meetingSummaryMarkdown: `coalesce(e."meetingSummaryMarkdown", '') <> ''`,
  recordedVideoPrimaryLinkUrl: `coalesce(e."recordedVideoPrimaryLinkUrl", '') <> ''`,
  transcriptPrimaryLinkUrl: `coalesce(e."transcriptPrimaryLinkUrl", '') <> ''`,
};

export const buildQualifyingCalendarEventCondition = (
  schema: string,
  columns: Set<string>,
) =>
  `e."deletedAt" IS NULL AND (
    EXISTS (SELECT 1 FROM "${schema}"."calendarEventParticipant" p
      WHERE p."calendarEventId" = e."id" AND p."personId" IS NOT NULL AND p."deletedAt" IS NULL)
    OR EXISTS (SELECT 1 FROM "${schema}"."calendarEventTarget" t
      WHERE t."calendarEventId" = e."id" AND t."deletedAt" IS NULL)
    ${Object.entries(USER_VALUE_CONDITIONS)
      .filter(([column]) => columns.has(column))
      .map(([, condition]) => `OR ${condition}`)
      .join('\n    ')}
  )`;

const buildCopyStatements = (schema: string, columns: Set<string>) => {
  const has = (column: string) => columns.has(column);
  const enumOf = (column: string) => `"${schema}"."meeting_${column}_enum"`;
  const orNull = (column: string, expression: string) =>
    has(column) ? expression : 'NULL';
  const qualifying = buildQualifyingCalendarEventCondition(schema, columns);

  const organizerMemberId = `(SELECT p."workspaceMemberId" FROM "${schema}"."calendarEventParticipant" p
      WHERE p."calendarEventId" = e."id" AND p."isOrganizer" AND p."workspaceMemberId" IS NOT NULL
      AND p."deletedAt" IS NULL LIMIT 1)`;
  // Synced events fall back to the owner of the calendar they came from
  const calendarOwnerMemberId = `(SELECT wm."id" FROM "${schema}"."calendarChannelEventAssociation" assoc
      JOIN "core"."calendarChannel" channel ON channel."id" = assoc."calendarChannelId"
      JOIN "core"."connectedAccount" account ON account."id" = channel."connectedAccountId"
      JOIN "core"."userWorkspace" uw ON uw."id" = account."userWorkspaceId"
      JOIN "${schema}"."workspaceMember" wm ON wm."userId" = uw."userId" AND wm."deletedAt" IS NULL
      WHERE assoc."calendarEventId" = e."id" AND assoc."deletedAt" IS NULL LIMIT 1)`;
  const hostId = `coalesce(${orNull('assignedToId', 'e."assignedToId"')}, ${organizerMemberId}, e."createdByWorkspaceMemberId", ${calendarOwnerMemberId})`;

  const source = has('meetingSource')
    ? `(CASE
        WHEN ${orNull('hubspotId', 'e."hubspotId"')} IS NOT NULL OR e."meetingSource"::text = 'IMPORT' THEN 'HUBSPOT_IMPORT'
        WHEN e."meetingSource"::text = 'CALENDAR_SYNC' THEN 'CALENDAR_SYNC'
        WHEN e."meetingSource" IS NULL THEN NULL
        ELSE 'LOGGED_MANUALLY'
      END)::${enumOf('source')}`
    : `(CASE WHEN ${orNull('hubspotId', 'e."hubspotId"')} IS NOT NULL THEN 'HUBSPOT_IMPORT' END)::${enumOf('source')}`;

  const transcriptUrl = orNull(
    'transcriptPrimaryLinkUrl',
    'e."transcriptPrimaryLinkUrl"',
  );
  const transcriptStatus = `(CASE
      WHEN coalesce(${transcriptUrl}, '') <> '' THEN 'READY'
      WHEN ${orNull('hubspotId', 'e."hubspotId"')} IS NOT NULL THEN 'NOT_AVAILABLE'
      WHEN e."endsAt" > now() AND coalesce(e."conferenceLinkPrimaryLinkUrl", '') <> '' THEN 'WAITING'
      ELSE 'NOT_RECORDED'
    END)::${enumOf('transcriptStatus')}`;

  const insertMeetings = `INSERT INTO "${schema}"."meeting" (
      "id", "createdAt", "updatedAt", "position",
      "createdBySource", "createdByWorkspaceMemberId", "createdByName", "createdByContext",
      "updatedBySource", "updatedByWorkspaceMemberId", "updatedByName", "updatedByContext",
      "title", "startsAt", "endsAt", "location",
      "meetLinkPrimaryLinkUrl", "meetLinkPrimaryLinkLabel", "meetLinkSecondaryLinks",
      "attendeeDescriptionMarkdown", "attendeeDescriptionBlocknote",
      "internalNoteMarkdown", "internalNoteBlocknote",
      "aiSummaryMarkdown", "aiSummaryBlocknote",
      "recordingUrlPrimaryLinkUrl", "recordingUrlPrimaryLinkLabel", "recordingUrlSecondaryLinks",
      "transcriptDocUrlPrimaryLinkUrl", "transcriptDocUrlPrimaryLinkLabel", "transcriptDocUrlSecondaryLinks",
      "googleICalUid", "hostId", "assignedToId",
      "meetingType", "meetingOutcome", "locationType", "source", "transcriptStatus",
      "hubspotId", "hubspotHasTranscript", "recordSource"
    )
    SELECT
      e."id", e."createdAt", e."updatedAt", e."position",
      e."createdBySource"::text::${enumOf('createdBySource')}, e."createdByWorkspaceMemberId", e."createdByName", e."createdByContext",
      e."updatedBySource"::text::${enumOf('updatedBySource')}, e."updatedByWorkspaceMemberId", e."updatedByName", e."updatedByContext",
      e."title", e."startsAt", e."endsAt", e."location",
      e."conferenceLinkPrimaryLinkUrl", e."conferenceLinkPrimaryLinkLabel", e."conferenceLinkSecondaryLinks",
      nullif(e."description", ''), NULL,
      ${orNull('internalMeetingNotesMarkdown', 'e."internalMeetingNotesMarkdown"')}, ${orNull('internalMeetingNotesBlocknote', 'e."internalMeetingNotesBlocknote"')},
      ${orNull('meetingSummaryMarkdown', 'e."meetingSummaryMarkdown"')}, ${orNull('meetingSummaryBlocknote', 'e."meetingSummaryBlocknote"')},
      ${orNull('recordedVideoPrimaryLinkUrl', 'e."recordedVideoPrimaryLinkUrl"')}, ${orNull('recordedVideoPrimaryLinkLabel', 'e."recordedVideoPrimaryLinkLabel"')}, ${orNull('recordedVideoSecondaryLinks', 'e."recordedVideoSecondaryLinks"')},
      ${transcriptUrl}, ${orNull('transcriptPrimaryLinkLabel', 'e."transcriptPrimaryLinkLabel"')}, ${orNull('transcriptSecondaryLinks', 'e."transcriptSecondaryLinks"')},
      e."iCalUid", ${hostId}, ${hostId},
      ${orNull('meetingType', `e."meetingType"::text::${enumOf('meetingType')}`)},
      ${orNull('meetingOutcome', `e."meetingOutcome"::text::${enumOf('meetingOutcome')}`)},
      ${orNull('locationType', `e."locationType"::text::${enumOf('locationType')}`)},
      ${source}, ${transcriptStatus},
      ${orNull('hubspotId', 'e."hubspotId"')}, ${orNull('hubspotHasTranscript', 'e."hubspotHasTranscript"')},
      ${orNull('recordSource', `e."recordSource"::text::${enumOf('recordSource')}`)}
    FROM "${schema}"."calendarEvent" e
    WHERE ${qualifying}
      AND NOT EXISTS (SELECT 1 FROM "${schema}"."meeting" m WHERE m."id" = e."id")
    RETURNING "id"`;

  const insertAttendees = `INSERT INTO "${schema}"."meetingAttendee" (
      "meetingId", "email", "displayName", "personId", "workspaceMemberId", "responseStatus", "isOrganizer", "position"
    )
    SELECT p."calendarEventId", p."handle", p."displayName", p."personId", p."workspaceMemberId",
      p."responseStatus"::text::"${schema}"."meetingAttendee_responseStatus_enum", coalesce(p."isOrganizer", false), p."position"
    FROM "${schema}"."calendarEventParticipant" p
    JOIN "${schema}"."meeting" m ON m."id" = p."calendarEventId"
    WHERE p."deletedAt" IS NULL
      AND NOT EXISTS (SELECT 1 FROM "${schema}"."meetingAttendee" a
        WHERE a."meetingId" = p."calendarEventId" AND a."email" IS NOT DISTINCT FROM p."handle" AND a."deletedAt" IS NULL)
    RETURNING "id"`;

  // Existing links, plus every matched contact and that contact's company
  const insertTargets = `WITH links AS (
      SELECT t."calendarEventId" AS "meetingId", t."targetPersonId" AS "personId", t."targetCompanyId" AS "companyId",
        t."targetOpportunityId" AS "opportunityId", t."targetServiceId" AS "serviceId"
      FROM "${schema}"."calendarEventTarget" t
      JOIN "${schema}"."meeting" m ON m."id" = t."calendarEventId"
      WHERE t."deletedAt" IS NULL
      UNION
      SELECT p."calendarEventId", p."personId", NULL, NULL, NULL
      FROM "${schema}"."calendarEventParticipant" p
      JOIN "${schema}"."meeting" m ON m."id" = p."calendarEventId"
      WHERE p."personId" IS NOT NULL AND p."deletedAt" IS NULL
      UNION
      SELECT p."calendarEventId", NULL, person."companyId", NULL, NULL
      FROM "${schema}"."calendarEventParticipant" p
      JOIN "${schema}"."meeting" m ON m."id" = p."calendarEventId"
      JOIN "${schema}"."person" person ON person."id" = p."personId"
      WHERE person."companyId" IS NOT NULL AND p."deletedAt" IS NULL
    )
    INSERT INTO "${schema}"."meetingTarget" ("meetingId", "targetPersonId", "targetCompanyId", "targetOpportunityId", "targetServiceId")
    SELECT DISTINCT l."meetingId", l."personId", l."companyId", l."opportunityId", l."serviceId"
    FROM links l
    WHERE coalesce(l."personId", l."companyId", l."opportunityId", l."serviceId") IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "${schema}"."meetingTarget" mt
        WHERE mt."meetingId" = l."meetingId" AND mt."deletedAt" IS NULL
          AND mt."targetPersonId" IS NOT DISTINCT FROM l."personId"
          AND mt."targetCompanyId" IS NOT DISTINCT FROM l."companyId"
          AND mt."targetOpportunityId" IS NOT DISTINCT FROM l."opportunityId"
          AND mt."targetServiceId" IS NOT DISTINCT FROM l."serviceId")
    RETURNING "id"`;

  return {
    countQualifying: `SELECT count(*) FROM "${schema}"."calendarEvent" e WHERE ${qualifying}`,
    insertMeetings,
    insertAttendees,
    insertTargets,
  };
};
