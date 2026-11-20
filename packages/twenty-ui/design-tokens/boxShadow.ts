import { ROBOOST_TOKENS } from './roboost';
import { token } from './token';

export const BOX_SHADOW_TOKENS = {
  color: token({
    light: 'color(display-p3 0 0 0 / 0.039)',
    dark: 'rgba(0, 0, 0, 0.6)',
  }),
  light: token({
    light: ROBOOST_TOKENS.shadow.sm,
    dark: '0px 2px 4px 0px rgba(0, 0, 0, 0.04), 0px 0px 4px 0px rgba(0, 0, 0, 0.08)',
  }),
  sidebar: token({
    light: '-4px 4px 4px 0px rgba(0, 0, 0, 0.005)',
    dark: '-4px 4px 4px 0px rgba(0, 0, 0, 0.03)',
  }),
  bottomPanel: token({
    light: '0px 0px 20px 0px color(display-p3 0 0 0 / 0.1)',
    dark: '0px 0px 20px 0px rgba(0, 0, 0, 0.1)',
  }),
  strong: token({
    light: ROBOOST_TOKENS.shadow.md,
    dark: '2px 4px 16px 0px rgba(0, 0, 0, 0.16), 0px 2px 4px 0px rgba(0, 0, 0, 0.08)',
  }),
  underline: token({
    light: '0px 1px 0px 0px color(display-p3 0 0 0 / 0.361)',
    dark: '0px 1px 0px 0px rgba(0, 0, 0, 0.32)',
  }),
  superHeavy: token({
    light: ROBOOST_TOKENS.shadow.lg,
    dark: '2px 4px 16px 0px rgba(0, 0, 0, 0.12), 0px 2px 4px 0px rgba(0, 0, 0, 0.04)',
  }),
  focus: token(ROBOOST_TOKENS.shadow.focus),
  xs: token(ROBOOST_TOKENS.shadow.xs),
};
