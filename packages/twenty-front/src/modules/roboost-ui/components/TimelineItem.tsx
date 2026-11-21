import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import { type ReactNode } from 'react';

export type TimelineItemProps = {
  icon?: RoboostIconName;
  tone?: 'accent' | 'success' | 'warning';
  title: ReactNode;
  time?: ReactNode;
  children?: ReactNode;
};

export const TimelineItem = ({
  icon = 'dot',
  tone,
  title,
  time,
  children,
}: TimelineItemProps) => (
  <div className="rb-tl-item">
    <div className="rb-tl-rail">
      <span className={cx('rb-tl-node', tone !== undefined && `is-${tone}`)}>
        <Icon name={icon} size={15} />
      </span>
      <span className="rb-tl-line" />
    </div>
    <div className="rb-tl-body">
      <div className="rb-tl-title">{title}</div>
      {time !== undefined && <div className="rb-tl-time">{time}</div>}
      {children !== undefined && <div className="rb-tl-note">{children}</div>}
    </div>
  </div>
);
