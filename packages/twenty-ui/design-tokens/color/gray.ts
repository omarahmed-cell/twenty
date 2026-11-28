import { ROBOOST_DARK_TOKENS, ROBOOST_TOKENS } from '../roboost';
import { token } from '../token';

const { neutrals: darkNeutrals } = ROBOOST_DARK_TOKENS;

export const GRAY_COLOR_TOKENS = {
  scale: {
    // Dark: the page is gray1 and cards gray2, matching Roboost's #191919 page and #303030 cards
    gray1: token({
      light: ROBOOST_TOKENS.neutrals.surface,
      dark: darkNeutrals.canvas,
    }),
    gray2: token({
      light: ROBOOST_TOKENS.neutrals.surfaceSunken,
      dark: darkNeutrals.surface,
    }),
    gray3: token({
      light: ROBOOST_TOKENS.neutrals.canvas,
      dark: darkNeutrals.surfaceSunken,
    }),
    gray4: token({
      light: ROBOOST_TOKENS.neutrals.surfaceHover,
      dark: darkNeutrals.surfaceHover,
    }),
    gray5: token({
      light: ROBOOST_TOKENS.neutrals.border,
      dark: darkNeutrals.border,
    }),
    gray6: token({
      light: ROBOOST_TOKENS.neutrals.borderStrong,
      dark: '#5a5a5a',
    }),
    gray7: token({
      light: '#b4bcc8',
      dark: '#6a6a6a',
    }),
    gray8: token({
      light: ROBOOST_TOKENS.neutrals.textDisabled,
      dark: darkNeutrals.textDisabled,
    }),
    gray9: token({
      light: ROBOOST_TOKENS.neutrals.textMuted,
      dark: darkNeutrals.textMuted,
    }),
    gray10: token({
      light: '#636c7c',
      dark: '#c2c2c2',
    }),
    gray11: token({
      light: ROBOOST_TOKENS.neutrals.textSecondary,
      dark: darkNeutrals.textSecondary,
    }),
    gray12: token({
      light: ROBOOST_TOKENS.neutrals.text,
      dark: darkNeutrals.text,
    }),
  },
  transparent: {
    gray1: token({
      light: 'color(display-p3 0 0 0 / 0.02)',
      dark: 'color(display-p3 1 1 1 / 0.031)',
    }),
    gray2: token({
      light: 'color(display-p3 0 0 0 / 0.039)',
      dark: 'color(display-p3 1 1 1 / 0.059)',
    }),
    gray3: token({
      light: 'color(display-p3 0 0 0 / 0.047)',
      dark: 'color(display-p3 1 1 1 / 0.047)',
    }),
    gray4: token({
      light: 'color(display-p3 0 0 0 / 0.071)',
      dark: 'color(display-p3 1 1 1 / 0.071)',
    }),
    gray5: token({
      light: 'color(display-p3 0 0 0 / 0.078)',
      dark: 'color(display-p3 1 1 1 / 0.102)',
    }),
    gray6: token({
      light: 'color(display-p3 0 0 0 / 0.114)',
      dark: 'color(display-p3 1 1 1 / 0.114)',
    }),
    gray7: token({
      light: 'color(display-p3 0 0 0 / 0.161)',
      dark: 'color(display-p3 1 1 1 / 0.141)',
    }),
    gray8: token({
      light: 'color(display-p3 0 0 0 / 0.22)',
      dark: 'color(display-p3 1 1 1 / 0.22)',
    }),
    gray9: token({
      light: 'color(display-p3 0 0 0 / 0.361)',
      dark: 'color(display-p3 1 1 1 / 0.427)',
    }),
    gray10: token({
      light: 'color(display-p3 0 0 0 / 0.478)',
      dark: 'color(display-p3 1 1 1 / 0.478)',
    }),
    gray11: token({
      light: 'color(display-p3 0 0 0 / 0.722)',
      dark: 'color(display-p3 1 1 1 / 0.565)',
    }),
    gray12: token({
      light: 'color(display-p3 0 0 0 / 0.91)',
      dark: 'color(display-p3 1 1 1 / 0.91)',
    }),
  },
};
