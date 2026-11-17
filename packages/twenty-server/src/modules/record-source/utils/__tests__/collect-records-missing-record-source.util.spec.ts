import { type ObjectRecordCreateEvent } from 'twenty-shared/database-events';

import { collectRecordsMissingRecordSource } from 'src/modules/record-source/utils/collect-records-missing-record-source.util';

const buildCreateEvent = (
  recordId: string,
  after: Record<string, unknown>,
): ObjectRecordCreateEvent<Record<string, unknown>> =>
  ({ recordId, properties: { after } }) as ObjectRecordCreateEvent<
    Record<string, unknown>
  >;

describe('collectRecordsMissingRecordSource', () => {
  it('keeps only the records created without a record source', () => {
    expect(
      collectRecordsMissingRecordSource([
        buildCreateEvent('synced-email', { recordSource: null }),
        buildCreateEvent('api-company', { recordSource: 'API' }),
        buildCreateEvent('synced-meeting', {}),
      ]),
    ).toEqual(['synced-email', 'synced-meeting']);
  });
});
