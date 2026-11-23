import { Icon } from '@/roboost-ui/components/Icon';
import { MenuSearch } from '@/roboost-ui/components/MenuSearch';
import { ROBOOST_MENU_SEARCH_THRESHOLD } from '@/roboost-ui/constants/RoboostMenuSearchThreshold';
import { useRoboostCloseOnOutsideScroll } from '@/roboost-ui/hooks/useRoboostCloseOnOutsideScroll';
import { useRoboostPopoverPosition } from '@/roboost-ui/hooks/useRoboostPopoverPosition';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type FocusEvent, type ReactNode, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

export type MenuEntry =
  | {
      id: string;
      label: string;
      icon?: RoboostIconName;
      isSelected?: boolean;
      isDanger?: boolean;
      isDisabled?: boolean;
      hint?: string;
      description?: string;
      onSelect: () => void;
    }
  | { id: string; label: string; icon?: RoboostIconName; href: string }
  | { id: string; isSeparator: true }
  | { id: string; heading: string };

export type MenuProps = {
  trigger: (props: { isOpen: boolean; toggle: () => void }) => ReactNode;
  entries: MenuEntry[];
  align?: 'left' | 'right';
  header?: ReactNode;
  footer?: ReactNode;
  keepOpenOnSelect?: boolean;
  minWidth?: number;
  placement?: 'below' | 'above';
  isSearchable?: boolean;
  searchPlaceholder?: string;
};

const isActionEntry = (
  entry: MenuEntry,
): entry is Extract<MenuEntry, { label: string }> => 'label' in entry;

export const Menu = ({
  trigger,
  entries,
  align = 'left',
  header,
  footer,
  keepOpenOnSelect = false,
  minWidth = 200,
  placement = 'below',
  isSearchable,
  searchPlaceholder,
}: MenuProps) => {
  const { t } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { position, updatePosition } = useRoboostPopoverPosition({
    anchorRef,
    align,
    placement,
  });

  const actionEntries = entries.filter(isActionEntry);
  const showSearch =
    isSearchable ?? actionEntries.length > ROBOOST_MENU_SEARCH_THRESHOLD;
  const searchTerm = search.trim().toLowerCase();
  const visibleEntries =
    showSearch && searchTerm !== ''
      ? actionEntries.filter((entry) =>
          `${entry.label} ${'description' in entry ? (entry.description ?? '') : ''}`
            .toLowerCase()
            .includes(searchTerm),
        )
      : entries;

  // Popovers live in a body portal so scrolling panels and modals never clip them
  const open = () => {
    updatePosition();
    setSearch('');
    setIsOpen(true);
  };

  useRoboostCloseOnOutsideScroll({
    isOpen,
    popoverRef: menuRef,
    onReposition: updatePosition,
    onClose: () => setIsOpen(false),
  });

  // The list lives in a body portal, so focus moving into it (the search box) is not leaving the menu
  const closeWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>) => {
    if (
      !event.currentTarget.contains(event.relatedTarget) &&
      menuRef.current?.contains(event.relatedTarget) !== true
    ) {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={anchorRef}
      className="rb-menu-anchor"
      onBlur={closeWhenFocusLeaves}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      }}
    >
      {trigger({
        isOpen,
        toggle: () => (isOpen ? setIsOpen(false) : open()),
      })}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="rb-ui rb-menu rb-menu-portal"
            style={{ minWidth, ...position }}
            role="menu"
            tabIndex={-1}
            onMouseDown={(event) => {
              if (!(event.target instanceof HTMLInputElement)) {
                event.preventDefault();
              }
            }}
          >
            {showSearch && (
              <MenuSearch
                value={search}
                onChange={setSearch}
                placeholder={searchPlaceholder}
              />
            )}
            {header}
            <div className="rb-menu-list">
              {visibleEntries.map((entry) => {
                if ('isSeparator' in entry) {
                  return <div key={entry.id} className="rb-menu-sep" />;
                }

                if ('heading' in entry) {
                  return (
                    <div key={entry.id} className="rb-menu-heading">
                      {entry.heading}
                    </div>
                  );
                }

                const content = (
                  <>
                    {entry.icon !== undefined && (
                      <Icon name={entry.icon} size={16} />
                    )}
                    {'description' in entry &&
                    entry.description !== undefined ? (
                      <span className="rb-menu-label rb-menu-two-line">
                        <span className="rb-menu-label-main">
                          {entry.label}
                        </span>
                        <span className="rb-menu-label-sub">
                          {entry.description}
                        </span>
                      </span>
                    ) : (
                      <span className="rb-menu-label">{entry.label}</span>
                    )}
                    {'hint' in entry && entry.hint !== undefined && (
                      <span className="rb-menu-hint">{entry.hint}</span>
                    )}
                    {'isSelected' in entry && entry.isSelected === true && (
                      <Icon name="check" size={16} />
                    )}
                  </>
                );

                if ('href' in entry) {
                  return (
                    <Link
                      key={entry.id}
                      to={entry.href}
                      role="menuitem"
                      className="rb-menu-item"
                      onClick={() => setIsOpen(false)}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={entry.id}
                    type="button"
                    role={
                      entry.isSelected !== undefined
                        ? 'menuitemcheckbox'
                        : 'menuitem'
                    }
                    aria-checked={entry.isSelected}
                    aria-disabled={entry.isDisabled}
                    className={cx(
                      'rb-menu-item',
                      entry.isDanger === true && 'rb-menu-item-danger',
                      entry.isDisabled === true && 'is-disabled',
                    )}
                    aria-selected={entry.isSelected}
                    onClick={() => {
                      entry.onSelect();
                      if (!keepOpenOnSelect) {
                        setIsOpen(false);
                      }
                    }}
                  >
                    {content}
                  </button>
                );
              })}
              {showSearch && visibleEntries.length === 0 && (
                <div className="rb-menu-empty">{t`No matches`}</div>
              )}
            </div>
            {footer}
          </div>,
          document.body,
        )}
    </div>
  );
};
