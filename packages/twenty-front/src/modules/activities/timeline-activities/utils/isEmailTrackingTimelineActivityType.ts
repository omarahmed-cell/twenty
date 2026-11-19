import { EMAIL_TRACKING_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS } from '@/activities/timeline-activities/constants/EmailTrackingTimelineActivityTypeUniversalIdentifiers';

const EMAIL_TRACKING_UNIVERSAL_IDENTIFIERS: string[] = Object.values(
  EMAIL_TRACKING_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS,
);

export const isEmailTrackingTimelineActivityType = (
  universalIdentifier: string | null | undefined,
) => EMAIL_TRACKING_UNIVERSAL_IDENTIFIERS.includes(universalIdentifier ?? '');
