export type RoboostNotificationType = 'assign' | 'export' | 'import' | 'task';

export type RoboostNotificationSubtype =
  | 'assigned_single'
  | 'assigned_bulk'
  | 'task_assigned'
  | 'task_reminder'
  | 'task_overdue'
  | 'task_overdue_digest'
  | 'export_ready'
  | 'export_large'
  | 'import_done'
  | 'import_failed';

export type RoboostNotificationRelatedRecord = {
  id: string;
  name: string;
  objectNameSingular: string;
};

// Where a click goes: a record page, an in-app path (a list with filters, a settings page) or a file
export type RoboostNotificationTarget = {
  objectNameSingular?: string | null;
  recordId?: string | null;
  path?: string | null;
  downloadUrl?: string | null;
  actionLabel?: string | null;
};

export type RoboostNotificationInput = {
  workspaceId: string;
  recipientWorkspaceMemberId: string;
  type: RoboostNotificationType;
  subtype: RoboostNotificationSubtype;
  title: string;
  body: string;
  actorWorkspaceMemberId?: string | null;
  actorName?: string | null;
  target: RoboostNotificationTarget;
  relatedRecords?: RoboostNotificationRelatedRecord[];
  relatedCount?: number;
  // Re-sending with the same key updates the existing unread notification instead of adding one
  groupKey?: string | null;
  // Only an unread notification with the same key created this recently is updated
  groupWindowSeconds?: number | null;
};

export type RoboostNotificationRow = {
  id: string;
  type: RoboostNotificationType;
  subtype: RoboostNotificationSubtype;
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
  readAt: string | null;
  isTrashed: boolean;
  trashedAt: string | null;
  createdAt: string;
};

export type RoboostNotificationTab = 'UNREAD' | 'ALL' | 'TRASH';
