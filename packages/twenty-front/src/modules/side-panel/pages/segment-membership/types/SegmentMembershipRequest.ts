import { type RecordGqlOperationFilter } from 'twenty-shared/types';

import { type SegmentMembershipOperation } from '@/side-panel/pages/segment-membership/types/SegmentMembershipOperation';

export type SegmentMembershipRequest = {
  operation: SegmentMembershipOperation;
  objectNameSingular: string;
  recordFilter: RecordGqlOperationFilter;
};
