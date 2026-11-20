import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';

export const ROBOOST_TONE_COLORS: Record<
  RoboostTone,
  { background: string; color: string; border: string; solid: string }
> = {
  neutral: {
    background: ROBOOST_UI_THEME.surfaceSunken,
    color: ROBOOST_UI_THEME.textSecondary,
    border: ROBOOST_UI_THEME.border,
    solid: ROBOOST_UI_THEME.textMuted,
  },
  accent: {
    background: ROBOOST_UI_THEME.accentSoft,
    color: ROBOOST_UI_THEME.accentText,
    border: ROBOOST_UI_THEME.accentBorder,
    solid: ROBOOST_UI_THEME.accent,
  },
  success: {
    background: ROBOOST_UI_THEME.successSoft,
    color: ROBOOST_UI_THEME.successText,
    border: ROBOOST_UI_THEME.successBorder,
    solid: ROBOOST_UI_THEME.success,
  },
  warning: {
    background: ROBOOST_UI_THEME.warningSoft,
    color: ROBOOST_UI_THEME.warningText,
    border: ROBOOST_UI_THEME.warningBorder,
    solid: ROBOOST_UI_THEME.warning,
  },
  danger: {
    background: ROBOOST_UI_THEME.dangerSoft,
    color: ROBOOST_UI_THEME.dangerText,
    border: ROBOOST_UI_THEME.dangerBorder,
    solid: ROBOOST_UI_THEME.danger,
  },
  info: {
    background: ROBOOST_UI_THEME.infoSoft,
    color: ROBOOST_UI_THEME.infoText,
    border: ROBOOST_UI_THEME.infoBorder,
    solid: ROBOOST_UI_THEME.info,
  },
};
