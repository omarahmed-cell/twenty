import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';

type ButtonColors = {
  background: string;
  border: string;
  color: string;
  hoverBackground: string;
  hoverBorder: string;
  hoverColor: string;
  activeBackground: string;
};

export const ROBOOST_BUTTON_COLORS: Record<
  'primary' | 'secondary' | 'ghost',
  Record<'default' | 'danger', ButtonColors>
> = {
  primary: {
    default: {
      background: ROBOOST_UI_THEME.accent,
      border: ROBOOST_UI_THEME.accent,
      color: ROBOOST_UI_THEME.textOnAccent,
      hoverBackground: ROBOOST_UI_THEME.accentHover,
      hoverBorder: ROBOOST_UI_THEME.accentHover,
      hoverColor: ROBOOST_UI_THEME.textOnAccent,
      activeBackground: ROBOOST_UI_THEME.accentActive,
    },
    danger: {
      background: ROBOOST_UI_THEME.danger,
      border: ROBOOST_UI_THEME.danger,
      color: ROBOOST_UI_THEME.textOnAccent,
      hoverBackground: ROBOOST_UI_THEME.dangerText,
      hoverBorder: ROBOOST_UI_THEME.dangerText,
      hoverColor: ROBOOST_UI_THEME.textOnAccent,
      activeBackground: ROBOOST_UI_THEME.dangerText,
    },
  },
  secondary: {
    default: {
      background: ROBOOST_UI_THEME.surface,
      border: ROBOOST_UI_THEME.borderStrong,
      color: ROBOOST_UI_THEME.text,
      hoverBackground: ROBOOST_UI_THEME.surfaceHover,
      hoverBorder: ROBOOST_UI_THEME.borderStrong,
      hoverColor: ROBOOST_UI_THEME.text,
      activeBackground: ROBOOST_UI_THEME.surfaceActive,
    },
    danger: {
      background: ROBOOST_UI_THEME.surface,
      border: ROBOOST_UI_THEME.dangerBorder,
      color: ROBOOST_UI_THEME.dangerText,
      hoverBackground: ROBOOST_UI_THEME.dangerSoft,
      hoverBorder: ROBOOST_UI_THEME.dangerBorder,
      hoverColor: ROBOOST_UI_THEME.dangerText,
      activeBackground: ROBOOST_UI_THEME.dangerSoft,
    },
  },
  ghost: {
    default: {
      background: 'transparent',
      border: 'transparent',
      color: ROBOOST_UI_THEME.textSecondary,
      hoverBackground: ROBOOST_UI_THEME.surfaceHover,
      hoverBorder: 'transparent',
      hoverColor: ROBOOST_UI_THEME.text,
      activeBackground: ROBOOST_UI_THEME.surfaceActive,
    },
    danger: {
      background: 'transparent',
      border: 'transparent',
      color: ROBOOST_UI_THEME.dangerText,
      hoverBackground: ROBOOST_UI_THEME.dangerSoft,
      hoverBorder: 'transparent',
      hoverColor: ROBOOST_UI_THEME.dangerText,
      activeBackground: ROBOOST_UI_THEME.dangerSoft,
    },
  },
};
