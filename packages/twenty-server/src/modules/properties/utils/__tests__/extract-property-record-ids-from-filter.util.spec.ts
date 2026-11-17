import { extractPropertyRecordIdsFromFilter } from 'src/modules/properties/utils/extract-property-record-ids-from-filter.util';

describe('extractPropertyRecordIdsFromFilter', () => {
  it('reads ids from the GraphQL and the REST filter shapes', () => {
    expect(
      extractPropertyRecordIdsFromFilter({ id: { in: ['a', 'b'] } }),
    ).toEqual(['a', 'b']);
    expect(
      extractPropertyRecordIdsFromFilter({ and: [{ id: { in: ['a', 'b'] } }] }),
    ).toEqual(['a', 'b']);
  });

  it('gives up on any other filter', () => {
    expect(
      extractPropertyRecordIdsFromFilter({
        and: [{ name: { eq: 'x' } }, { id: { eq: 'a' } }],
      }),
    ).toBeUndefined();
    expect(extractPropertyRecordIdsFromFilter(undefined)).toBeUndefined();
  });
});
