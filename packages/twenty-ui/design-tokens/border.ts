import { ACCENT_TOKENS } from './accent';
import { ROBOOST_TOKENS } from './roboost';
import { COLOR_TOKENS } from './color';
import { GRAY_SCALE_TOKENS } from './grayScale';
import { token } from './token';

const SM_RADIUS = token(ROBOOST_TOKENS.radius.sm);
const MD_RADIUS = token(ROBOOST_TOKENS.radius.md);

export const BORDER_TOKENS = {
  color: {
    strong: GRAY_SCALE_TOKENS.gray6,
    medium: GRAY_SCALE_TOKENS.gray5,
    light: GRAY_SCALE_TOKENS.gray4,
    secondaryInverted: GRAY_SCALE_TOKENS.gray11,
    inverted: GRAY_SCALE_TOKENS.gray12,
    danger: COLOR_TOKENS.red5,
    blue: ACCENT_TOKENS.accent5,
    transparentStrong: COLOR_TOKENS.transparent.gray4,
  },
  radius: {
    xs: token(ROBOOST_TOKENS.radius.xs),
    sm: SM_RADIUS,
    md: MD_RADIUS,
    smRound: SM_RADIUS,
    mdRound: MD_RADIUS,
    lg: token(ROBOOST_TOKENS.radius.lg),
    xl: token('20px'),
    xxl: token('40px'),
    pill: token('999px'),
    rounded: token('100%'),
  },
};
