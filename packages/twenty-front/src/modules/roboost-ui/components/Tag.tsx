import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_TONE_COLORS } from '@/roboost-ui/constants/RoboostToneColors';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';

const StyledTag = styled.span<{ tone: RoboostTone; isSolid: boolean }>`
  align-items: center;
  background: ${({ tone, isSolid }) =>
    isSolid ? ROBOOST_UI_THEME.accent : ROBOOST_TONE_COLORS[tone].background};
  border: 1px solid
    ${({ tone, isSolid }) =>
      isSolid ? ROBOOST_UI_THEME.accent : ROBOOST_TONE_COLORS[tone].border};
  border-radius: ${ROBOOST_UI_THEME.radiusFull};
  box-sizing: border-box;
  color: ${({ tone, isSolid }) =>
    isSolid ? ROBOOST_UI_THEME.textOnAccent : ROBOOST_TONE_COLORS[tone].color};
  display: inline-flex;
  flex: none;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 12px;
  font-weight: 500;
  gap: 4px;
  height: 20px;
  line-height: 1;
  max-width: 100%;
  padding: 0 8px;
  white-space: nowrap;
`;

const StyledLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledDot = styled.span`
  background: currentColor;
  border-radius: 999px;
  flex: none;
  height: 6px;
  width: 6px;
`;

const StyledRemove = styled.span`
  cursor: pointer;
  display: inline-flex;
  margin-left: 2px;
  margin-right: -2px;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
`;

export type TagProps = {
  tone?: RoboostTone;
  dot?: boolean;
  solid?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  children?: ReactNode;
  className?: string;
};

export const Tag = ({
  tone = 'neutral',
  dot = false,
  solid = false,
  removable = false,
  onRemove,
  children,
  className,
}: TagProps) => {
  const { t } = useLingui();

  return (
    <StyledTag
      tone={tone}
      isSolid={solid && tone === 'accent'}
      className={className}
    >
      {dot && <StyledDot />}
      <StyledLabel>{children}</StyledLabel>
      {removable && (
        <StyledRemove role="button" aria-label={t`Remove`} onClick={onRemove}>
          <Icon name="x" size={12} strokeWidth={2.5} />
        </StyledRemove>
      )}
    </StyledTag>
  );
};
