import { getRoboostNoPermissionAttribute } from '@/roboost-ui/utils/getRoboostNoPermissionAttributes';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useState } from 'react';

type RoboostRecordContainerProps = {
  id: string;
  title: string;
  count?: number;
  defaultOpen?: boolean;
  actions?: ReactNode;
  settingsEntries: MenuEntry[];
  isDropTarget: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  children: ReactNode;
};

export const RoboostRecordContainer = ({
  id,
  title,
  count,
  defaultOpen = true,
  actions,
  settingsEntries,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  children,
}: RoboostRecordContainerProps) => {
  const { t } = useLingui();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const canArrangeCards = useRoboostAccess().hasToggle('arrangeCards');
  const [isDraggable, setIsDraggable] = useState(false);

  return (
    <section
      className={cx('rb-rc', isDropTarget && 'is-drop-target')}
      aria-label={title}
      draggable={canArrangeCards && isDraggable}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(id);
      }}
      onDragEnd={() => {
        setIsDraggable(false);
        onDragEnd();
      }}
    >
      <div className={cx('rb-rc-head', !isOpen && 'is-plain')}>
        <span
          className="rb-rc-drag"
          title={canArrangeCards ? t`Drag to reorder` : undefined}
          data-rb-no-permission={getRoboostNoPermissionAttribute(
            canArrangeCards,
          )}
          aria-disabled={canArrangeCards ? undefined : true}
          onMouseDown={() => setIsDraggable(true)}
          onMouseUp={() => setIsDraggable(false)}
        >
          <Icon name="grip" size={14} />
        </span>
        <button
          type="button"
          className={cx('rb-rc-chev', !isOpen && 'is-closed')}
          aria-label={isOpen ? t`Collapse ${title}` : t`Expand ${title}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Icon name="caret" size={14} />
        </button>
        <span className="rb-rc-title" title={title}>
          {title}
        </span>
        {count !== undefined && <span className="rb-rc-count">{count}</span>}
        <span className="rb-sp" />
        {actions}
        <Menu
          align="right"
          minWidth={240}
          entries={settingsEntries}
          trigger={({ toggle, isOpen: isMenuOpen }) => (
            <button
              type="button"
              className="rb-rc-iconbtn"
              aria-label={t`${title} settings`}
              aria-expanded={isMenuOpen}
              onClick={toggle}
            >
              <Icon name="gear" size={14} />
            </button>
          )}
        />
      </div>
      {isOpen && children}
    </section>
  );
};
