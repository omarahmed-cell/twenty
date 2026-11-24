// A record's own "updated" rows; after the per-field split each holds exactly one field
export const buildFieldHistoryRowCondition = (alias: string) =>
  `${alias}."linkedRecordId" IS NULL
    AND ${alias}."timelineActivityTypeSnapshot"->>'action' = 'updated'
    AND jsonb_typeof(${alias}.properties->'diff') = 'object'`;

// $1 record ids, $2 field names (pairwise), $3 changes kept per field.
// The newest kept row is flagged so the History panel can say older ones were removed.
export const buildTrimFieldHistoryQuery = ({
  schemaName,
  targetColumnName,
}: {
  schemaName: string;
  targetColumnName: string;
}) => `
  WITH "fieldGroup" AS (
    SELECT DISTINCT "recordId", "fieldName"
    FROM unnest($1::uuid[], $2::text[]) AS g("recordId", "fieldName")
  ), "ranked" AS (
    SELECT t.id, g."recordId", g."fieldName",
      row_number() OVER (
        PARTITION BY g."recordId", g."fieldName"
        ORDER BY t."happensAt" DESC, t."createdAt" DESC, t.id DESC
      ) AS "rank"
    FROM "fieldGroup" g
    JOIN "${schemaName}"."timelineActivity" t
      ON t."${targetColumnName}" = g."recordId"
      AND jsonb_exists(t.properties->'diff', g."fieldName")
      AND ${buildFieldHistoryRowCondition('t')}
  ), "removed" AS (
    DELETE FROM "${schemaName}"."timelineActivity"
    WHERE id IN (SELECT id FROM "ranked" WHERE "rank" > $3)
    RETURNING id
  ), "flagged" AS (
    UPDATE "${schemaName}"."timelineActivity" t
    SET properties = t.properties || '{"olderChangesRemoved": true}'::jsonb
    FROM "ranked" r
    WHERE t.id = r.id AND r."rank" = $3
      AND EXISTS (
        SELECT 1 FROM "ranked" o
        WHERE o."recordId" = r."recordId" AND o."fieldName" = r."fieldName" AND o."rank" > $3
      )
    RETURNING t.id
  )
  SELECT (SELECT count(*) FROM "removed")::int AS "removedCount",
    (SELECT count(*) FROM "flagged")::int AS "flaggedCount"`;
