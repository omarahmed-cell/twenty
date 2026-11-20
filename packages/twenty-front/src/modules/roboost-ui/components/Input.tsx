import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { styled } from '@linaria/react';
import { type ChangeEvent, type KeyboardEvent } from 'react';

const StyledWrap = styled.span`
  align-items: center;
  display: flex;
  position: relative;
  width: 100%;

  > svg {
    color: ${ROBOOST_UI_THEME.textMuted};
    left: 12px;
    pointer-events: none;
    position: absolute;
  }
`;

const StyledInput = styled.input<{ hasIcon: boolean; isSmall: boolean }>`
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.borderStrong};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  box-sizing: border-box;
  color: ${ROBOOST_UI_THEME.text};
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: ${({ isSmall }) => (isSmall ? '13px' : '14px')};
  height: ${({ isSmall }) => (isSmall ? '28px' : '32px')};
  line-height: 20px;
  padding: ${({ hasIcon }) => (hasIcon ? '0 12px 0 34px' : '0 12px')};
  transition:
    border-color 0.12s,
    box-shadow 0.12s;
  width: 100%;

  &::placeholder {
    color: ${ROBOOST_UI_THEME.textMuted};
  }

  &:hover {
    border-color: ${ROBOOST_UI_THEME.controlHoverBorder};
  }

  &:focus-visible {
    border-color: ${ROBOOST_UI_THEME.accent};
    box-shadow: ${ROBOOST_UI_THEME.shadowFocus};
    outline: none;
  }

  &[aria-invalid='true'] {
    border-color: ${ROBOOST_UI_THEME.danger};
  }

  &:disabled {
    background: ${ROBOOST_UI_THEME.surfaceSunken};
    color: ${ROBOOST_UI_THEME.textDisabled};
    cursor: not-allowed;
  }
`;

export type InputProps = {
  icon?: RoboostIconName;
  invalid?: boolean;
  size?: 'sm' | 'md';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'search' | 'email' | 'number';
  name?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  'aria-label'?: string;
};

export const Input = ({
  icon,
  invalid,
  size = 'md',
  value,
  defaultValue,
  placeholder,
  disabled,
  type = 'text',
  name,
  onChange,
  onKeyDown,
  'aria-label': ariaLabel,
}: InputProps) => (
  <StyledWrap>
    {icon !== undefined && <Icon name={icon} />}
    <StyledInput
      hasIcon={icon !== undefined}
      isSmall={size === 'sm'}
      aria-invalid={invalid === true ? 'true' : undefined}
      aria-label={ariaLabel}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      type={type}
      name={name}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  </StyledWrap>
);
