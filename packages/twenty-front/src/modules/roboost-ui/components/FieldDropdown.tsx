import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { MenuSearch } from '@/roboost-ui/components/MenuSearch';
import { type SelectOption } from '@/roboost-ui/components/Select';
import { useRoboostAnchoredPosition } from '@/roboost-ui/hooks/useRoboostAnchoredPosition';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type FieldDropdownProps = {
  anchorRef: RefObject<HTMLElement | null>;
  options: SelectOption[];
  mode: 'single' | 'multi';
  selectedValues: string[];
  // Single: the picked value, or null when the selected option is clicked again
  onChoose?: (value: string | null) => void;
  // Multi: the ticked values in option order, on Save or Enter-confirm
  onSave?: (values: string[]) => void;
  // Escape, Cancel or a click outside; nothing is saved
  onDismiss: () => void;
  minWidth?: number;
  // Field editors clear a single select when its selected option is clicked again
  isClearable?: boolean;
  isSearchable?: boolean;
  'aria-label'?: string;
};

// The one list for every select and multi-select field: it opens out of the field, search on top,
// the same size everywhere; multi-select adds checkboxes and Cancel / Save
export const FieldDropdown = ({
  anchorRef,
  options,
  mode,
  selectedValues,
  onChoose,
  onSave,
  onDismiss,
  minWidth = 0,
  isClearable = false,
  isSearchable = true,
  'aria-label': ariaLabel,
}: FieldDropdownProps) => {
  const { t } = useLingui();
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<string[]>(selectedValues);
  const [activeIndex, setActiveIndex] = useState(-1);
  const position = useRoboostAnchoredPosition({
    anchorRef,
    isOpen: true,
    minWidth,
  });
  const searchTerm = search.trim().toLowerCase();
  const visibleOptions =
    searchTerm === ''
      ? options
      : options.filter((option) =>
          `${option.label} ${option.description ?? ''}`
            .toLowerCase()
            .includes(searchTerm),
        );
  const isMulti = mode === 'multi';

  const toggle = (value: string) =>
    setDraft((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );

  const pick = (option: SelectOption) => {
    if (isMulti) {
      toggle(option.value);
      return;
    }
    onChoose?.(
      isClearable && selectedValues.includes(option.value)
        ? null
        : option.value,
    );
  };

  const save = () =>
    onSave?.(
      options
        .map((option) => option.value)
        .filter((value) => draft.includes(value)),
    );

  useEffect(() => {
    listRef.current
      ?.querySelector('.is-active')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    const dismissOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        (panelRef.current?.contains(target) === true ||
          anchorRef.current?.contains(target) === true)
      ) {
        return;
      }
      onDismiss();
    };

    document.addEventListener('pointerdown', dismissOnOutsidePointer, true);

    return () =>
      document.removeEventListener(
        'pointerdown',
        dismissOnOutsidePointer,
        true,
      );
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      ref={panelRef}
      className={cx(
        'rb-ui rb-menu rb-menu-portal rb-fdd',
        isMulti && 'is-multi',
      )}
      style={position}
      role="listbox"
      aria-label={ariaLabel}
      aria-multiselectable={isMulti}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onDismiss();
        }
      }}
      onMouseDown={(event) => {
        if (!(event.target instanceof HTMLInputElement)) {
          event.preventDefault();
        }
      }}
    >
      {isSearchable && (
        <MenuSearch
          value={search}
          onChange={(value) => {
            setSearch(value);
            setActiveIndex(value.trim() === '' ? -1 : 0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              const step = event.key === 'ArrowDown' ? 1 : -1;

              setActiveIndex((current) =>
                visibleOptions.length === 0
                  ? -1
                  : (current + step + visibleOptions.length) %
                    visibleOptions.length,
              );
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              event.stopPropagation();
              const option = visibleOptions[Math.max(activeIndex, 0)];

              if (option !== undefined && (activeIndex >= 0 || !isMulti)) {
                pick(option);
              } else if (isMulti) {
                save();
              }
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              onDismiss();
            }
          }}
        />
      )}
      <div ref={listRef} className="rb-menu-list rb-fdd-list">
        {visibleOptions.map((option, index) => {
          const isSelected = isMulti
            ? draft.includes(option.value)
            : selectedValues.includes(option.value);

          return (
            <div
              key={option.value}
              role="option"
              aria-selected={isSelected}
              title={option.label}
              className={cx(
                'rb-menu-item rb-fdd-item',
                index === activeIndex && 'is-active',
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => pick(option)}
            >
              {isMulti ? (
                <Checkbox checked={isSelected} onChange={() => {}}>
                  <span className="rb-menu-label">{option.label}</span>
                </Checkbox>
              ) : (
                <>
                  <span className="rb-menu-label">{option.label}</span>
                  {isSelected && <Icon name="check" size={16} />}
                </>
              )}
            </div>
          );
        })}
        {visibleOptions.length === 0 && (
          <div className="rb-menu-empty">{t`No matches`}</div>
        )}
      </div>
      {isMulti && (
        <div className="rb-multi-actions">
          <Button variant="secondary" size="sm" onClick={onDismiss}>
            {t`Cancel`}
          </Button>
          <Button variant="primary" size="sm" onClick={save}>
            {t`Save`}
          </Button>
        </div>
      )}
    </div>,
    document.body,
  );
};
