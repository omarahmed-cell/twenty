import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type Ref,
} from 'react';

export type InputProps = {
  icon?: RoboostIconName;
  invalid?: boolean;
  size?: 'sm' | 'md';
  variant?: 'default' | 'search';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  type?:
    | 'text'
    | 'search'
    | 'email'
    | 'number'
    | 'url'
    | 'datetime-local'
    | 'tel'
    | 'date';
  name?: string;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  'aria-label'?: string;
};

export const Input = ({
  icon,
  invalid,
  size = 'md',
  variant = 'default',
  value,
  defaultValue,
  placeholder,
  disabled,
  type = 'text',
  name,
  className,
  inputRef,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  'aria-label': ariaLabel,
}: InputProps) => {
  const resolvedIcon = icon ?? (variant === 'search' ? 'search' : undefined);

  return (
    <span
      className={cx(
        'rb-input-wrap',
        resolvedIcon !== undefined && 'has-icon',
        variant === 'search' && 'rb-input-search',
        className,
      )}
    >
      {resolvedIcon !== undefined && <Icon name={resolvedIcon} size={16} />}
      <input
        ref={inputRef}
        className={cx('rb-input', size === 'sm' && 'rb-input-sm')}
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
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </span>
  );
};
