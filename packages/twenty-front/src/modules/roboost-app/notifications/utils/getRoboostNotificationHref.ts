import { type RoboostNotification } from '@/roboost-app/notifications/types/RoboostNotification';
import { isNonEmptyString } from '@sniptt/guards';

// Where a click on the notification leads: its in-app path, else the target record's page
export const getRoboostNotificationHref = (
  notification: Pick<
    RoboostNotification,
    'targetPath' | 'targetObjectNameSingular' | 'targetRecordId'
  >,
): string | null => {
  if (isNonEmptyString(notification.targetPath)) {
    return notification.targetPath;
  }
  if (
    isNonEmptyString(notification.targetObjectNameSingular) &&
    isNonEmptyString(notification.targetRecordId)
  ) {
    return `/object/${notification.targetObjectNameSingular}/${notification.targetRecordId}`;
  }

  return null;
};
