import { computeSegmentPullDiff } from 'src/modules/segment/utils/compute-segment-pull-diff.util';

describe('computeSegmentPullDiff', () => {
  it('adds new associations and removes stale members', () => {
    expect(
      computeSegmentPullDiff({
        associatedRecordIds: ['a', 'b', 'c'],
        currentRecordIds: ['b', 'd'],
      }),
    ).toEqual({ recordIdsToAdd: ['a', 'c'], recordIdsToRemove: ['d'] });
  });

  it('adds a record linked to several source records once', () => {
    expect(
      computeSegmentPullDiff({
        associatedRecordIds: ['a', 'a', 'b'],
        currentRecordIds: [],
      }),
    ).toEqual({ recordIdsToAdd: ['a', 'b'], recordIdsToRemove: [] });
  });

  it('changes nothing when the target already matches', () => {
    expect(
      computeSegmentPullDiff({
        associatedRecordIds: ['a', 'b'],
        currentRecordIds: ['b', 'a'],
      }),
    ).toEqual({ recordIdsToAdd: [], recordIdsToRemove: [] });
  });
});
