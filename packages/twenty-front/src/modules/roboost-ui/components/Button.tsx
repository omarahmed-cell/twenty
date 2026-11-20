import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_BUTTON_COLORS } from '@/roboost-ui/constants/RoboostButtonColors';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { styled } from '@linaria/react';
import { type MouseEvent, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const HEIGHT_BY_SIZE: Record<ButtonSize, string> = {
  sm: '26px',
  md: '32px',
  lg: '38px',
};

type StyledButtonProps = {
  variant: ButtonVariant;
  size: ButtonSize;
  isDanger: boolean;
  iconOnly: boolean;
};

const getColors = ({ variant, isDanger }: StyledButtonProps) =>
  ROBOOST_BUTTON_COLORS[variant][isDanger ? 'danger' : 'default'];

const PADDING_BY_SIZE: Record<ButtonSize, string> = {
  sm: '0 8px',
  md: '0 12px',
  lg: '0 16px',
};

const FONT_SIZE_BY_SIZE: Record<ButtonSize, string> = {
  sm: '12px',
  md: '13px',
  lg: '14px',
};

const StyledButton = styled.button<StyledButtonProps>`
  align-items: center;
  background: ${(props) => getColors(props).background};
  border: 1px solid ${(props) => getColors(props).border};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  box-sizing: border-box;
  color: ${(props) => getColors(props).color};
  cursor: pointer;
  display: inline-flex;
  flex: none;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: ${({ size }) => FONT_SIZE_BY_SIZE[size]};
  font-weight: 500;
  gap: 6px;
  height: ${({ size }) => HEIGHT_BY_SIZE[size]};
  justify-content: center;
  line-height: 16px;
  padding: ${({ size, iconOnly }) => (iconOnly ? '0' : PADDING_BY_SIZE[size])};
  text-decoration: none;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
  user-select: none;
  white-space: nowrap;
  width: ${({ size, iconOnly }) => (iconOnly ? HEIGHT_BY_SIZE[size] : 'auto')};

  &:hover:not(:disabled) {
    background: ${(props) => getColors(props).hoverBackground};
    border-color: ${(props) => getColors(props).hoverBorder};
    color: ${(props) => getColors(props).hoverColor};
  }

  &:active:not(:disabled) {
    background: ${(props) => getColors(props).activeBackground};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    box-shadow: ${ROBOOST_UI_THEME.shadowFocus};
    outline: none;
  }
`;

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: 'danger';
  icon?: RoboostIconName;
  iconOnly?: boolean;
  children?: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  title?: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: 'menu' | 'listbox' | 'dialog';
};

export const Button = ({
  variant = 'secondary',
  size = 'md',
  tone,
  icon,
  iconOnly = false,
  children,
  type = 'button',
  disabled,
  title,
  className,
  onClick,
  'aria-label': ariaLabel,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
}: ButtonProps) => (
  <StyledButton
    variant={variant}
    size={size}
    isDanger={tone === 'danger'}
    iconOnly={iconOnly}
    type={type}
    disabled={disabled}
    title={title}
    className={className}
    onClick={onClick}
    aria-label={ariaLabel}
    aria-expanded={ariaExpanded}
    aria-haspopup={ariaHasPopup}
  >
    {icon !== undefined && <Icon name={icon} size={16} />}
    {children}
  </StyledButton>
);
