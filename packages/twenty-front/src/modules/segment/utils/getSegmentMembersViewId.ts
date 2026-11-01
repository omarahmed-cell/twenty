import { v5 } from 'uuid';

import { SEGMENT_MEMBERS_VIEW_ID_NAMESPACE } from '@/segment/constants/SegmentMembersViewIdNamespace';

// Derived from the object id so every segment of that object finds the same hidden view.
export const getSegmentMembersViewId = (objectMetadataId: string) =>
  v5(objectMetadataId, SEGMENT_MEMBERS_VIEW_ID_NAMESPACE);
