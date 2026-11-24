import { FieldDropdown } from '@/roboost-ui/components/FieldDropdown';
import { Icon } from '@/roboost-ui/components/Icon';
import { type SelectOption } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

export type MultiSelectProps = {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  autoOpen?: boolean;
};

// Ticks stay a draft until Save, so a mis-click never writes half a selection
export const MultiSelect = ({
  options,
  value,
  onChange,
  onCancel,
  placeholder,
  className,
  style,
  'aria-label': ariaLabel,
  autoOpen = false,
}: MultiSelectProps) => {
  const { t } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
      triggerRef.current?.focus();
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = () => {
    setIsOpen(false);
    onCancel?.();
  };

  return (
    <div ref={anchorRef} className={cx('rb-select', className)} style={style}>
      <button
        ref={triggerRef}
        type="button"
        className={cx(
          'rb-select-trigger',
          selectedLabels.length === 0 && 'is-placeholder',
        )}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? cancel() : setIsOpen(true))}
      >
        <span className="rb-truncate">
          {selectedLabels.length > 0
            ? selectedLabels.join(', ')
            : (placeholder ?? t`Select`)}
        </span>
        <Icon name="caret" className="rb-caret" size={16} />
      </button>
      {isOpen && (
        <FieldDropdown
          anchorRef={anchorRef}
          options={options}
          mode="multi"
          selectedValues={value}
          aria-label={ariaLabel}
          onSave={(values) => {
            setIsOpen(false);
            onChange(values);
          }}
          onDismiss={cancel}
        />
      )}
    </div>
  );
};
