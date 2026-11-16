import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

export type MeetingSourceAssignment = {
  recordId: string;
  meetingSource: string;
};

// Mirrors computeHasMeetingTranscript so one statement can refresh many meetings
const HAS_MEETING_TRANSCRIPT_SQL = `(btrim(coalesce("transcriptPrimaryLinkUrl", '')) <> '' OR coalesce("hubspotHasTranscript", false))`;

const IS_CALENDAR_SYNCED_SQL = (schema: string) => `EXISTS (
  SELECT 1 FROM "${schema}"."calendarChannelEventAssociation" association
  WHERE association."calendarEventId" = event."id" AND association."deletedAt" IS NULL
)`;

// Writes go straight to SQL: these fields are server-written and must not add timeline entries
@Injectable()
export class MeetingFieldsService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async assignMeetingSources({
    workspaceId,
    assignments,
  }: {
    workspaceId: string;
    assignments: MeetingSourceAssignment[];
  }): Promise<void> {
    const schema = getWorkspaceSchemaName(workspaceId);

    for (const { recordId, meetingSource } of assignments) {
      // Set once: a meeting keeps the source it was created with
      await this.coreDataSource.query(
        `UPDATE "${schema}"."calendarEvent" SET "meetingSource" = $2
         WHERE "id" = $1 AND "meetingSource" IS NULL`,
        [recordId, meetingSource],
      );
    }
  }

  async refreshHasMeetingTranscript({
    workspaceId,
    recordIds,
  }: {
    workspaceId: string;
    recordIds?: string[];
  }): Promise<number> {
    const schema = getWorkspaceSchemaName(workspaceId);
    const [, updatedCount]: [unknown, number] = await this.coreDataSource.query(
      `UPDATE "${schema}"."calendarEvent" SET "hasMeetingTranscript" = ${HAS_MEETING_TRANSCRIPT_SQL}
       WHERE "hasMeetingTranscript" IS DISTINCT FROM ${HAS_MEETING_TRANSCRIPT_SQL}
       ${recordIds ? 'AND "id" = ANY($1::uuid[])' : ''}`,
      recordIds ? [recordIds] : [],
    );

    return updatedCount;
  }

  // A meeting linked to a synced calendar came from the sync, whatever actor its insert carried
  async backfillMeetingSources(workspaceId: string): Promise<number> {
    const schema = getWorkspaceSchemaName(workspaceId);
    const [, updatedCount]: [unknown, number] = await this.coreDataSource.query(
      `UPDATE "${schema}"."calendarEvent" AS event SET "meetingSource" = (
         CASE
           WHEN ${IS_CALENDAR_SYNCED_SQL(schema)} THEN 'CALENDAR_SYNC'
           WHEN event."createdBySource"::text = 'CALENDAR' THEN 'CALENDAR_SYNC'
           WHEN event."createdBySource"::text = 'MANUAL' THEN 'LOGGED_IN_TWENTY'
           ELSE event."createdBySource"::text
         END
       )::"${schema}"."calendarEvent_meetingSource_enum"
       WHERE event."meetingSource" IS NULL
         AND (${IS_CALENDAR_SYNCED_SQL(schema)}
           OR event."createdBySource"::text IN ('CALENDAR', 'MANUAL', 'API', 'WORKFLOW', 'IMPORT'))`,
    );

    return updatedCount;
  }
}
