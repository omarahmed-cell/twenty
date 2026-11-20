import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';

const StyledScrim = styled.div<{ isInline: boolean }>`
  align-items: center;
  background: ${ROBOOST_UI_THEME.overlay};
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 24px;
  position: ${({ isInline }) => (isInline ? 'absolute' : 'fixed')};
  z-index: 50;
`;

const StyledModal = styled.div`
  background: ${ROBOOST_UI_THEME.surface};
  border-radius: ${ROBOOST_UI_THEME.radiusMd};
  box-shadow: ${ROBOOST_UI_THEME.shadowLg};
  display: flex;
  flex-direction: column;
  max-height: 100%;
  max-width: 440px;
  overflow: hidden;
  width: 100%;
`;

const StyledHead = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 12px;
  padding: 20px 20px 12px;
`;

const StyledTitleBlock = styled.div`
  flex: 1;
`;

const StyledTitle = styled.div`
  color: ${ROBOOST_UI_THEME.text};
  font-family: ${ROBOOST_UI_THEME.fontDisplay};
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
`;

const StyledSubtitle = styled.div`
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 13px;
  margin-top: 2px;
`;

const StyledDangerIcon = styled.span`
  align-items: center;
  background: ${ROBOOST_UI_THEME.dangerSoft};
  border-radius: ${ROBOOST_UI_THEME.radiusFull};
  color: ${ROBOOST_UI_THEME.dangerText};
  display: inline-flex;
  flex: none;
  height: 36px;
  justify-content: center;
  width: 36px;
`;

const StyledBody = styled.div`
  color: ${ROBOOST_UI_THEME.textSecondary};
  font-size: 14px;
  line-height: 20px;
  overflow: auto;
  padding: 0 20px 20px;
`;

const StyledFoot = styled.div`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surfaceSunken};
  border-top: 1px solid ${ROBOOST_UI_THEME.border};
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 20px;
`;

export type ModalProps = {
  open?: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  tone?: 'default' | 'danger';
  footer?: ReactNode;
  onClose?: () => void;
  inline?: boolean;
  children?: ReactNode;
};

export const Modal = ({
  open = true,
  title,
  subtitle,
  tone = 'default',
  footer,
  onClose,
  inline = false,
  children,
}: ModalProps) => {
  const { t } = useLingui();

  if (!open) {
    return null;
  }

  return (
    <StyledScrim
      isInline={inline}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <StyledModal role="dialog" aria-modal="true">
        <StyledHead>
          {tone === 'danger' && (
            <StyledDangerIcon>
              <Icon name="alert-triangle" />
            </StyledDangerIcon>
          )}
          <StyledTitleBlock>
            <StyledTitle>{title}</StyledTitle>
            {subtitle !== undefined && (
              <StyledSubtitle>{subtitle}</StyledSubtitle>
            )}
          </StyledTitleBlock>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon="x"
            aria-label={t`Close`}
            onClick={onClose}
          />
        </StyledHead>
        <StyledBody>{children}</StyledBody>
        {footer !== undefined && <StyledFoot>{footer}</StyledFoot>}
      </StyledModal>
    </StyledScrim>
  );
};
