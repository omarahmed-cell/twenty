import { ROBOOST_CHECK_IMPORTED_DUPLICATES } from '@/roboost-app/merge/graphql/roboostDuplicateQueries';
import {
  ROBOOST_FINISH_IMPORT,
  ROBOOST_START_IMPORT,
} from '@/roboost-app/data-transfer/graphql/roboostDataTransferQueries';
import { countRoboostImportAssociations } from '@/roboost-app/data-transfer/utils/countRoboostImportAssociations';
import { isRoboostNewlyCreatedRecord } from '@/roboost-app/data-transfer/utils/isRoboostNewlyCreatedRecord';
import { useApolloClient } from '@apollo/client/react';
import { json2csv } from 'json-2-csv';
import { isDefined } from 'twenty-shared/utils';

type SavedRecord = { id: string; createdAt?: unknown; updatedAt?: unknown };
type Row = Record<string, unknown>;

const toErrorFile = (invalidRows: Row[]) =>
  invalidRows.length === 0
    ? null
    : json2csv(
        invalidRows.map((row) =>
          Object.fromEntries(
            Object.entries(row)
              .filter(([key]) => !key.startsWith('__'))
              .map(([key, value]) => [key, String(value ?? '')]),
          ),
        ),
      );

// Each import from the import dialog is logged for Settings > Data management; logging never blocks the import
export const useRoboostImportLog = () => {
  const client = useApolloClient();

  const startRoboostImportLog = async ({
    name,
    objectNameSingular,
  }: {
    name: string;
    objectNameSingular: string;
  }) => {
    const importId = await client
      .mutate<{ roboostStartImport: string }>({
        mutation: ROBOOST_START_IMPORT,
        variables: { name, objectNameSingular },
      })
      .then(({ data }) => data?.roboostStartImport ?? null)
      .catch(() => null);

    const send = (variables: Record<string, unknown>) =>
      isDefined(importId)
        ? client
            .mutate({
              mutation: ROBOOST_FINISH_IMPORT,
              variables: { id: importId, ...variables },
            })
            .catch(() => undefined)
        : Promise.resolve(undefined);

    return {
      finish: async ({
        savedRecords,
        createInputs,
        invalidRows,
      }: {
        savedRecords: SavedRecord[];
        createInputs: Row[];
        invalidRows: Row[];
      }) => {
        const newRecords = savedRecords.filter(isRoboostNewlyCreatedRecord);
        const newCount = newRecords.length;

        await send({
          state: invalidRows.length > 0 ? 'DONE_WITH_ERRORS' : 'DONE',
          newCount,
          updatedCount: savedRecords.length - newCount,
          newAssociations: countRoboostImportAssociations(createInputs),
          errorCount: invalidRows.length,
          errorFile: toErrorFile(invalidRows),
          recordIds: savedRecords.map(({ id }) => id),
        });

        // New records matching an existing one (extra emails and domains included) become duplicate pairs
        return newRecords.length === 0
          ? 0
          : client
              .mutate<{ roboostCheckImportedDuplicates: number }>({
                mutation: ROBOOST_CHECK_IMPORTED_DUPLICATES,
                variables: {
                  objectName: objectNameSingular,
                  importId,
                  recordIds: newRecords.map(({ id }) => id),
                },
              })
              .then(({ data }) => data?.roboostCheckImportedDuplicates ?? 0)
              .catch(() => 0);
      },
      fail: ({
        createInputs,
        invalidRows,
      }: {
        createInputs: Row[];
        invalidRows: Row[];
      }) =>
        send({
          state: 'FAILED',
          newCount: 0,
          updatedCount: 0,
          newAssociations: 0,
          errorCount: createInputs.length + invalidRows.length,
          errorFile: toErrorFile([...invalidRows, ...createInputs]),
          recordIds: [],
        }),
    };
  };

  return { startRoboostImportLog };
};
