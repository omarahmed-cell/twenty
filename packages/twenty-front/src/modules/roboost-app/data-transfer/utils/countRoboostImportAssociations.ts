import { isNonEmptyString } from '@sniptt/guards';

// Imported relation values arrive as "<field>Id" keys; each filled one links the record to another
export const countRoboostImportAssociations = (
  rows: Record<string, unknown>[],
) =>
  rows.reduce(
    (total, row) =>
      total +
      Object.entries(row).filter(
        ([key, value]) =>
          key.endsWith('Id') && key !== 'id' && isNonEmptyString(value),
      ).length,
    0,
  );
