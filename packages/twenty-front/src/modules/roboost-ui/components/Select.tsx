import { Icon } from '@/roboost-ui/components/Icon';
import { MenuSearch } from '@/roboost-ui/components/MenuSearch';
import { ROBOOST_MENU_SEARCH_THRESHOLD } from '@/roboost-ui/constants/RoboostMenuSearchThreshold';
import { useRoboostCloseOnOutsideScroll } from '@/roboost-ui/hooks/useRoboostCloseOnOutsideScroll';
import { useRoboostPopoverPosition } from '@/roboost-ui/hooks/useRoboostPopoverPosition';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type CSSProperties, type FocusEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
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
}: SelectProps) => {
  const { t } = useLingui();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { position, updatePosition } = useRoboostPopoverPosition({
    anchorRef,
    matchAnchorWidth: true,
  });
  const currentValue = value ?? uncontrolledValue;
  const currentOption = options.find((option) => option.value === currentValue);
  const showSearch = options.length > ROBOOST_MENU_SEARCH_THRESHOLD;
  const searchTerm = search.trim().toLowerCase();
  const visibleOptions =
    searchTerm === ''
      ? options
      : options.filter((option) =>
          `${option.label} ${option.description ?? ''}`
            .toLowerCase()
            .includes(searchTerm),
        );

  const open = () => {
    updatePosition();
    setSearch('');
    setIsOpen(true);
  };

  useRoboostCloseOnOutsideScroll({
    isOpen,
    popoverRef: menuRef,
    onClose: () => setIsOpen(false),
  });

  const choose = (option: SelectOption) => {
    if (value === undefined) {
      setUncontrolledValue(option.value);
    }
    setIsOpen(false);
    onChange?.(option.value);
  };

  return (
    <div
      ref={anchorRef}
      className={cx('rb-select', className)}
      style={style}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (
          !event.currentTarget.contains(event.relatedTarget) &&
          menuRef.current?.contains(event.relatedTarget) !== true
        ) {
          setIsOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
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
        onClick={() => (isOpen ? setIsOpen(false) : open())}
      >
        <span className="rb-truncate">
          {currentOption?.label ?? placeholder ?? t`Select`}
        </span>
        <Icon name="caret" className="rb-caret" size={16} />
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="rb-ui rb-menu rb-menu-portal"
            style={position}
            role="listbox"
            tabIndex={-1}
            onMouseDown={(event) => {
              if (!(event.target instanceof HTMLInputElement)) {
                event.preventDefault();
              }
            }}
            onBlur={(event) => {
              if (
                !event.currentTarget.contains(event.relatedTarget) &&
                anchorRef.current?.contains(event.relatedTarget) !== true
              ) {
                setIsOpen(false);
              }
            }}
          >
            {showSearch && <MenuSearch value={search} onChange={setSearch} />}
            {visibleOptions.map((option) => (
              <div
                key={option.value}
                role="option"
                className="rb-menu-item"
                aria-selected={option.value === currentValue}
                onClick={() => choose(option)}
              >
                {option.description !== undefined ? (
                  <span className="rb-menu-label rb-menu-two-line">
                    <span className="rb-menu-label-main">{option.label}</span>
                    <span className="rb-menu-label-sub">
                      {option.description}
                    </span>
                  </span>
                ) : (
                  <span className="rb-menu-label">{option.label}</span>
                )}
                {option.value === currentValue && (
                  <Icon name="check" size={16} />
                )}
              </div>
            ))}
            {visibleOptions.length === 0 && (
              <div className="rb-menu-empty">{t`No matches`}</div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};
