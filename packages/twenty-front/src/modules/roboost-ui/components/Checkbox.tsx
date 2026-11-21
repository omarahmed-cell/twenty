import { Icon } from '@/roboost-ui/components/Icon';
import { type ChangeEvent, type ReactNode, useState } from 'react';

export type CheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  children?: ReactNode;
  'aria-label'?: string;
};

export const Checkbox = ({
  checked,
  defaultChecked = false,
  indeterminate = false,
  disabled = false,
  onChange,
  children,
  'aria-label': ariaLabel,
}: CheckboxProps) => {
  const [uncontrolledChecked, setUncontrolledChecked] =
    useState(defaultChecked);
  const isChecked = checked ?? uncontrolledChecked;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (checked === undefined) {
      setUncontrolledChecked(!isChecked);
    }
    onChange?.(!isChecked, event);
  };

  return (
    <label
      className="rb-check"
      data-checked={isChecked}
      data-indeterminate={indeterminate}
      data-disabled={disabled}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-checked={indeterminate ? 'mixed' : isChecked}
        onChange={handleChange}
      />
      <span className="rb-check-box">
        {!indeterminate && <Icon name="check" size={12} strokeWidth={3} />}
      </span>
      {children !== undefined && <span>{children}</span>}
    </label>
  );
};
