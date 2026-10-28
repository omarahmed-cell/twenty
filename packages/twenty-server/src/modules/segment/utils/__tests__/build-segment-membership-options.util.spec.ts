import { buildSegmentMembershipOptions } from 'src/modules/segment/utils/build-segment-membership-options.util';

describe('buildSegmentMembershipOptions', () => {
  it('keys each option by segment id so a rename only changes the label', () => {
    const [option] = buildSegmentMembershipOptions([
      { id: '3c21e664-ff5f-477b-b5cc-520238ed6576', name: 'Enterprise' },
    ]);
    const [renamedOption] = buildSegmentMembershipOptions([
      { id: '3c21e664-ff5f-477b-b5cc-520238ed6576', name: 'Enterprise EMEA' },
    ]);

    expect(option).toEqual({
      id: '3c21e664-ff5f-477b-b5cc-520238ed6576',
      value: 'SEGMENT_3C21E664FF5F477BB5CC520238ED6576',
      label: 'Enterprise',
      position: 0,
      color: renamedOption.color,
    });
    expect(renamedOption.value).toBe(option.value);
    expect(renamedOption.label).toBe('Enterprise EMEA');
  });

  it('turns names into valid option labels', () => {
    const options = buildSegmentMembershipOptions([
      { id: '0b0f8a5e-6f4f-4f3e-9a51-1c6b3d2a4e01', name: 'Leads, hot' },
      { id: '1c1f8a5e-6f4f-4f3e-9a51-1c6b3d2a4e02', name: '   ' },
      { id: '2d2f8a5e-6f4f-4f3e-9a51-1c6b3d2a4e03', name: 'x'.repeat(80) },
    ]);

    expect(options.map(({ label }) => label)).toEqual([
      'Leads hot',
      'Untitled segment',
      'x'.repeat(63),
    ]);
    expect(options.map(({ position }) => position)).toEqual([0, 1, 2]);
  });
});
