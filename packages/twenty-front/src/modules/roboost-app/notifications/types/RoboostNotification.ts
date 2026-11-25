export type RoboostNotificationType =
  | 'assign'
  | 'export'
  | 'import'
  | 'task'
  | 'merge';

export type RoboostNotificationTab = 'UNREAD' | 'ALL' | 'TRASH';

export type RoboostNotificationRelatedRecord = {
  id: string;
  name: string;
  objectNameSingular: string;
};

export type RoboostNotification = {
  id: string;
  type: RoboostNotificationType;
  subtype: string;
  title: string;
  body: string;
  actorName: string | null;
  targetObjectNameSingular: string | null;
  targetRecordId: string | null;
  targetPath: string | null;
  downloadUrl: string | null;
  actionLabel: string | null;
  relatedRecords: RoboostNotificationRelatedRecord[];
  relatedCount: number;
  isRead: boolean;
  isTrashed: boolean;
  createdAt: string;
};
