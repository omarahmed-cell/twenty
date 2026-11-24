import { buildTrimFieldHistoryQuery } from 'src/modules/timeline/utils/build-trim-field-history-query.util';

export type FieldHistoryGroup = { recordId: string; fieldName: string };

export const trimFieldHistory = async ({
  executeQuery,
  schemaName,
  targetColumnName,
  groups,
  limit,
}: {
  executeQuery: (
    sql: string,
    parameters: unknown[],
  ) => Promise<Record<string, unknown>[]>;
  schemaName: string;
  targetColumnName: string;
  groups: FieldHistoryGroup[];
  limit: number;
}): Promise<number> => {
  if (groups.length === 0) {
    return 0;
  }

  const [result] = await executeQuery(
    buildTrimFieldHistoryQuery({ schemaName, targetColumnName }),
    [
      groups.map(({ recordId }) => recordId),
      groups.map(({ fieldName }) => fieldName),
      limit,
    ],
  );

  return Number(result?.removedCount ?? 0);
};
