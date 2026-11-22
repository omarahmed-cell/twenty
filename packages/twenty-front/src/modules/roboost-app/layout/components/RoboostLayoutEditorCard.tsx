import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { isDefined } from 'twenty-shared/utils';

export type RoboostLayoutDragProps = {
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

type RoboostLayoutEditorCardProps = {
  title: string;
  subtitle?: string;
  isHidden?: boolean;
  hasLogic?: boolean;
  onEdit?: () => void;
  onToggleHidden?: () => void;
  menuEntries?: (getAnchor: () => DOMRect) => MenuEntry[];
  drag: RoboostLayoutDragProps;
};

// One draggable row of the record view editor: name, summary, pencil, show/hide and ⋯
export const RoboostLayoutEditorCard = ({
  title,
  subtitle,
  isHidden = false,
  hasLogic = false,
  onEdit,
  onToggleHidden,
  menuEntries,
  drag,
}: RoboostLayoutEditorCardProps) => {
  const { t } = useLingui();
  const cardRef = useRef<HTMLDivElement>(null);
  const getAnchor = () =>
    cardRef.current?.getBoundingClientRect() ?? new DOMRect();

  return (
    <div
      ref={cardRef}
      className={cx(
        'rb-rve-card',
        isHidden && 'is-hidden',
        drag.isDragging && 'is-dragging',
        drag.isDropTarget && 'is-drop-target',
      )}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        drag.onDragStart();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        drag.onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        drag.onDrop();
      }}
      onDragEnd={drag.onDragEnd}
    >
      <span className="rb-rve-grip" aria-hidden>
        <Icon name="grip" size={14} />
      </span>
      <div className="rb-rve-card-main">
        <div className="rb-rve-card-title">
          <span title={title}>{title}</span>
          {hasLogic && (
            <span
              className="rb-rve-logic-badge"
              title={t`Has conditional logic`}
            >
              <Icon name="git-branch" size={12} />
              {t`Logic`}
            </span>
          )}
          {isHidden && <span className="rb-rve-hidden-badge">{t`Hidden`}</span>}
        </div>
        {isDefined(subtitle) && (
          <div className="rb-rve-card-sub" title={subtitle}>
            {subtitle}
          </div>
        )}
      </div>
      {isDefined(onToggleHidden) && (
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={isHidden ? t`Show ${title}` : t`Hide ${title}`}
          title={isHidden ? t`Show card` : t`Hide card`}
          onClick={onToggleHidden}
        >
          <Icon name="eye" size={15} />
        </button>
      )}
      {isDefined(onEdit) && (
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={t`Edit ${title}`}
          title={t`Edit card`}
          onClick={onEdit}
        >
          <Icon name="pencil" size={15} />
        </button>
      )}
      {isDefined(menuEntries) && (
        <Menu
          align="right"
          minWidth={210}
          entries={menuEntries(getAnchor)}
          trigger={({ toggle, isOpen }) => (
            <button
              type="button"
              className="rb-rc-iconbtn"
              aria-label={t`${title} options`}
              aria-expanded={isOpen}
              onClick={toggle}
            >
              <Icon name="more" size={15} />
            </button>
          )}
        />
      )}
    </div>
  );
};

type RoboostLayoutAddCardButtonProps = {
  label: string;
  onClick?: () => void;
  menuEntries?: MenuEntry[];
};

export const RoboostLayoutAddCardButton = ({
  label,
  onClick,
  menuEntries,
}: RoboostLayoutAddCardButtonProps) => {
  const button = (toggle?: () => void, isOpen?: boolean) => (
    <button
      type="button"
      className="rb-rve-add"
      aria-label={label}
      aria-expanded={isOpen}
      data-tooltip={label}
      onClick={toggle ?? onClick}
    >
      <Icon name="plus" size={14} />
    </button>
  );

  return (
    <div className="rb-rve-add-slot">
      {isDefined(menuEntries) ? (
        <Menu
          minWidth={220}
          entries={menuEntries}
          trigger={({ toggle, isOpen }) => button(toggle, isOpen)}
        />
      ) : (
        button()
      )}
    </div>
  );
};
