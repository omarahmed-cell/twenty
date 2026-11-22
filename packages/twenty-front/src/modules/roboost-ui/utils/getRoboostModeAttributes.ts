import { type RoboostMode } from '@/roboost-ui/types/RoboostMode';

// The brand drives logos, accents and frame rules; the scheme only swaps the neutral and status tokens
export const getRoboostModeAttributes = (mode: RoboostMode) => ({
  theme: mode.replace('-dark', ''),
  scheme: mode.endsWith('-dark') ? 'dark' : 'light',
});
