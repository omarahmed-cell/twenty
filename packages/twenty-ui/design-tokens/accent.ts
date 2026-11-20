import { ROBOOST_TOKENS } from './roboost';
import { token } from './token';

const accent = (step: keyof typeof ROBOOST_TOKENS.accent) =>
  token(ROBOOST_TOKENS.accent[step]);

export const ACCENT_TOKENS = {
  primary: accent('accent5'),
  secondary: accent('accent5'),
  tertiary: accent('accent3'),
  quaternary: accent('accent2'),
  accent3570: accent('accent8'),
  accent4060: accent('accent8'),
  accent1: accent('accent1'),
  accent2: accent('accent2'),
  accent3: accent('accent3'),
  accent4: accent('accent4'),
  accent5: accent('accent5'),
  accent6: accent('accent6'),
  accent7: accent('accent7'),
  accent8: accent('accent8'),
  accent9: accent('accent9'),
  accent10: accent('accent10'),
  accent11: accent('accent11'),
  accent12: accent('accent12'),
};
