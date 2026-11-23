import { type RoboostFeedKind } from '@/roboost-app/types/RoboostFeedItem';

export const ROBOOST_ACTIVITY_OBJECT_BY_KIND: Partial<
  Record<RoboostFeedKind, string>
> = {
  note: 'note',
  call: 'call',
  communication: 'communication',
  task: 'task',
  meeting: 'meeting',
  email: 'email',
};
