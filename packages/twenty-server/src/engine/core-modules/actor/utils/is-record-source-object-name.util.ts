import { RECORD_SOURCE_OBJECT_NAMES } from 'twenty-shared/constants';

export type RecordSourceObjectName =
  (typeof RECORD_SOURCE_OBJECT_NAMES)[number];

export const isRecordSourceObjectName = (
  objectNameSingular: string,
): objectNameSingular is RecordSourceObjectName =>
  (RECORD_SOURCE_OBJECT_NAMES as readonly string[]).includes(
    objectNameSingular,
  );
