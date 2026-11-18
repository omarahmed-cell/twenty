import { type TimelineActivityType } from '@/activities/timeline-activities/types/TimelineActivityType';
import { STANDARD_TIMELINE_ACTIVITY_RENDERER_UNIVERSAL_IDENTIFIERS } from 'twenty-shared/timeline';

export const isNativeEmailTimelineActivityType = (
  timelineActivityType: Pick<
    TimelineActivityType,
    'frontComponentUniversalIdentifier'
  >,
) =>
  timelineActivityType.frontComponentUniversalIdentifier ===
  STANDARD_TIMELINE_ACTIVITY_RENDERER_UNIVERSAL_IDENTIFIERS.message;
