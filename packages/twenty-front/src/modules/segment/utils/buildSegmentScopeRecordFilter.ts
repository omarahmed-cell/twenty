import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { ViewFilterOperand } from 'twenty-shared/types';
import { getSegmentMembershipOptionValue } from 'twenty-shared/utils';

export const buildSegmentScopeRecordFilter = ({
  segmentId,
  segmentName,
  segmentMembershipFieldMetadataItem,
}: {
  segmentId: string;
  segmentName: string;
  segmentMembershipFieldMetadataItem: FieldMetadataItem;
}): RecordFilter => ({
  id: `segment-scope-${segmentId}`,
  fieldMetadataId: segmentMembershipFieldMetadataItem.id,
  value: JSON.stringify([getSegmentMembershipOptionValue(segmentId)]),
  displayValue: segmentName,
  type: 'MULTI_SELECT',
  operand: ViewFilterOperand.CONTAINS,
  label: segmentMembershipFieldMetadataItem.label,
});
