import { type FieldMetadataComplexOption } from 'twenty-shared/types';
import { getSegmentMembershipOptionValue } from 'twenty-shared/utils';

import { SEGMENT_MEMBERSHIP_OPTION_COLORS } from 'src/modules/segment/constants/segment-membership-option-colors.constant';

const OPTION_LABEL_MAX_LENGTH = 63;

// Option labels cannot hold commas or exceed the identifier length
const toOptionLabel = (name: string | null) => {
  const label = (name ?? '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, OPTION_LABEL_MAX_LENGTH)
    .trim();

  return label.length > 0 ? label : 'Untitled segment';
};

// Derived from the id so colors stay put when other segments are added or removed
const toOptionColor = (segmentId: string) => {
  const hash = [...segmentId].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return SEGMENT_MEMBERSHIP_OPTION_COLORS[
    hash % SEGMENT_MEMBERSHIP_OPTION_COLORS.length
  ];
};

export const buildSegmentMembershipOptions = (
  segments: { id: string; name: string | null }[],
): FieldMetadataComplexOption[] =>
  segments.map((segment, position) => ({
    id: segment.id,
    value: getSegmentMembershipOptionValue(segment.id),
    label: toOptionLabel(segment.name),
    position,
    color: toOptionColor(segment.id),
  }));
