import { t } from '@lingui/core/macro';

import { EMAIL_TRACKING_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS } from '@/activities/timeline-activities/constants/EmailTrackingTimelineActivityTypeUniversalIdentifiers';

export const getEmailTrackingEventLabel = (
  universalIdentifier: string | null | undefined,
): string | undefined => {
  switch (universalIdentifier) {
    case EMAIL_TRACKING_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS.emailOpened:
      return t`opened`;
    case EMAIL_TRACKING_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS.emailLinkClicked:
      return t`clicked a link in`;
    case EMAIL_TRACKING_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS.emailReplied:
      return t`replied to`;
    default:
      return undefined;
  }
};
