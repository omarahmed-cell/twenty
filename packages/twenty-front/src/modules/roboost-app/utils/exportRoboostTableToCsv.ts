import { saveAs } from 'file-saver';
import { json2csv } from 'json-2-csv';
import { sanitizeValueForCSVExport } from 'twenty-shared/utils';

export const exportRoboostTableToCsv = ({
  headers,
  rows,
  fileName,
}: {
  headers: string[];
  rows: string[][];
  fileName: string;
}) => {
  const objects = rows.map((row) =>
    Object.fromEntries(
      headers.map((header, index) => [
        header,
        sanitizeValueForCSVExport(row[index] ?? ''),
      ]),
    ),
  );

  const csv = json2csv(objects, { keys: headers });

  saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fileName);

  return csv;
};
