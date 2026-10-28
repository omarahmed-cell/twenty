import { areSegmentMembershipOptionsEqual } from 'src/modules/segment/utils/are-segment-membership-options-equal.util';
import { buildSegmentMembershipOptions } from 'src/modules/segment/utils/build-segment-membership-options.util';

describe('areSegmentMembershipOptionsEqual', () => {
  const segments = [
    { id: '3c21e664-ff5f-477b-b5cc-520238ed6576', name: 'Enterprise' },
  ];

  it('ignores colors so a manual recolor does not trigger a rewrite', () => {
    const [option] = buildSegmentMembershipOptions(segments);

    expect(
      areSegmentMembershipOptionsEqual(
        [{ ...option, color: 'gray' }],
        buildSegmentMembershipOptions(segments),
      ),
    ).toBe(true);
  });

  it('detects a rename, an added segment and a removed one', () => {
    const current = buildSegmentMembershipOptions(segments);

    expect(
      areSegmentMembershipOptionsEqual(
        current,
        buildSegmentMembershipOptions([{ ...segments[0], name: 'Renamed' }]),
      ),
    ).toBe(false);
    expect(
      areSegmentMembershipOptionsEqual(
        current,
        buildSegmentMembershipOptions([
          ...segments,
          { id: '0b0f8a5e-6f4f-4f3e-9a51-1c6b3d2a4e01', name: 'Trial' },
        ]),
      ),
    ).toBe(false);
    expect(areSegmentMembershipOptionsEqual(current, [])).toBe(false);
  });
});
