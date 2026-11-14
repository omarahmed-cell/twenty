export type CompanyActivityDateSource = {
  activityType: string;
  activityTableName: string;
  targetTableName: string;
  activityIdColumnName: string;
  // SQL over the activity row aliased "activity"; {schema} is replaced by the workspace schema
  dateExpression: string;
  countsOnlyOncePast?: boolean;
};

// Calls and communications have no date of their own; createdAt carries it (the HubSpot loader backfills it)
export const COMPANY_ACTIVITY_DATE_SOURCES: CompanyActivityDateSource[] = [
  {
    activityType: 'call',
    activityTableName: 'call',
    targetTableName: 'callTarget',
    activityIdColumnName: 'callId',
    dateExpression: 'activity."createdAt"',
  },
  {
    activityType: 'calendarEvent',
    activityTableName: 'calendarEvent',
    targetTableName: 'calendarEventTarget',
    activityIdColumnName: 'calendarEventId',
    dateExpression:
      'CASE WHEN activity."startsAt" <= now() THEN activity."startsAt" END',
    countsOnlyOncePast: true,
  },
  {
    activityType: 'note',
    activityTableName: 'note',
    targetTableName: 'noteTarget',
    activityIdColumnName: 'noteId',
    dateExpression: 'activity."createdAt"',
  },
  {
    activityType: 'email',
    activityTableName: 'email',
    targetTableName: 'emailTarget',
    activityIdColumnName: 'emailId',
    dateExpression: 'activity."sentAt"',
  },
  {
    activityType: 'communication',
    activityTableName: 'communication',
    targetTableName: 'communicationTarget',
    activityIdColumnName: 'communicationId',
    dateExpression: 'activity."createdAt"',
  },
  {
    // A task has no completion field, so the time it was marked DONE comes from its timeline
    activityType: 'task',
    activityTableName: 'task',
    targetTableName: 'taskTarget',
    activityIdColumnName: 'taskId',
    dateExpression: `GREATEST(activity."createdAt", CASE WHEN activity."status"::text = 'DONE' THEN (
      SELECT max(timeline."happensAt") FROM {schema}."timelineActivity" timeline
      WHERE timeline."targetTaskId" = activity."id"
        AND timeline."properties"->'diff'->'status'->>'after' = 'DONE'
    ) END)`,
  },
];
