import { ROBOOST_TOKENS } from '../roboost';
import { token } from '../token';

export const GRAY_COLOR_TOKENS = {
  scale: {
    gray1: token({
      light: ROBOOST_TOKENS.neutrals.surface,
      dark: 'color(display-p3 0.09 0.09 0.09)',
    }),
    gray2: token({
      light: ROBOOST_TOKENS.neutrals.surfaceSunken,
      dark: 'color(display-p3 0.106 0.106 0.106)',
    }),
    gray3: token({
      light: ROBOOST_TOKENS.neutrals.canvas,
      dark: 'color(display-p3 0.098 0.098 0.098)',
    }),
    gray4: token({
      light: ROBOOST_TOKENS.neutrals.surfaceHover,
      dark: 'color(display-p3 0.114 0.114 0.114)',
    }),
    gray5: token({
      light: ROBOOST_TOKENS.neutrals.border,
      dark: 'color(display-p3 0.133 0.133 0.133)',
    }),
    gray6: token({
      light: ROBOOST_TOKENS.neutrals.borderStrong,
      dark: 'color(display-p3 0.282 0.282 0.282)',
    }),
    gray7: token({
      light: '#b4bcc8',
      dark: 'color(display-p3 0.298 0.298 0.298)',
    }),
    gray8: token({
      light: ROBOOST_TOKENS.neutrals.textDisabled,
      dark: 'color(display-p3 0.4 0.4 0.4)',
    }),
    gray9: token({
      light: ROBOOST_TOKENS.neutrals.textMuted,
      dark: 'color(display-p3 0.506 0.506 0.506)',
    }),
    gray10: token({
      light: '#636c7c',
      dark: 'color(display-p3 0.482 0.482 0.482)',
    }),
    gray11: token({
      light: ROBOOST_TOKENS.neutrals.textSecondary,
      dark: 'color(display-p3 0.702 0.702 0.702)',
    }),
    gray12: token({
      light: ROBOOST_TOKENS.neutrals.text,
      dark: 'color(display-p3 0.922 0.922 0.922)',
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
