export type RoboostFeedKind =
  | 'email'
  | 'tracking'
  | 'note'
  | 'task'
  | 'call'
  | 'meeting'
  | 'communication';

export type RoboostFeedEmail = {
  id: string;
  subject: string | null;
  bodyPreview: string | null;
  bodyMarkdown: string | null;
  direction: string | null;
  from: string | null;
  to: string | null;
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
