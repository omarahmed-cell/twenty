import { FieldDropdown } from '@/roboost-ui/components/FieldDropdown';
import { Icon } from '@/roboost-ui/components/Icon';
import { type SelectOption } from '@/roboost-ui/components/Select';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

const FIELD_CONTAINER_SELECTOR = '.rb-prop, td, .rb-actx-field';
const TABLE_MIN_WIDTH = 240;
const EMPTY_DISPLAY = '—';

type RoboostInlineFieldDropdownProps = {
  options: SelectOption[];
  mode: 'single' | 'multi';
  selectedValues: string[];
  onChange: (value: string | string[] | null) => void;
  onCancel?: () => void;
  'aria-label'?: string;
};

// In place of the value, like HubSpot: the field keeps showing its value and the list comes out from under it
export const RoboostInlineFieldDropdown = ({
  options,
  mode,
  selectedValues,
  onChange,
  onCancel,
  'aria-label': ariaLabel,
}: RoboostInlineFieldDropdownProps) => {
  const valueRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const anchorRef = useMemo(() => ({ current: anchor }), [anchor]);
  const labels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  useLayoutEffect(() => {
    const container =
      valueRef.current?.closest<HTMLElement>(FIELD_CONTAINER_SELECTOR) ??
      valueRef.current;

    setAnchor(container ?? null);
  }, []);

  return (
    <div ref={valueRef} className="rb-fdd-value">
      <span className="rb-truncate">
        {labels.length > 0 ? labels.join(', ') : EMPTY_DISPLAY}
      </span>
      <Icon name="caret" size={14} className="rb-fdd-caret" />
      {anchor !== null && (
        <FieldDropdown
          anchorRef={anchorRef}
          options={options}
          mode={mode}
          selectedValues={selectedValues}
          minWidth={anchor.tagName === 'TD' ? TABLE_MIN_WIDTH : 0}
          isClearable
          aria-label={ariaLabel}
          onChoose={(value) => onChange(value)}
          onSave={(values) => onChange(values)}
          onDismiss={() => onCancel?.()}
        />
      )}
    </div>
  );
};
