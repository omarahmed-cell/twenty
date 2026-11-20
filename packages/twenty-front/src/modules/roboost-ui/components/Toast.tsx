import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_TONE_COLORS } from '@/roboost-ui/constants/RoboostToneColors';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';

type ToastTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const ICON_BY_TONE: Record<ToastTone, RoboostIconName> = {
  success: 'check-circle',
  danger: 'alert-triangle',
  warning: 'alert-triangle',
  info: 'info',
  neutral: 'info',
};

const StyledToast = styled.div<{ tone: ToastTone }>`
  align-items: flex-start;
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.border};
  border-left: 3px solid
    ${({ tone }) =>
      tone === 'neutral'
        ? ROBOOST_UI_THEME.borderStrong
        : ROBOOST_TONE_COLORS[tone].solid};
  border-radius: ${ROBOOST_UI_THEME.radiusMd};
  box-shadow: ${ROBOOST_UI_THEME.shadowMd};
  display: flex;
  gap: 12px;
  max-width: 100%;
  padding: 12px 12px 12px 16px;
  width: 360px;
`;

const StyledIcon = styled.span<{ tone: ToastTone }>`
  color: ${({ tone }) => ROBOOST_TONE_COLORS[tone].color};
  flex: none;
  margin-top: 1px;
`;

const StyledMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledTitle = styled.div`
  color: ${ROBOOST_UI_THEME.text};
  font-size: 13px;
  font-weight: 600;
`;

const StyledMessage = styled.div`
  color: ${ROBOOST_UI_THEME.textSecondary};
  font-size: 13px;
  margin-top: 1px;
`;

const StyledAction = styled.div`
  margin-top: 8px;
`;

const StyledClose = styled.button`
  background: none;
  border: none;
  border-radius: ${ROBOOST_UI_THEME.radiusXs};
  color: ${ROBOOST_UI_THEME.textMuted};
  cursor: pointer;
  display: inline-flex;
  flex: none;
  padding: 2px;

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    color: ${ROBOOST_UI_THEME.text};
  }
`;

export type ToastProps = {
  tone?: ToastTone;
  title?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  children?: ReactNode;
};

export const Toast = ({
  tone = 'neutral',
  title,
  action,
  onClose,
  children,
}: ToastProps) => {
  const { t } = useLingui();

  return (
    <StyledToast tone={tone} role="status">
      <StyledIcon tone={tone}>
        <Icon name={ICON_BY_TONE[tone]} />
      </StyledIcon>
      <StyledMain>
        {title !== undefined && <StyledTitle>{title}</StyledTitle>}
        {children !== undefined && <StyledMessage>{children}</StyledMessage>}
        {action !== undefined && <StyledAction>{action}</StyledAction>}
      </StyledMain>
      {onClose !== undefined && (
        <StyledClose type="button" aria-label={t`Dismiss`} onClick={onClose}>
          <Icon name="x" size={16} />
        </StyledClose>
      )}
    </StyledToast>
  );
};
