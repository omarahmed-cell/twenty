import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { getFullName } from '@/activities/timeline-activities/utils/getFullName';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

export const getTimelineActivityAuthorFullName = (event: TimelineActivity) => {
  const fullName = isDefined(event.workspaceMember)
    ? getFullName(event.workspaceMember.name)
    : undefined;

  return isNonEmptyString(fullName) ? fullName : 'Twenty';
};
