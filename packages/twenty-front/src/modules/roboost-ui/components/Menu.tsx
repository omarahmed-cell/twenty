import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import {
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';

export type MenuEntry =
  | {
      id: string;
      label: string;
      icon?: RoboostIconName;
      isSelected?: boolean;
      isDanger?: boolean;
      isDisabled?: boolean;
      hint?: string;
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
};

export const Menu = ({
  trigger,
  entries,
  align = 'left',
  header,
  footer,
  keepOpenOnSelect = false,
  minWidth = 200,
  placement = 'below',
}: MenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Popovers live in a body portal so scrolling panels and modals never clip them
  const open = () => {
    const rect = anchorRef.current?.getBoundingClientRect();

    if (isDefined(rect)) {
      setPosition({
        ...(placement === 'above'
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        ...(align === 'right'
          ? { right: Math.max(8, window.innerWidth - rect.right) }
          : { left: Math.max(8, rect.left) }),
      });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const close = (event: Event) => {
      if (
        event.target instanceof Node &&
        menuRef.current?.contains(event.target) === true
      ) {
        return;
      }
      setIsOpen(false);
    };

    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);

    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);

  const closeWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
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
            onMouseDown={(event) => event.preventDefault()}
          >
            {header}
            {entries.map((entry) => {
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
                  <span className="rb-menu-label">{entry.label}</span>
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
            {footer}
          </div>,
          document.body,
        )}
    </div>
  );
};
