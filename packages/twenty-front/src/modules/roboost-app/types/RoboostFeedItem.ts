import { type RoboostActivityTypeKey } from '@/roboost-app/timeline/types/RoboostActivityTypeKey';

export type RoboostFeedKind =
  | 'email'
  | 'tracking'
  | 'note'
  | 'task'
  | 'call'
  | 'meeting'
  | 'communication'
  | 'update';

export type RoboostFeedEmail = {
  id: string;
  subject: string | null;
  bodyPreview: string | null;
  bodyMarkdown: string | null;
  bodyHtml: string | null;
  direction: string | null;
  from: string | null;
  to: string | null;
  cc: string | null;
  sentAt: string | null;
  openCount: number;
  clickCount: number;
  lastOpenedAt: string | null;
  lastClickedAt: string | null;
  loggedByName: string;
  loggedById: string | null;
};

export type RoboostFeedItem = {
  id: string;
  kind: RoboostFeedKind;
  typeKey: RoboostActivityTypeKey;
  // The activity's own record, for kinds that are stored as records (not tracking or updates)
  recordId: string | null;
  objectNameSingular: string | null;
  date: string;
  title: string;
  body: string;
  ownerId: string | null;
  ownerName: string;
  creatorId: string | null;
  isCanceled?: boolean;
  meta: string;
  status?: string | null;
  email?: RoboostFeedEmail;
};
