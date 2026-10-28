import { computeSegmentMembershipValuesByRecordId } from 'src/modules/segment/utils/compute-segment-membership-values-by-record-id.util';

const ENTERPRISE_SEGMENT_ID = '3c21e664-ff5f-477b-b5cc-520238ed6576';
const TRIAL_SEGMENT_ID = '0b0f8a5e-6f4f-4f3e-9a51-1c6b3d2a4e01';
const DELETED_SEGMENT_ID = '1c1f8a5e-6f4f-4f3e-9a51-1c6b3d2a4e02';

describe('computeSegmentMembershipValuesByRecordId', () => {
  it('lists every live segment a record belongs to and empties records with none', () => {
    const valuesByRecordId = computeSegmentMembershipValuesByRecordId({
      recordIds: ['acme', 'globex', 'initech'],
      members: [
        { recordId: 'acme', segmentId: TRIAL_SEGMENT_ID },
        { recordId: 'acme', segmentId: ENTERPRISE_SEGMENT_ID },
        { recordId: 'globex', segmentId: DELETED_SEGMENT_ID },
        { recordId: 'unrelated', segmentId: ENTERPRISE_SEGMENT_ID },
      ],
      activeSegmentIds: new Set([ENTERPRISE_SEGMENT_ID, TRIAL_SEGMENT_ID]),
    });

    expect(Object.fromEntries(valuesByRecordId)).toEqual({
      acme: [
        'SEGMENT_0B0F8A5E6F4F4F3E9A511C6B3D2A4E01',
        'SEGMENT_3C21E664FF5F477BB5CC520238ED6576',
      ],
      globex: [],
      initech: [],
    });
  });
});
