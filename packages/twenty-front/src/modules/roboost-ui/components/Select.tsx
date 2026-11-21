import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type CSSProperties, type FocusEvent, useState } from 'react';

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  defaultOpen?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
};

export const Select = ({
  options,
  value,
  defaultValue,
  placeholder,
  defaultOpen = false,
  onChange,
  className,
  style,
  'aria-label': ariaLabel,
}: SelectProps) => {
  const { t } = useLingui();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const currentValue = value ?? uncontrolledValue;
  const currentOption = options.find((option) => option.value === currentValue);

  const choose = (option: SelectOption) => {
    if (value === undefined) {
      setUncontrolledValue(option.value);
    }
    setIsOpen(false);
    onChange?.(option.value);
  };

  return (
    <div
      className={cx('rb-select', className)}
      style={style}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        className={cx(
          'rb-select-trigger',
          currentOption === undefined && 'is-placeholder',
        )}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="rb-truncate">
          {currentOption?.label ?? placeholder ?? t`Select`}
        </span>
        <Icon name="caret" className="rb-caret" size={16} />
      </button>
      {isOpen && (
        <div
          className="rb-menu"
          role="listbox"
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
        >
          {options.map((option) => (
            <div
              key={option.value}
              role="option"
              className="rb-menu-item"
              aria-selected={option.value === currentValue}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {option.value === currentValue && <Icon name="check" size={16} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
