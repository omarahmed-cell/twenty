import { type RoboostMode } from '@/roboost-ui/types/RoboostMode';

// The brand drives logos, accents and frame rules; the scheme only swaps the neutral and status tokens
export const getRoboostModeAttributes = (mode: RoboostMode) => ({
  'data-theme': mode.replace('-dark', ''),
  'data-scheme': mode.endsWith('-dark') ? 'dark' : 'light',
});
