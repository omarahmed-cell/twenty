import { FieldDropdown } from '@/roboost-ui/components/FieldDropdown';
import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { ROBOOST_MENU_SEARCH_THRESHOLD } from '@/roboost-ui/constants/RoboostMenuSearchThreshold';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  // Consecutive options with the same group get one header above them
  group?: string;
  icon?: RoboostIconName;
};

export type SelectProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  autoOpen?: boolean;
  // Fields always show the search box; short control lists only when they are long
  isSearchable?: boolean;
  // Clicking the selected option again clears the value (onChange receives '')
  isClearable?: boolean;
};

export const Select = ({
  options,
  value,
  defaultValue,
  placeholder,
  onChange,
  className,
  style,
  'aria-label': ariaLabel,
  autoOpen = false,
  isSearchable,
  isClearable = false,
}: SelectProps) => {
  const { t } = useLingui();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const currentValue = value ?? uncontrolledValue;
  const currentOption = options.find((option) => option.value === currentValue);

  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
      triggerRef.current?.focus();
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (nextValue: string | null) => {
    setIsOpen(false);
    const chosenValue = nextValue ?? '';

    if (value === undefined) {
      setUncontrolledValue(chosenValue);
    }
    onChange?.(chosenValue);
    triggerRef.current?.focus();
  };

  return (
    <div ref={anchorRef} className={cx('rb-select', className)} style={style}>
      <button
        ref={triggerRef}
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
        <FieldDropdown
          anchorRef={anchorRef}
          options={options}
          mode="single"
          selectedValues={currentValue === undefined ? [] : [currentValue]}
          isClearable={isClearable}
          isSearchable={
            isSearchable ?? options.length > ROBOOST_MENU_SEARCH_THRESHOLD
          }
          aria-label={ariaLabel}
          onChoose={choose}
          onDismiss={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
