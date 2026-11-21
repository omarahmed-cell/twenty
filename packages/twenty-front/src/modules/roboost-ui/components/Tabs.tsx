import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import { type ReactNode, useState } from 'react';

export type TabItem = {
  id: string;
  label: ReactNode;
  count?: number;
  icon?: RoboostIconName;
};

export type TabsProps = {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  className?: string;
  hasBorder?: boolean;
};

export const Tabs = ({
  tabs,
  value,
  defaultValue,
  onChange,
  className,
  hasBorder = true,
}: TabsProps) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue ?? tabs[0]?.id,
  );
  const activeId = value ?? uncontrolledValue;

  const pick = (id: string) => {
    if (value === undefined) {
      setUncontrolledValue(id);
    }
    onChange?.(id);
  };

  return (
    <div
      className={cx('rb-tabs', className)}
      style={hasBorder ? undefined : { borderBottom: 'none' }}
    >
      <div className="rb-tablist" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className="rb-tab"
            aria-selected={tab.id === activeId}
            onClick={() => pick(tab.id)}
          >
            {tab.icon !== undefined && <Icon name={tab.icon} size={16} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="rb-tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
