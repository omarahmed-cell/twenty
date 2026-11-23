import { doTimelineActivityDiffsOverlap } from 'src/modules/timeline/utils/do-timeline-activity-diffs-overlap.util';

describe('doTimelineActivityDiffsOverlap', () => {
  it('flags a second change to the same field', () => {
    expect(
      doTimelineActivityDiffsOverlap(
        { diff: { stage: { before: 'A', after: 'B' } } },
        { diff: { stage: { before: 'B', after: 'C' } } },
      ),
    ).toBe(true);
  });

  it('lets changes to different fields share a row', () => {
    expect(
      doTimelineActivityDiffsOverlap(
        { diff: { stage: { before: 'A', after: 'B' } } },
        { diff: { city: { before: null, after: 'Cairo' } } },
      ),
    ).toBe(false);
    expect(doTimelineActivityDiffsOverlap(null, { diff: {} })).toBe(false);
  });
});
