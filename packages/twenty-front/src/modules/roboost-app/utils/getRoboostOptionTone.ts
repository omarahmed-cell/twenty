import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';

const TONE_BY_TWENTY_COLOR: Record<string, RoboostTone> = {
  green: 'success',
  turquoise: 'success',
  sky: 'info',
  blue: 'info',
  purple: 'info',
  pink: 'accent',
  red: 'danger',
  orange: 'warning',
  yellow: 'warning',
};

// Grey options fall back to the meaning of their value so statuses still read at a glance
const TONE_BY_VALUE_KEYWORD: [RegExp, RoboostTone, boolean][] = [
  [/CUSTOMER|WON|QUALIFIED_TO_BUY|PROMOTER/, 'success', true],
  [/^NEW$|^OPEN$|ATTEMPT|QUALIFYING/, 'info', true],
  [/DEALING|CONNECTED|OPPORTUNITY|CLOSING/, 'accent', false],
  [/ON_HOLD|PARTNERSHIP|POTENTIAL/, 'warning', false],
  [/LOST|BIN/, 'danger', false],
];

export const getRoboostOptionTone = ({
  value,
  color,
}: {
  value: string;
  color?: string | null;
}): { tone: RoboostTone; dot: boolean } => {
  const toneFromColor =
    color !== undefined && color !== null
      ? TONE_BY_TWENTY_COLOR[color]
      : undefined;

  if (toneFromColor !== undefined) {
    return { tone: toneFromColor, dot: true };
  }

  const keywordMatch = TONE_BY_VALUE_KEYWORD.find(([pattern]) =>
    pattern.test(value),
  );

  return keywordMatch !== undefined
    ? { tone: keywordMatch[1], dot: keywordMatch[2] }
    : { tone: 'neutral', dot: false };
};
