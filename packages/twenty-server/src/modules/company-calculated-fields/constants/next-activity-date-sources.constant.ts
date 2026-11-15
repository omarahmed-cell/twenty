export type NextActivityDateSource = {
  activityType: string;
  activityTableName: string;
  targetTableName: string;
  activityIdColumnName: string;
  dateColumnName: string;
  // SQL over the activity row aliased "activity"
  statusExpression: string;
};

export const NEXT_ACTIVITY_DATE_SOURCES: NextActivityDateSource[] = [
  {
    activityType: 'calendarEvent',
    activityTableName: 'calendarEvent',
    targetTableName: 'calendarEventTarget',
    activityIdColumnName: 'calendarEventId',
    dateColumnName: 'startsAt',
    statusExpression: 'NULL::text',
  },
  {
    activityType: 'task',
    activityTableName: 'task',
    targetTableName: 'taskTarget',
    activityIdColumnName: 'taskId',
    dateColumnName: 'dueAt',
    statusExpression: 'activity."status"::text',
  },
];

// Selects one candidate row per upcoming activity; the date rules themselves live in pickNextActivityDate
export const buildNextActivityCandidateSelects = ({
  schema,
  ownerSelect,
  from,
}: {
  schema: string;
  ownerSelect: (source: NextActivityDateSource) => string;
  from: (source: NextActivityDateSource) => string;
}) =>
  NEXT_ACTIVITY_DATE_SOURCES.map(
    (source) => `
      SELECT ${ownerSelect(source)}, '${source.activityType}' AS "activityType",
        activity."${source.dateColumnName}" AS "date", ${source.statusExpression} AS "status"
      FROM ${from(source)}
      JOIN ${schema}."${source.activityTableName}" activity
        ON activity."id" = links."activityId" AND activity."deletedAt" IS NULL
      WHERE activity."${source.dateColumnName}" > now()`,
  ).join('\n      UNION ALL');
