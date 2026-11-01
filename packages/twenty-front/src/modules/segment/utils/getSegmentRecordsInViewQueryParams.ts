import { SEGMENT_MEMBERSHIP_FIELD_NAME } from '@/segment/constants/SegmentMembershipFieldName';
import { ViewFilterOperand } from 'twenty-shared/types';
import { getSegmentMembershipOptionValue } from 'twenty-shared/utils';

export const getSegmentRecordsInViewQueryParams = ({
  segmentId,
  segmentName,
}: {
  segmentId: string;
  segmentName: string;
}) => ({
  filter: {
    [SEGMENT_MEMBERSHIP_FIELD_NAME]: {
      [ViewFilterOperand.CONTAINS]: [
        getSegmentMembershipOptionValue(segmentId),
      ],
    },
  },
  filterDisplayValue: {
    [SEGMENT_MEMBERSHIP_FIELD_NAME]: {
      [ViewFilterOperand.CONTAINS]: segmentName,
    },
  },
});
