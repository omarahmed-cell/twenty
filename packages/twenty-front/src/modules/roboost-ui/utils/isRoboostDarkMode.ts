import { type RoboostMode } from '@/roboost-ui/types/RoboostMode';

export const isRoboostDarkMode = (mode: RoboostMode) => mode.endsWith('-dark');
