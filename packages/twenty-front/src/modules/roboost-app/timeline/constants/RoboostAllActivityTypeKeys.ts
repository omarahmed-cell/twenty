import { ROBOOST_ACTIVITY_TYPE_CATEGORIES } from '@/roboost-app/timeline/constants/RoboostActivityTypeCategories';
import { type RoboostActivityTypeKey } from '@/roboost-app/timeline/types/RoboostActivityTypeKey';

export const ROBOOST_ALL_ACTIVITY_TYPE_KEYS: RoboostActivityTypeKey[] =
  ROBOOST_ACTIVITY_TYPE_CATEGORIES.flatMap(({ types }) =>
    types.map(({ key }) => key),
  );
