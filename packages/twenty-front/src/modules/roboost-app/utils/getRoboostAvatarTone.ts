import { type RoboostAvatarTone } from '@/roboost-ui/types/RoboostAvatarTone';

const TONES: (RoboostAvatarTone | undefined)[] = [
  'accent',
  undefined,
  'info',
  'accent',
  'success',
  undefined,
];

// Stable per name so a company keeps its colour across pages
export const getRoboostAvatarTone = (name: string) => {
  let hash = 0;

  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return TONES[hash % TONES.length];
};
