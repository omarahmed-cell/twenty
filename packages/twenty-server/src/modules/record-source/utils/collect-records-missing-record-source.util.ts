import { type ObjectRecordCreateEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

export const collectRecordsMissingRecordSource = (
  events: ObjectRecordCreateEvent<Record<string, unknown>>[],
): string[] =>
  events
    .filter((event) => !isDefined(event.properties.after?.recordSource))
    .map((event) => event.recordId)
    .filter(isDefined);
