import { isPlainObject } from 'twenty-shared/utils';

import { SERVER_WRITTEN_MEETING_FIELD_NAMES } from 'src/modules/meeting-fields/constants/server-written-meeting-field-names.constant';

// Meeting source and the transcript flags come from the server or the loader, never from a request
export const findServerWrittenMeetingFieldNames = (data: unknown): string[] => {
  const records = (Array.isArray(data) ? data : [data]).filter(isPlainObject);

  return SERVER_WRITTEN_MEETING_FIELD_NAMES.filter((fieldName) =>
    records.some((record) => fieldName in record),
  );
};
