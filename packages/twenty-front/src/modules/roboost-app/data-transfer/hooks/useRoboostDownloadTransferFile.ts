import {
  ROBOOST_EXPORT_FILE,
  ROBOOST_IMPORT_ERROR_FILE,
} from '@/roboost-app/data-transfer/graphql/roboostDataTransferQueries';
import { useApolloClient } from '@apollo/client/react';
import { saveAs } from 'file-saver';
import { isDefined } from 'twenty-shared/utils';

type TransferFile = { fileName: string; content: string | null } | null;

// Export files and import error files are kept server-side; this saves one to disk
export const useRoboostDownloadTransferFile = () => {
  const client = useApolloClient();

  const save = (file: TransferFile) => {
    if (!isDefined(file) || !isDefined(file.content)) {
      return false;
    }
    saveAs(
      new Blob([file.content], { type: 'text/csv;charset=utf-8' }),
      file.fileName,
    );

    return true;
  };

  const downloadExport = async (id: string) => {
    const { data } = await client.query<{ roboostExportFile: TransferFile }>({
      query: ROBOOST_EXPORT_FILE,
      variables: { id },
      fetchPolicy: 'network-only',
    });

    return save(data?.roboostExportFile ?? null);
  };

  const downloadImportErrors = async (id: string) => {
    const { data } = await client.query<{
      roboostImportErrorFile: TransferFile;
    }>({
      query: ROBOOST_IMPORT_ERROR_FILE,
      variables: { id },
      fetchPolicy: 'network-only',
    });

    return save(data?.roboostImportErrorFile ?? null);
  };

  // Notifications carry "roboost-export:<id>" so the bell can download without a public URL
  const downloadFromNotification = (downloadUrl: string) => {
    const [scheme, id] = downloadUrl.split(':');

    return scheme === 'roboost-export' && isDefined(id)
      ? downloadExport(id)
      : Promise.resolve(false);
  };

  return { downloadExport, downloadImportErrors, downloadFromNotification };
};
