import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import { type ReactNode } from 'react';

export type FilterChipProps = {
  label: ReactNode;
  value?: ReactNode;
  icon?: RoboostIconName;
  isActive?: boolean;
  entries: MenuEntry[];
  keepOpenOnSelect?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  align?: 'left' | 'right';
};

export const FilterChip = ({
  label,
  value,
  icon,
  isActive = false,
  entries,
  keepOpenOnSelect = false,
  header,
  footer,
  align,
}: FilterChipProps) => (
  <Menu
    entries={entries}
    keepOpenOnSelect={keepOpenOnSelect}
    header={header}
    footer={footer}
    align={align}
    trigger={({ toggle, isOpen }) => (
      <button
        type="button"
        className={cx('rb-chip', isActive && 'is-on')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={toggle}
      >
        {icon !== undefined && <Icon name={icon} size={14} />}
        <span>{label}</span>
        {value !== undefined && <span className="rb-chip-value">{value}</span>}
        <Icon name="caret" size={14} />
      </button>
    )}
  />
);
