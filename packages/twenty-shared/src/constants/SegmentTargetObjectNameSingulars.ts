import { type SegmentTargetObject } from '@/types/SegmentTargetObject';

export const SEGMENT_TARGET_OBJECT_NAME_SINGULARS = {
  COMPANY: 'company',
  PERSON: 'person',
  OPPORTUNITY: 'opportunity',
} as const satisfies Record<SegmentTargetObject, string>;
