import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { MenuSearch } from '@/roboost-ui/components/MenuSearch';
import { type SelectOption } from '@/roboost-ui/components/Select';
import { ROBOOST_MENU_SEARCH_THRESHOLD } from '@/roboost-ui/constants/RoboostMenuSearchThreshold';
import { useRoboostCloseOnOutsideScroll } from '@/roboost-ui/hooks/useRoboostCloseOnOutsideScroll';
import { useRoboostPopoverPosition } from '@/roboost-ui/hooks/useRoboostPopoverPosition';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const [draft, setDraft] = useState<string[]>(value);
  const [search, setSearch] = useState('');
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { position, updatePosition } = useRoboostPopoverPosition({
    anchorRef,
    matchAnchorWidth: true,
  });
  const showSearch = options.length > ROBOOST_MENU_SEARCH_THRESHOLD;
  const searchTerm = search.trim().toLowerCase();
  const visibleOptions =
    searchTerm === ''
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(searchTerm),
        );
  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

  const open = () => {
    updatePosition();
    setDraft(value);
    setSearch('');
    setIsOpen(true);
  };

  const cancel = () => {
    setIsOpen(false);
    onCancel?.();
  };

  const save = () => {
    setIsOpen(false);
    const ordered = options
      .map((option) => option.value)
      .filter((optionValue) => draft.includes(optionValue));

    onChange(ordered);
  };

  useEffect(() => {
    if (autoOpen) {
      open();
      triggerRef.current?.focus();
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRoboostCloseOnOutsideScroll({
    isOpen,
    popoverRef: menuRef,
    onClose: cancel,
    onReposition: updatePosition,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const cancelOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        (menuRef.current?.contains(target) === true ||
          anchorRef.current?.contains(target) === true)
      ) {
        return;
      }
      cancel();
    };

    document.addEventListener('pointerdown', cancelOnOutsidePointer);

    return () =>
      document.removeEventListener('pointerdown', cancelOnOutsidePointer);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div
      ref={anchorRef}
      className={cx('rb-select', className)}
      style={style}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation();
          cancel();
        }
      }}
    >
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
        onClick={() => (isOpen ? cancel() : open())}
      >
        <span className="rb-truncate">
          {selectedLabels.length > 0
            ? selectedLabels.join(', ')
            : (placeholder ?? t`Select`)}
        </span>
        <Icon name="caret" className="rb-caret" size={16} />
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="rb-ui rb-menu rb-menu-portal rb-multi-menu"
            style={position}
            role="listbox"
            aria-multiselectable
            tabIndex={-1}
            onMouseDown={(event) => {
              if (!(event.target instanceof HTMLInputElement)) {
                event.preventDefault();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                cancel();
              }
            }}
          >
            {showSearch && <MenuSearch value={search} onChange={setSearch} />}
            <div className="rb-menu-list">
              {visibleOptions.map((option) => (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={draft.includes(option.value)}
                  className="rb-menu-item rb-multi-item"
                >
                  <Checkbox
                    checked={draft.includes(option.value)}
                    onChange={(checked) =>
                      setDraft((current) =>
                        checked
                          ? [...current, option.value]
                          : current.filter((item) => item !== option.value),
                      )
                    }
                  >
                    <span className="rb-menu-label">{option.label}</span>
                  </Checkbox>
                </div>
              ))}
              {visibleOptions.length === 0 && (
                <div className="rb-menu-empty">{t`No matches`}</div>
              )}
            </div>
            <div className="rb-multi-actions">
              <Button variant="secondary" size="sm" onClick={cancel}>
                {t`Cancel`}
              </Button>
              <Button variant="primary" size="sm" onClick={save}>
                {t`Save`}
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
