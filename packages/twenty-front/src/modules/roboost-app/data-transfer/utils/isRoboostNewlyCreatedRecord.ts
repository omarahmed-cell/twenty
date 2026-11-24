import { isDefined } from 'twenty-shared/utils';

// An upsert returns both new and matched records; a new one was created and last updated together
const SAME_WRITE_MS = 2000;

export const isRoboostNewlyCreatedRecord = (record: {
  createdAt?: unknown;
  updatedAt?: unknown;
}) => {
  if (!isDefined(record.createdAt) || !isDefined(record.updatedAt)) {
    return true;
  }

  return (
    Math.abs(
      new Date(String(record.updatedAt)).getTime() -
        new Date(String(record.createdAt)).getTime(),
    ) < SAME_WRITE_MS
  );
};
