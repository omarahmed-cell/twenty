import { type ROBOOST_FILLED_ICON_PATHS } from '@/roboost-ui/constants/RoboostFilledIconPaths';
import { type ROBOOST_ICON_PATHS } from '@/roboost-ui/constants/RoboostIconPaths';

export type RoboostIconName =
  | keyof typeof ROBOOST_ICON_PATHS
  | keyof typeof ROBOOST_FILLED_ICON_PATHS
  | 'more'
  | 'more-vertical';
