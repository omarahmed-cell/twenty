import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import { type MouseEvent, type ReactNode } from 'react';

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
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
  'aria-pressed'?: boolean;
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
  'aria-pressed': ariaPressed,
}: ButtonProps) => (
  <button
    type={type}
    className={cx(
      'rb-btn',
      `rb-btn-${variant}`,
      `rb-btn-${size}`,
      tone === 'danger' && 'rb-btn-danger',
      iconOnly && 'rb-btn-icon',
      className,
    )}
    disabled={disabled}
    title={title}
    onClick={onClick}
    aria-label={ariaLabel}
    aria-expanded={ariaExpanded}
    aria-haspopup={ariaHasPopup}
    aria-pressed={ariaPressed}
  >
    {icon !== undefined && <Icon name={icon} size={16} />}
    {children !== undefined && children !== null && <span>{children}</span>}
  </button>
);
